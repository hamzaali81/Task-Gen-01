import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { PrismaService } from '../prisma/prisma.service';
import { EventsService } from '../events/events.service';
import { BudgetItemsService } from '../budget-items/budget-items.service';
import { WebsocketsGateway } from '../websockets/websockets.gateway';
import {
  BusinessException,
  AIServiceException,
} from '../common/exceptions/business.exception';
import {
  GEMINI_MODEL,
  PROPOSAL_STATUS,
  ERROR_MESSAGES,
} from '../common/constants';
import { GeminiPromptBuilder } from './helpers/gemini-prompt.builder';

/**
 * Budget proposal item structure returned by Gemini
 */
export interface BudgetProposalItem {
  category: string;
  description: string;
  amount: number;
  currency: string;
}

/**
 * Service responsible for AI-powered budget proposal generation.
 *
 * Key responsibilities:
 * - Generate budget proposals via Google Gemini API
 * - Validate currency consistency (all items must match event currency)
 * - Manage proposal approval/rejection workflow (never writes directly to DB)
 * - Emit real-time updates via WebSocket on approval
 */
@Injectable()
export class AiChatService {
  private readonly logger = new Logger(AiChatService.name);
  private readonly genAI: GoogleGenerativeAI;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly eventsService: EventsService,
    private readonly budgetItemsService: BudgetItemsService,
    private readonly websocketsGateway: WebsocketsGateway,
  ) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      this.logger.error('GEMINI_API_KEY is not configured');
      throw new Error(ERROR_MESSAGES.GEMINI_KEY_MISSING);
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.logger.log('AiChatService initialized');
  }

  /**
   * Generate a budget proposal using Gemini AI.
   *
   * The AI never writes to the database directly. The proposal is saved
   * as "pending" and returned to the frontend for user review.
   *
   * @throws BusinessException if a pending proposal already exists for this event
   * @throws AIServiceException if Gemini API fails or returns invalid JSON
   */
  async generateBudgetProposal(
    workspaceId: string,
    eventId: string,
    userMessage: string,
  ) {
    this.logger.log(`Generating proposal for event ${eventId}`);

    // Verify event exists and belongs to this workspace (throws 404 if not)
    const event = await this.eventsService.findOne(workspaceId, eventId);

    // Enforce business rule: only one pending proposal per event at a time
    await this.checkPendingProposal(eventId);

    try {
      // Validate prompt inputs before calling Gemini
      GeminiPromptBuilder.validateInputs(event.title, event.currency, userMessage);

      // Call Gemini and get structured budget items
      const proposedItems = await this.callGeminiAPI(event, userMessage);

      // Critical: every item must use the event's currency
      this.validateCurrency(proposedItems, event.currency);

      // Validate item structure completeness
      this.validateProposalStructure(proposedItems);

      // Persist as pending proposal (NOT budget items — user must approve first)
      const proposal = await this.savePendingProposal(eventId, userMessage, proposedItems);

      this.logger.log(`Proposal ${proposal.id} created successfully for event ${eventId}`);

      return this.formatProposalResponse(proposal, proposedItems, event.currency);
    } catch (error) {
      this.logger.error(`Failed to generate proposal: ${error.message}`, error.stack);

      // Re-throw domain exceptions as-is
      if (error instanceof BusinessException) {
        throw error;
      }

      throw new AIServiceException(
        `Failed to generate budget proposal: ${error.message}`,
        error,
      );
    }
  }

  /**
   * Approve a pending proposal: write budget items to DB and notify clients.
   */
  async approveProposal(workspaceId: string, eventId: string, proposalId: string) {
    // Verify event belongs to this workspace
    const event = await this.eventsService.findOne(workspaceId, eventId);

    const proposal = await this.prisma.budgetProposal.findFirst({
      where: {
        id: proposalId,
        eventId,
        status: PROPOSAL_STATUS.PENDING,
      },
    });

    if (!proposal) {
      throw new NotFoundException('Pending proposal not found');
    }

    // Parse the JSON-serialised items from the proposal record
    const proposedItems: BudgetProposalItem[] = JSON.parse(proposal.proposedItems);

    // Write budget items to the database (only happens on explicit approval)
    await this.budgetItemsService.createMany(eventId, proposedItems);

    // Mark proposal as approved
    await this.prisma.budgetProposal.update({
      where: { id: proposalId },
      data: { status: PROPOSAL_STATUS.APPROVED },
    });

    // Notify all clients in this workspace via WebSocket so they can refresh
    this.websocketsGateway.emitBudgetUpdated(event.workspaceId, eventId);

    this.logger.log(`Proposal ${proposalId} approved — ${proposedItems.length} items created`);

    return {
      message: 'Proposal approved and budget items created successfully',
      itemsCreated: proposedItems.length,
    };
  }

  /**
   * Reject a pending proposal. No budget items are written.
   */
  async rejectProposal(
    workspaceId: string,
    eventId: string,
    proposalId: string,
    reason?: string,
  ) {
    // Verify event belongs to this workspace
    await this.eventsService.findOne(workspaceId, eventId);

    const proposal = await this.prisma.budgetProposal.findFirst({
      where: {
        id: proposalId,
        eventId,
        status: PROPOSAL_STATUS.PENDING,
      },
    });

    if (!proposal) {
      throw new NotFoundException('Pending proposal not found');
    }

    await this.prisma.budgetProposal.update({
      where: { id: proposalId },
      data: {
        status: PROPOSAL_STATUS.REJECTED,
        rejectionReason: reason,
      },
    });

    this.logger.log(`Proposal ${proposalId} rejected`);

    return { message: 'Proposal rejected successfully' };
  }

  // ─────────────────────────────────────────────────────────────
  // Private helpers
  // ─────────────────────────────────────────────────────────────

  /**
   * Enforce the "one pending proposal at a time" business rule.
   * @throws BusinessException if a pending proposal already exists
   */
  private async checkPendingProposal(eventId: string): Promise<void> {
    const existing = await this.prisma.budgetProposal.findFirst({
      where: {
        eventId,
        status: PROPOSAL_STATUS.PENDING,
      },
    });

    if (existing) {
      throw new BusinessException(ERROR_MESSAGES.PENDING_PROPOSAL_EXISTS);
    }
  }

  /**
   * Call the Gemini API and parse the returned JSON array of budget items.
   *
   * Uses GeminiPromptBuilder to build a structured prompt that instructs
   * Gemini to return ONLY a JSON array — no markdown, no prose.
   * We strip any residual code-fence markers before parsing.
   *
   * @throws AIServiceException if the API fails or the response is not parseable JSON
   */
  private async callGeminiAPI(
    event: { title: string; date: Date | string; currency: string },
    userMessage: string,
  ): Promise<BudgetProposalItem[]> {
    const prompt = GeminiPromptBuilder.buildBudgetProposalPrompt(
      event.title,
      event.date,
      event.currency,
      userMessage,
    );

    this.logger.debug(`Calling Gemini model: ${GEMINI_MODEL}`);

    const model = this.genAI.getGenerativeModel({ model: GEMINI_MODEL });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const rawText = response.text();

    // Strip optional markdown code fences (```json ... ``` or ``` ... ```)
    const cleaned = rawText
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim();

    // Extract the JSON array — Gemini sometimes adds leading/trailing prose
    const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      this.logger.error(`Gemini returned non-JSON response: ${rawText.substring(0, 200)}`);
      throw new AIServiceException(ERROR_MESSAGES.INVALID_JSON_RESPONSE);
    }

    try {
      const items: BudgetProposalItem[] = JSON.parse(jsonMatch[0]);
      return items;
    } catch (parseError) {
      this.logger.error(`JSON parse error: ${parseError.message}`);
      throw new AIServiceException(ERROR_MESSAGES.INVALID_JSON_RESPONSE);
    }
  }

  /**
   * Validate that every proposed item uses the event's currency.
   * Client requirement: if Gemini returns a different currency, reject the entire proposal.
   *
   * @throws BusinessException listing any offending currencies found
   */
  private validateCurrency(items: BudgetProposalItem[], eventCurrency: string): void {
    const mismatched = items.filter(
      (item) => item.currency?.toUpperCase() !== eventCurrency.toUpperCase(),
    );

    if (mismatched.length > 0) {
      const offenders = [...new Set(mismatched.map((i) => i.currency))].join(', ');
      throw new BusinessException(
        `${ERROR_MESSAGES.INVALID_CURRENCY}. Event requires ${eventCurrency} but AI returned: ${offenders}`,
      );
    }
  }

  /**
   * Validate that each item has all required fields with correct types.
   * @throws BusinessException on structural violations
   */
  private validateProposalStructure(items: BudgetProposalItem[]): void {
    if (!Array.isArray(items) || items.length === 0) {
      throw new BusinessException('AI returned an empty proposal');
    }

    for (const [idx, item] of items.entries()) {
      if (!item.category || typeof item.category !== 'string') {
        throw new BusinessException(`Item ${idx + 1} is missing a valid category`);
      }
      if (!item.description || typeof item.description !== 'string') {
        throw new BusinessException(`Item ${idx + 1} is missing a valid description`);
      }
      if (typeof item.amount !== 'number' || item.amount <= 0) {
        throw new BusinessException(`Item ${idx + 1} has an invalid amount`);
      }
      if (!item.currency || typeof item.currency !== 'string') {
        throw new BusinessException(`Item ${idx + 1} is missing a currency`);
      }
    }
  }

  /**
   * Persist the proposal as "pending" in the database.
   * Budget items are NOT written here — only on approval.
   */
  private async savePendingProposal(
    eventId: string,
    userMessage: string,
    proposedItems: BudgetProposalItem[],
  ) {
    return this.prisma.budgetProposal.create({
      data: {
        eventId,
        userMessage,
        aiResponse: JSON.stringify(proposedItems), // store raw AI items as canonical record
        proposedItems: JSON.stringify(proposedItems),
        status: PROPOSAL_STATUS.PENDING,
      },
    });
  }

  /**
   * Shape the API response returned to the frontend for display in the proposal card.
   */
  private formatProposalResponse(
    proposal: { id: string; status: string },
    items: BudgetProposalItem[],
    currency: string,
  ) {
    return {
      proposalId: proposal.id,
      status: proposal.status,
      items,
      totalAmount: items.reduce((sum, item) => sum + item.amount, 0),
      currency,
      message: 'Proposal generated. Review and approve or reject.',
    };
  }
}

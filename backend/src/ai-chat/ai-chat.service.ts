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

/**
 * Budget proposal item structure
 */
interface BudgetProposalItem {
  category: string;
  description: string;
  amount: number;
  currency: string;
}

/**
 * Gemini AI response structure
 */
interface GeminiResponse {
  items: BudgetProposalItem[];
  totalAmount: number;
}

/**
 * Service responsible for AI-powered budget proposal generation
 * Uses Google's Gemini API with proper error handling and validation
 * 
 * Key responsibilities:
 * - Generate budget proposals via Gemini
 * - Validate currency consistency
 * - Manage proposal approval workflow
 * - Emit real-time updates via WebSocket
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
    this.logger.log('AI Chat Service initialized');
  }

  /**
   * Generate a budget proposal using Gemini AI
   * 
   * @param workspaceId - Workspace identifier for authorization
   * @param eventId - Event to generate proposal for
   * @param userMessage - Natural language request from user
   * @returns Structured proposal with items and metadata
   * @throws BusinessException if pending proposal exists
   * @throws AIServiceException if Gemini API fails
   */
  async generateBudgetProposal(
    workspaceId: string,
    eventId: string,
    userMessage: string,
  ) {
    this.logger.log(`Generating proposal for event ${eventId}`);

    // Verify event exists and belongs to workspace
    const event = await this.eventsService.findOne(workspaceId, eventId);

    // Check for existing pending proposals - business rule enforcement
    await this.checkPendingProposal(eventId);

    try {
      // Generate proposal via Gemini
      const proposedItems = await this.callGeminiAPI(event, userMessage);

      // Validate currency consistency - critical business rule
      this.validateCurrency(proposedItems, event.currency);

      // Validate item structure
      this.validateProposalStructure(proposedItems);

      // Save as pending proposal
      const proposal = await this.savePendingProposal(
        eventId,
        userMessage,
        proposedItems,
      );

      this.logger.log(`Proposal ${proposal.id} created successfully`);

      return this.formatProposalResponse(proposal, proposedItems, event.currency);
    } catch (error) {
      this.logger.error(`Failed to generate proposal: ${error.message}`, error.stack);
      
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
   * Check if a pending proposal exists for the event
   * @throws BusinessException if pending proposal exists
   */
  private async checkPendingProposal(eventId: string): Promise<void> {
    const existingProposal = await this.prisma.budgetProposal.findFirst({
      where: {
        eventId,
        status: PROPOSAL_STATUS.PENDING,
      },
    });

    if (existingProposal) {
      throw new BusinessException(ERROR_MESSAGES.PENDING_PROPOSAL_EXISTS);
    }
  }
    // Create prompt for Gemini
    const prompt = `You are a professional event budget assistant. 
    
Event Details:
- Title: ${event.title}
- Date: ${event.date}
- Currency: ${event.currency}

User Request: ${userMessage}

Please generate a detailed budget proposal for this event. Return your response as a valid JSON array with this exact format:
[
  {
    "category": "Category Name",
    "description": "Detailed description",
    "amount": 1000.00,
    "currency": "${event.currency}"
  }
]

Important rules:
1. ALL items MUST use currency: "${event.currency}"
2. Return ONLY the JSON array, no other text
3. Include realistic categories like: Venue, Catering, Entertainment, Decorations, Staff, Marketing, Contingency
4. Provide detailed descriptions for each item
5. Use realistic amounts based on the event type and date`;

    try {
      // Call Gemini API
      const model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Parse AI response
      let proposedItems: BudgetProposalItem[];
      try {
        // Extract JSON from response (handle markdown code blocks)
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
          throw new Error('No JSON array found in AI response');
        }
        proposedItems = JSON.parse(jsonMatch[0]);
      } catch (parseError) {
        throw new BadRequestException(
          'AI response was not in the expected format. Please try again.',
        );
      }

      // Validate currency matches event currency
      const invalidCurrency = proposedItems.find((item) => item.currency !== event.currency);
      if (invalidCurrency) {
        throw new BadRequestException(
          `AI proposal contains invalid currency. All items must use ${event.currency}.`,
        );
      }

      // Validate structure
      for (const item of proposedItems) {
        if (!item.category || !item.description || typeof item.amount !== 'number' || !item.currency) {
          throw new BadRequestException('AI proposal has invalid item structure');
        }
      }

      // Save as pending proposal
      const proposal = await this.prisma.budgetProposal.create({
        data: {
          eventId,
          userMessage,
          aiResponse: text,
          proposedItems: JSON.stringify(proposedItems),
          status: 'pending',
        },
      });

      return {
        proposalId: proposal.id,
        status: 'pending',
        items: proposedItems,
        totalAmount: proposedItems.reduce((sum, item) => sum + item.amount, 0),
        currency: event.currency,
        message: 'Proposal generated successfully. Please review and approve or reject.',
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to generate budget proposal: ${error.message}`,
      );
    }
  }

  async approveProposal(workspaceId: string, eventId: string, proposalId: string) {
    // Verify event exists
    const event = await this.eventsService.findOne(workspaceId, eventId);

    // Get proposal
    const proposal = await this.prisma.budgetProposal.findFirst({
      where: {
        id: proposalId,
        eventId,
        status: 'pending',
      },
    });

    if (!proposal) {
      throw new NotFoundException('Pending proposal not found');
    }

    // Parse proposed items
    const proposedItems: BudgetProposalItem[] = JSON.parse(proposal.proposedItems);

    // Create budget items in database
    await this.budgetItemsService.createMany(eventId, proposedItems);

    // Update proposal status
    await this.prisma.budgetProposal.update({
      where: { id: proposalId },
      data: { status: 'approved' },
    });

    // Emit WebSocket event for real-time update
    this.websocketsGateway.emitBudgetUpdated(workspaceId, eventId);

    return {
      message: 'Proposal approved and budget items created successfully',
      itemsCreated: proposedItems.length,
    };
  }

  async rejectProposal(workspaceId: string, eventId: string, proposalId: string, reason?: string) {
    // Verify event exists
    await this.eventsService.findOne(workspaceId, eventId);

    // Get proposal
    const proposal = await this.prisma.budgetProposal.findFirst({
      where: {
        id: proposalId,
        eventId,
        status: 'pending',
      },
    });

    if (!proposal) {
      throw new NotFoundException('Pending proposal not found');
    }

    // Update proposal status
    await this.prisma.budgetProposal.update({
      where: { id: proposalId },
      data: {
        status: 'rejected',
        rejectionReason: reason,
      },
    });

    return {
      message: 'Proposal rejected successfully',
    };
  }
}

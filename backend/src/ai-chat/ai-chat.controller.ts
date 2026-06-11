import { Controller, Post, Body, Param, UseGuards, Req, Patch } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { AiChatService } from './ai-chat.service';
import { ChatMessageDto } from './dto/chat-message.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';

@ApiTags('ai-chat')
@Controller('events/:eventId/ai-chat')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiHeader({ name: 'x-workspace-id', description: 'Workspace ID', required: true })
export class AiChatController {
  constructor(private readonly aiChatService: AiChatService) {}

  @Post()
  @ApiOperation({ summary: 'Send chat message to AI for budget proposal' })
  async chat(
    @Req() req: Request,
    @Param('eventId') eventId: string,
    @Body() chatMessageDto: ChatMessageDto,
  ) {
    return this.aiChatService.generateBudgetProposal(
      req.workspaceId,
      eventId,
      chatMessageDto.message,
    );
  }

  @Patch('proposals/:proposalId/approve')
  @ApiOperation({ summary: 'Approve pending budget proposal' })
  async approveProposal(
    @Req() req: Request,
    @Param('eventId') eventId: string,
    @Param('proposalId') proposalId: string,
  ) {
    return this.aiChatService.approveProposal(req.workspaceId, eventId, proposalId);
  }

  @Patch('proposals/:proposalId/reject')
  @ApiOperation({ summary: 'Reject pending budget proposal' })
  async rejectProposal(
    @Req() req: Request,
    @Param('eventId') eventId: string,
    @Param('proposalId') proposalId: string,
    @Body() body: { reason?: string },
  ) {
    return this.aiChatService.rejectProposal(req.workspaceId, eventId, proposalId, body.reason);
  }
}

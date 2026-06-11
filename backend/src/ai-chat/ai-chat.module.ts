import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AiChatService } from './ai-chat.service';
import { AiChatController } from './ai-chat.controller';
import { EventsModule } from '../events/events.module';
import { BudgetItemsModule } from '../budget-items/budget-items.module';
import { WebsocketsModule } from '../websockets/websockets.module';

@Module({
  imports: [ConfigModule, EventsModule, BudgetItemsModule, WebsocketsModule],
  controllers: [AiChatController],
  providers: [AiChatService],
})
export class AiChatModule {}

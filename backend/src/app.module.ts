import { Module, NestModule, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { EventsModule } from './events/events.module';
import { BudgetItemsModule } from './budget-items/budget-items.module';
import { AiChatModule } from './ai-chat/ai-chat.module';
import { WebsocketsModule } from './websockets/websockets.module';
import { WorkspaceMiddleware } from './common/middleware/workspace.middleware';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    EventsModule,
    BudgetItemsModule,
    AiChatModule,
    WebsocketsModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(WorkspaceMiddleware)
      .exclude(
        { path: 'auth/register', method: RequestMethod.POST },
        { path: 'auth/login', method: RequestMethod.POST },
        { path: 'users/workspaces', method: RequestMethod.GET },
      )
      .forRoutes(
        { path: 'events*', method: RequestMethod.ALL },
      );
  }
}

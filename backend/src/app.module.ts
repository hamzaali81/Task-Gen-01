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

/**
 * AppModule — root module that wires the application together.
 *
 * WorkspaceMiddleware is applied to all event-related routes. It is
 * excluded from the public auth endpoints. The middleware decodes the JWT
 * itself (JwtModule is available via AuthModule) and validates workspace
 * ownership before the request reaches any controller.
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    AuthModule,   // Exports JwtModule — makes JwtService available to WorkspaceMiddleware
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
      )
      .forRoutes(
        { path: 'events*', method: RequestMethod.ALL },
      );
  }
}

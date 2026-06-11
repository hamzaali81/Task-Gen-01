import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:3001'],
    credentials: true,
  },
})
export class WebsocketsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger = new Logger('WebsocketsGateway');

  constructor(private jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      // Extract and verify JWT token
      const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.split(' ')[1];
      
      if (!token) {
        this.logger.warn(`Client ${client.id} connection rejected: No token provided`);
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      client.data.userId = payload.sub;
      
      this.logger.log(`Client connected: ${client.id} (User: ${payload.email})`);
    } catch (error) {
      this.logger.warn(`Client ${client.id} connection rejected: Invalid token`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinWorkspace')
  handleJoinWorkspace(client: Socket, workspaceId: string) {
    client.join(`workspace:${workspaceId}`);
    this.logger.log(`Client ${client.id} joined workspace ${workspaceId}`);
    return { event: 'workspaceJoined', data: { workspaceId } };
  }

  @SubscribeMessage('leaveWorkspace')
  handleLeaveWorkspace(client: Socket, workspaceId: string) {
    client.leave(`workspace:${workspaceId}`);
    this.logger.log(`Client ${client.id} left workspace ${workspaceId}`);
    return { event: 'workspaceLeft', data: { workspaceId } };
  }

  // Emit budget updated event to all clients in a workspace
  emitBudgetUpdated(workspaceId: string, eventId: string) {
    this.server.to(`workspace:${workspaceId}`).emit('budgetUpdated', {
      eventId,
      timestamp: new Date().toISOString(),
    });
    this.logger.log(`Emitted budgetUpdated for event ${eventId} in workspace ${workspaceId}`);
  }
}

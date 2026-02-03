import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ChatService } from './chat.service';

interface AuthenticatedSocket extends Socket {
  user?: { id: string; email: string };
}

interface HandshakeAuth {
  token?: string;
}

interface JwtPayload {
  sub: string;
  email: string;
}

const isProduction = process.env.NODE_ENV === 'production';

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(ChatGateway.name);

  @WebSocketServer()
  server: Server;

  private userSocketMap = new Map<string, string[]>(); // userId -> socketIds

  constructor(
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService,
  ) {}

  handleConnection(client: AuthenticatedSocket) {
    try {
      const auth = client.handshake.auth as HandshakeAuth;
      const token =
        auth?.token || client.handshake.headers?.authorization?.split(' ')[1];

      // In production, require valid JWT token
      if (!token) {
        if (isProduction) {
          this.logger.warn(`Connection rejected: No token provided`);
          client.disconnect();
          return;
        }
        this.logger.warn(`Development mode: Connection without token`);
        client.disconnect();
        return;
      }

      // Verify JWT token
      try {
        const payload = this.jwtService.verify<JwtPayload>(token);
        client.user = { id: payload.sub, email: payload.email };

        // Store user connection
        const userId = payload.sub;
        const existingSockets = this.userSocketMap.get(userId) || [];
        existingSockets.push(client.id);
        this.userSocketMap.set(userId, existingSockets);

        // Join user to their personal room for direct messages
        void client.join(`user:${userId}`);

        this.logger.log(`Client connected: ${client.id}, User: ${userId}`);
      } catch {
        this.logger.warn(`Connection rejected: Invalid token`);
        client.disconnect();
        return;
      }
    } catch (error) {
      this.logger.error('Connection error', (error as Error).stack);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    // Remove from user socket map
    const userId = client.user?.id;

    if (userId) {
      const sockets = this.userSocketMap.get(userId) || [];
      const filtered = sockets.filter((id) => id !== client.id);
      if (filtered.length > 0) {
        this.userSocketMap.set(userId, filtered);
      } else {
        this.userSocketMap.delete(userId);
      }
    }
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  /**
   * Helper to get authenticated user ID from socket
   */
  private getAuthenticatedUserId(client: AuthenticatedSocket): string | null {
    return client.user?.id || null;
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { roomId: string },
  ) {
    const userId = this.getAuthenticatedUserId(client);

    if (!userId) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      // Verify user can access this room
      await this.chatService.getRoomById(data.roomId, userId);

      // Join the room
      void client.join(`room:${data.roomId}`);

      return { success: true, roomId: data.roomId };
    } catch {
      return { success: false, error: 'Cannot access this room' };
    }
  }

  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { roomId: string },
  ) {
    void client.leave(`room:${data.roomId}`);
    return { success: true };
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody()
    data: {
      roomId: string;
      content: string;
      messageType?: string;
      metadata?: Record<string, unknown>;
    },
  ) {
    const userId = this.getAuthenticatedUserId(client);

    if (!userId) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      const message = await this.chatService.sendMessage(data.roomId, userId, {
        content: data.content,
        messageType: data.messageType,
        metadata: data.metadata,
      });

      // Broadcast to room
      this.server.to(`room:${data.roomId}`).emit('newMessage', message);

      // Also send to the other user if they're not in the room
      const room = await this.chatService.getRoomById(data.roomId, userId);
      const otherUserId =
        room.employeeId === userId ? room.driverId : room.employeeId;
      this.server.to(`user:${otherUserId}`).emit('newMessage', message);

      return { success: true, message };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  @SubscribeMessage('markRead')
  async handleMarkRead(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { roomId: string },
  ) {
    const userId = this.getAuthenticatedUserId(client);

    if (!userId) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      await this.chatService.markAsRead(data.roomId, userId);

      // Notify the room that messages were read
      this.server.to(`room:${data.roomId}`).emit('messagesRead', {
        roomId: data.roomId,
        readBy: userId,
      });

      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { roomId: string; isTyping: boolean },
  ) {
    const userId = this.getAuthenticatedUserId(client);

    if (!userId) {
      return { success: false, error: 'Not authenticated' };
    }

    // Broadcast typing indicator to room (except sender)
    void client.to(`room:${data.roomId}`).emit('userTyping', {
      roomId: data.roomId,
      userId,
      isTyping: data.isTyping,
    });

    return { success: true };
  }

  /**
   * Utility method to send notification to a specific user
   */
  sendToUser(userId: string, event: string, data: unknown) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  /**
   * Utility method to send notification to a room
   */
  sendToRoom(roomId: string, event: string, data: unknown) {
    this.server.to(`room:${roomId}`).emit(event, data);
  }
}

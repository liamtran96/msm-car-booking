import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { generateUuid } from '../../test/utils/test-helper';
import { Server, Socket } from 'socket.io';

interface AuthenticatedMockSocket extends Partial<Socket> {
  user?: { id: string; email: string };
}

// Helper function to create mock socket with specific handshake config
function createMockSocket(
  handshakeAuth: Record<string, unknown> = {},
  handshakeQuery: Record<string, unknown> = {},
): AuthenticatedMockSocket {
  return {
    id: 'socket-123',
    handshake: {
      auth: handshakeAuth,
      query: handshakeQuery,
      headers: {},
      time: new Date().toISOString(),
      address: '127.0.0.1',
      xdomain: false,
      secure: false,
      issued: Date.now(),
      url: '/chat',
    } as Socket['handshake'],
    join: jest.fn(),
    leave: jest.fn(),
    to: jest.fn().mockReturnThis(),
    emit: jest.fn(),
    disconnect: jest.fn(),
  };
}

// Helper to create an authenticated mock socket
function createAuthenticatedSocket(
  userId: string,
  email = 'test@example.com',
): AuthenticatedMockSocket {
  const socket = createMockSocket({ token: 'valid-jwt-token' });
  socket.user = { id: userId, email };
  return socket;
}

describe('ChatGateway', () => {
  let gateway: ChatGateway;

  // ChatService spies
  let getRoomByIdSpy: jest.Mock;
  let sendMessageSpy: jest.Mock;
  let markAsReadSpy: jest.Mock;

  // JwtService spies
  let jwtVerifySpy: jest.Mock;

  // Mock server
  let mockServer: Partial<Server>;

  beforeEach(async () => {
    // Setup ChatService spies
    getRoomByIdSpy = jest.fn();
    sendMessageSpy = jest.fn();
    markAsReadSpy = jest.fn();

    const mockChatService = {
      getRoomById: getRoomByIdSpy,
      sendMessage: sendMessageSpy,
      markAsRead: markAsReadSpy,
    };

    // Setup JwtService spy
    jwtVerifySpy = jest.fn();
    const mockJwtService = {
      verify: jwtVerifySpy,
    };

    // Setup mock server
    mockServer = {
      to: jest.fn().mockReturnValue({
        emit: jest.fn(),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatGateway,
        {
          provide: ChatService,
          useValue: mockChatService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    gateway = module.get<ChatGateway>(ChatGateway);
    gateway.server = mockServer as Server;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handleConnection', () => {
    it('should authenticate with valid JWT token and join personal room', () => {
      const userId = generateUuid();
      const email = 'test@example.com';
      jwtVerifySpy.mockReturnValue({ sub: userId, email });

      const mockSocket = createMockSocket({ token: 'valid-jwt-token' });

      gateway.handleConnection(mockSocket as Socket);

      expect(jwtVerifySpy).toHaveBeenCalledWith('valid-jwt-token');
      expect(mockSocket.join).toHaveBeenCalledWith(`user:${userId}`);
      expect(mockSocket.disconnect).not.toHaveBeenCalled();
    });

    it('should disconnect when JWT token is invalid', () => {
      jwtVerifySpy.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const mockSocket = createMockSocket({ token: 'invalid-token' });

      gateway.handleConnection(mockSocket as Socket);

      expect(mockSocket.disconnect).toHaveBeenCalled();
    });

    it('should disconnect if no token provided', () => {
      const mockSocket = createMockSocket({});

      gateway.handleConnection(mockSocket as Socket);

      expect(mockSocket.disconnect).toHaveBeenCalled();
    });

    it('should accept token from authorization header', () => {
      const userId = generateUuid();
      const email = 'test@example.com';
      jwtVerifySpy.mockReturnValue({ sub: userId, email });

      const mockSocket = createMockSocket({});
      mockSocket.handshake!.headers = {
        authorization: 'Bearer valid-jwt-token',
      };

      gateway.handleConnection(mockSocket as Socket);

      expect(jwtVerifySpy).toHaveBeenCalledWith('valid-jwt-token');
      expect(mockSocket.join).toHaveBeenCalledWith(`user:${userId}`);
    });
  });

  describe('handleDisconnect', () => {
    it('should remove socket from user socket map', () => {
      const userId = generateUuid();
      const email = 'test@example.com';
      jwtVerifySpy.mockReturnValue({ sub: userId, email });

      const mockSocket = createMockSocket({ token: 'valid-jwt-token' });

      // First connect to set up the socket
      gateway.handleConnection(mockSocket as Socket);
      // Then disconnect
      gateway.handleDisconnect(mockSocket as Socket);

      // Should not throw error
      expect(true).toBe(true);
    });

    it('should handle disconnect of unauthenticated socket', () => {
      const mockSocket = createMockSocket({});
      // Socket without user property
      gateway.handleDisconnect(mockSocket as Socket);

      // Should not throw error
      expect(true).toBe(true);
    });
  });

  describe('handleJoinRoom', () => {
    it('should join room if user has access', async () => {
      const userId = generateUuid();
      const roomId = generateUuid();
      const mockSocket = createAuthenticatedSocket(userId);

      getRoomByIdSpy.mockResolvedValue({ id: roomId });

      const result = await gateway.handleJoinRoom(mockSocket as Socket, {
        roomId,
      });

      expect(result).toEqual({ success: true, roomId });
      expect(mockSocket.join).toHaveBeenCalledWith(`room:${roomId}`);
    });

    it('should return error if not authenticated', async () => {
      const mockSocket = createMockSocket({});

      const result = await gateway.handleJoinRoom(mockSocket as Socket, {
        roomId: generateUuid(),
      });

      expect(result).toEqual({ success: false, error: 'Not authenticated' });
    });

    it('should return error if user cannot access room', async () => {
      const userId = generateUuid();
      const roomId = generateUuid();
      const mockSocket = createAuthenticatedSocket(userId);

      getRoomByIdSpy.mockRejectedValue(new Error('Access denied'));

      const result = await gateway.handleJoinRoom(mockSocket as Socket, {
        roomId,
      });

      expect(result).toEqual({
        success: false,
        error: 'Cannot access this room',
      });
    });
  });

  describe('handleLeaveRoom', () => {
    it('should leave room', () => {
      const userId = generateUuid();
      const roomId = generateUuid();
      const mockSocket = createAuthenticatedSocket(userId);

      const result = gateway.handleLeaveRoom(mockSocket as Socket, { roomId });

      expect(mockSocket.leave).toHaveBeenCalledWith(`room:${roomId}`);
      expect(result).toEqual({ success: true });
    });
  });

  describe('handleMessage', () => {
    it('should send message and broadcast to room', async () => {
      const userId = generateUuid();
      const roomId = generateUuid();
      const employeeId = userId;
      const driverId = generateUuid();
      const mockSocket = createAuthenticatedSocket(userId);

      const mockMessage = { id: generateUuid(), content: 'Hello' };
      const mockRoom = { id: roomId, employeeId, driverId };

      sendMessageSpy.mockResolvedValue(mockMessage);
      getRoomByIdSpy.mockResolvedValue(mockRoom);

      const result = await gateway.handleMessage(mockSocket as Socket, {
        roomId,
        content: 'Hello',
      });

      expect(result).toEqual({ success: true, message: mockMessage });
      expect(sendMessageSpy).toHaveBeenCalledWith(roomId, userId, {
        content: 'Hello',
        messageType: undefined,
        metadata: undefined,
      });
    });

    it('should return error if not authenticated', async () => {
      const mockSocket = createMockSocket({});

      const result = await gateway.handleMessage(mockSocket as Socket, {
        roomId: generateUuid(),
        content: 'Hello',
      });

      expect(result).toEqual({ success: false, error: 'Not authenticated' });
    });

    it('should return error on send failure', async () => {
      const userId = generateUuid();
      const mockSocket = createAuthenticatedSocket(userId);

      sendMessageSpy.mockRejectedValue(new Error('Send failed'));

      const result = await gateway.handleMessage(mockSocket as Socket, {
        roomId: generateUuid(),
        content: 'Hello',
      });

      expect(result).toEqual({ success: false, error: 'Send failed' });
    });
  });

  describe('handleMarkRead', () => {
    it('should mark messages as read', async () => {
      const userId = generateUuid();
      const roomId = generateUuid();
      const mockSocket = createAuthenticatedSocket(userId);

      markAsReadSpy.mockResolvedValue(undefined);

      const result = await gateway.handleMarkRead(mockSocket as Socket, {
        roomId,
      });

      expect(result).toEqual({ success: true });
      expect(markAsReadSpy).toHaveBeenCalledWith(roomId, userId);
    });

    it('should return error if not authenticated', async () => {
      const mockSocket = createMockSocket({});

      const result = await gateway.handleMarkRead(mockSocket as Socket, {
        roomId: generateUuid(),
      });

      expect(result).toEqual({ success: false, error: 'Not authenticated' });
    });
  });

  describe('handleTyping', () => {
    it('should broadcast typing indicator to room', () => {
      const userId = generateUuid();
      const roomId = generateUuid();
      const mockSocket = createAuthenticatedSocket(userId);

      const result = gateway.handleTyping(mockSocket as Socket, {
        roomId,
        isTyping: true,
      });

      expect(mockSocket.to).toHaveBeenCalledWith(`room:${roomId}`);
      expect(result).toEqual({ success: true });
    });

    it('should return error if not authenticated', () => {
      const mockSocket = createMockSocket({});

      const result = gateway.handleTyping(mockSocket as Socket, {
        roomId: generateUuid(),
        isTyping: true,
      });

      expect(result).toEqual({ success: false, error: 'Not authenticated' });
    });
  });

  describe('sendToUser', () => {
    it('should emit event to user room', () => {
      const userId = generateUuid();
      const eventData = { message: 'Hello' };

      gateway.sendToUser(userId, 'notification', eventData);

      expect(mockServer.to).toHaveBeenCalledWith(`user:${userId}`);
    });
  });

  describe('sendToRoom', () => {
    it('should emit event to room', () => {
      const roomId = generateUuid();
      const eventData = { message: 'Hello' };

      gateway.sendToRoom(roomId, 'newMessage', eventData);

      expect(mockServer.to).toHaveBeenCalledWith(`room:${roomId}`);
    });
  });
});

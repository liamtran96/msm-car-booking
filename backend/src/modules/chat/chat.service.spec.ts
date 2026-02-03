import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatRoom } from './entities/chat-room.entity';
import { ChatMessage } from './entities/chat-message.entity';
import { Booking } from '../bookings/entities/booking.entity';
import { ChatRoomStatus, MessageStatus, BookingType } from '../../common/enums';
import {
  createMockBooking,
  createBlockScheduleBooking,
} from '../../test/factories/booking.factory';
import { createMockRepository } from '../../test/mocks/repository.mock';
import { generateUuid } from '../../test/utils/test-helper';

describe('ChatService', () => {
  let service: ChatService;

  // ChatRoom repository spies
  let roomFindSpy: jest.Mock;
  let roomFindOneSpy: jest.Mock;
  let roomCreateSpy: jest.Mock;
  let roomSaveSpy: jest.Mock;
  let roomUpdateSpy: jest.Mock;

  // ChatMessage repository spies
  let messageFindSpy: jest.Mock;
  let messageCreateSpy: jest.Mock;
  let messageSaveSpy: jest.Mock;
  let messageQueryBuilderSpy: jest.Mock;

  // Booking repository spies
  let bookingFindOneSpy: jest.Mock;

  // Mock query builder for messages
  let mockMessageQueryBuilder: {
    where: jest.Mock;
    andWhere: jest.Mock;
    update: jest.Mock;
    set: jest.Mock;
    execute: jest.Mock;
    getCount: jest.Mock;
  };

  beforeEach(async () => {
    // Setup ChatRoom spies
    roomFindSpy = jest.fn();
    roomFindOneSpy = jest.fn();
    roomCreateSpy = jest.fn(
      <T extends Record<string, unknown>>(entity: T): T => entity,
    );
    roomSaveSpy = jest.fn(<T extends Record<string, unknown>>(entity: T) =>
      Promise.resolve({ id: generateUuid(), ...entity }),
    );
    roomUpdateSpy = jest.fn();

    // Setup ChatMessage spies
    messageFindSpy = jest.fn();
    messageCreateSpy = jest.fn(
      <T extends Record<string, unknown>>(entity: T): T => entity,
    );
    messageSaveSpy = jest.fn(<T extends Record<string, unknown>>(entity: T) =>
      Promise.resolve({ id: generateUuid(), createdAt: new Date(), ...entity }),
    );

    mockMessageQueryBuilder = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue(undefined),
      getCount: jest.fn().mockResolvedValue(0),
    };
    messageQueryBuilderSpy = jest.fn().mockReturnValue(mockMessageQueryBuilder);

    // Setup Booking spies
    bookingFindOneSpy = jest.fn();

    const mockChatRoomRepository = {
      ...createMockRepository<ChatRoom>(),
      find: roomFindSpy,
      findOne: roomFindOneSpy,
      create: roomCreateSpy,
      save: roomSaveSpy,
      update: roomUpdateSpy,
    };

    const mockChatMessageRepository = {
      ...createMockRepository<ChatMessage>(),
      find: messageFindSpy,
      create: messageCreateSpy,
      save: messageSaveSpy,
      createQueryBuilder: messageQueryBuilderSpy,
    };

    const mockBookingRepository = {
      ...createMockRepository<Booking>(),
      findOne: bookingFindOneSpy,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        {
          provide: getRepositoryToken(ChatRoom),
          useValue: mockChatRoomRepository,
        },
        {
          provide: getRepositoryToken(ChatMessage),
          useValue: mockChatMessageRepository,
        },
        {
          provide: getRepositoryToken(Booking),
          useValue: mockBookingRepository,
        },
      ],
    }).compile();

    service = module.get<ChatService>(ChatService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createChatRoom', () => {
    it('should return existing room if already exists', async () => {
      const bookingId = generateUuid();
      const employeeId = generateUuid();
      const driverId = generateUuid();
      const existingRoom = {
        id: generateUuid(),
        bookingId,
        employeeId,
        driverId,
      };
      roomFindOneSpy.mockResolvedValue(existingRoom);

      const result = await service.createChatRoom(
        bookingId,
        employeeId,
        driverId,
      );

      expect(result).toEqual(existingRoom);
      expect(roomCreateSpy).not.toHaveBeenCalled();
    });

    it('should create new room if none exists', async () => {
      const bookingId = generateUuid();
      const employeeId = generateUuid();
      const driverId = generateUuid();
      roomFindOneSpy.mockResolvedValue(null);

      await service.createChatRoom(bookingId, employeeId, driverId);

      expect(roomCreateSpy).toHaveBeenCalledWith({
        bookingId,
        employeeId,
        driverId,
        status: ChatRoomStatus.ACTIVE,
      });
      expect(roomSaveSpy).toHaveBeenCalled();
    });
  });

  describe('onDriverAssigned', () => {
    it('should create chat room for BLOCK_SCHEDULE booking', async () => {
      const booking = createBlockScheduleBooking({
        assignedDriverId: generateUuid(),
      });
      roomFindOneSpy.mockResolvedValue(null);

      await service.onDriverAssigned(booking);

      expect(roomCreateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          bookingId: booking.id,
          employeeId: booking.requesterId,
          driverId: booking.assignedDriverId,
        }),
      );
    });

    it('should return null for non-BLOCK_SCHEDULE booking', async () => {
      const booking = createMockBooking({
        bookingType: BookingType.SINGLE_TRIP,
      });

      const result = await service.onDriverAssigned(booking);

      expect(result).toBeNull();
      expect(roomCreateSpy).not.toHaveBeenCalled();
    });

    it('should return null if no driver assigned', async () => {
      const booking = createBlockScheduleBooking({
        assignedDriverId: undefined,
      });
      (booking as { assignedDriverId: string | undefined }).assignedDriverId =
        undefined;

      const result = await service.onDriverAssigned(booking);

      expect(result).toBeNull();
    });
  });

  describe('getRoomsForUser', () => {
    it('should return rooms where user is employee or driver', async () => {
      const userId = generateUuid();
      const mockRooms = [
        { id: generateUuid(), employeeId: userId },
        { id: generateUuid(), driverId: userId },
      ];
      roomFindSpy.mockResolvedValue(mockRooms);

      const result = await service.getRoomsForUser(userId);

      expect(result).toHaveLength(2);
      expect(roomFindSpy).toHaveBeenCalledWith({
        where: [{ employeeId: userId }, { driverId: userId }],
        relations: ['booking', 'employee', 'driver'],
        order: { lastMessageAt: 'DESC' },
      });
    });

    it('should return empty array when user has no rooms', async () => {
      const userId = generateUuid();
      roomFindSpy.mockResolvedValue([]);

      const result = await service.getRoomsForUser(userId);

      expect(result).toHaveLength(0);
    });
  });

  describe('getRoomById', () => {
    it('should return room if user is a participant', async () => {
      const userId = generateUuid();
      const roomId = generateUuid();
      const mockRoom = {
        id: roomId,
        employeeId: userId,
        driverId: generateUuid(),
      };
      roomFindOneSpy.mockResolvedValue(mockRoom);

      const result = await service.getRoomById(roomId, userId);

      expect(result.id).toBe(roomId);
    });

    it('should throw NotFoundException for non-existent room', async () => {
      const roomId = generateUuid();
      const userId = generateUuid();
      roomFindOneSpy.mockResolvedValue(null);

      await expect(service.getRoomById(roomId, userId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if user is not a participant', async () => {
      const userId = generateUuid();
      const roomId = generateUuid();
      const mockRoom = {
        id: roomId,
        employeeId: generateUuid(),
        driverId: generateUuid(),
      };
      roomFindOneSpy.mockResolvedValue(mockRoom);

      await expect(service.getRoomById(roomId, userId)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('getOrCreateRoomForBooking', () => {
    it('should return existing room for booking', async () => {
      const bookingId = generateUuid();
      const userId = generateUuid();
      const mockBooking = createMockBooking({
        id: bookingId,
        requesterId: userId,
      });
      const existingRoom = { id: generateUuid(), bookingId };

      bookingFindOneSpy.mockResolvedValue(mockBooking);
      roomFindOneSpy.mockResolvedValue(existingRoom);

      const result = await service.getOrCreateRoomForBooking(bookingId, userId);

      expect(result).toEqual(existingRoom);
    });

    it('should throw NotFoundException for non-existent booking', async () => {
      const bookingId = generateUuid();
      const userId = generateUuid();
      bookingFindOneSpy.mockResolvedValue(null);

      await expect(
        service.getOrCreateRoomForBooking(bookingId, userId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user not related to booking', async () => {
      const bookingId = generateUuid();
      const userId = generateUuid();
      const mockBooking = createMockBooking({
        id: bookingId,
        requesterId: generateUuid(),
        assignedDriverId: generateUuid(),
      });
      bookingFindOneSpy.mockResolvedValue(mockBooking);

      await expect(
        service.getOrCreateRoomForBooking(bookingId, userId),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should create room if none exists and driver is assigned', async () => {
      const bookingId = generateUuid();
      const userId = generateUuid();
      const driverId = generateUuid();
      const mockBooking = createMockBooking({
        id: bookingId,
        requesterId: userId,
        assignedDriverId: driverId,
      });

      bookingFindOneSpy.mockResolvedValue(mockBooking);
      // First call for getOrCreateRoomForBooking returns null
      // Second call for createChatRoom returns null (no existing)
      roomFindOneSpy.mockResolvedValueOnce(null).mockResolvedValueOnce(null);

      await service.getOrCreateRoomForBooking(bookingId, userId);

      expect(roomCreateSpy).toHaveBeenCalled();
    });
  });

  describe('getMessages', () => {
    it('should return messages for a room', async () => {
      const roomId = generateUuid();
      const userId = generateUuid();
      const mockRoom = {
        id: roomId,
        employeeId: userId,
        driverId: generateUuid(),
      };
      const mockMessages = [
        { id: generateUuid(), chatRoomId: roomId, content: 'Hello' },
        { id: generateUuid(), chatRoomId: roomId, content: 'Hi' },
      ];

      roomFindOneSpy.mockResolvedValue(mockRoom);
      messageFindSpy.mockResolvedValue(mockMessages);

      const result = await service.getMessages(roomId, userId);

      expect(result).toHaveLength(2);
      expect(messageFindSpy).toHaveBeenCalledWith({
        where: { chatRoomId: roomId },
        relations: ['sender'],
        order: { createdAt: 'DESC' },
        take: 50,
        skip: 0,
      });
    });

    it('should respect limit and offset parameters', async () => {
      const roomId = generateUuid();
      const userId = generateUuid();
      const mockRoom = {
        id: roomId,
        employeeId: userId,
        driverId: generateUuid(),
      };

      roomFindOneSpy.mockResolvedValue(mockRoom);
      messageFindSpy.mockResolvedValue([]);

      await service.getMessages(roomId, userId, 10, 5);

      expect(messageFindSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
          skip: 5,
        }),
      );
    });
  });

  describe('sendMessage', () => {
    it('should create and save a message', async () => {
      const roomId = generateUuid();
      const senderId = generateUuid();
      const mockRoom = {
        id: roomId,
        employeeId: senderId,
        driverId: generateUuid(),
      };

      roomFindOneSpy.mockResolvedValue(mockRoom);

      await service.sendMessage(roomId, senderId, {
        content: 'Hello world',
        messageType: 'text',
      });

      expect(messageCreateSpy).toHaveBeenCalledWith({
        chatRoomId: roomId,
        senderId,
        content: 'Hello world',
        messageType: 'text',
        metadata: undefined,
        status: MessageStatus.SENT,
      });
      expect(messageSaveSpy).toHaveBeenCalled();
      expect(roomUpdateSpy).toHaveBeenCalledWith(roomId, {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        lastMessageAt: expect.any(Date),
      });
    });

    it('should use default message type if not provided', async () => {
      const roomId = generateUuid();
      const senderId = generateUuid();
      const mockRoom = {
        id: roomId,
        employeeId: senderId,
        driverId: generateUuid(),
      };

      roomFindOneSpy.mockResolvedValue(mockRoom);

      await service.sendMessage(roomId, senderId, {
        content: 'Hello',
      });

      expect(messageCreateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          messageType: 'text',
        }),
      );
    });
  });

  describe('sendScheduleChange', () => {
    it('should send schedule change message with metadata', async () => {
      const roomId = generateUuid();
      const senderId = generateUuid();
      const mockRoom = {
        id: roomId,
        employeeId: senderId,
        driverId: generateUuid(),
      };

      roomFindOneSpy.mockResolvedValue(mockRoom);

      await service.sendScheduleChange(roomId, senderId, {
        newTime: '10:00',
        originalTime: '09:00',
        reason: 'Meeting delayed',
      });

      expect(messageCreateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          messageType: 'schedule_change',
          metadata: {
            newTime: '10:00',
            originalTime: '09:00',
            reason: 'Meeting delayed',
          },
        }),
      );
    });

    it('should handle schedule change without reason', async () => {
      const roomId = generateUuid();
      const senderId = generateUuid();
      const mockRoom = {
        id: roomId,
        employeeId: senderId,
        driverId: generateUuid(),
      };

      roomFindOneSpy.mockResolvedValue(mockRoom);

      await service.sendScheduleChange(roomId, senderId, {
        newTime: '10:00',
      });

      expect(messageCreateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          content: 'Schedule change: New time 10:00',
        }),
      );
    });
  });

  describe('markAsRead', () => {
    it('should mark messages as read', async () => {
      const roomId = generateUuid();
      const userId = generateUuid();
      const mockRoom = {
        id: roomId,
        employeeId: userId,
        driverId: generateUuid(),
      };

      roomFindOneSpy.mockResolvedValue(mockRoom);

      await service.markAsRead(roomId, userId);

      expect(mockMessageQueryBuilder.update).toHaveBeenCalled();
      expect(mockMessageQueryBuilder.set).toHaveBeenCalledWith({
        status: MessageStatus.READ,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        readAt: expect.any(Date),
      });
      expect(mockMessageQueryBuilder.where).toHaveBeenCalledWith(
        'chat_room_id = :roomId',
        { roomId },
      );
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread message count', async () => {
      const userId = generateUuid();
      const mockRooms = [
        { id: generateUuid(), employeeId: userId },
        { id: generateUuid(), driverId: userId },
      ];
      roomFindSpy.mockResolvedValue(mockRooms);
      mockMessageQueryBuilder.getCount.mockResolvedValue(5);

      const result = await service.getUnreadCount(userId);

      expect(result).toBe(5);
    });

    it('should return 0 when user has no rooms', async () => {
      const userId = generateUuid();
      roomFindSpy.mockResolvedValue([]);

      const result = await service.getUnreadCount(userId);

      expect(result).toBe(0);
    });
  });

  describe('archiveRoom', () => {
    it('should archive room by booking ID', async () => {
      const bookingId = generateUuid();

      await service.archiveRoom(bookingId);

      expect(roomUpdateSpy).toHaveBeenCalledWith(
        { bookingId },
        { status: ChatRoomStatus.ARCHIVED },
      );
    });
  });

  describe('closeRoom', () => {
    it('should close room by booking ID', async () => {
      const bookingId = generateUuid();

      await service.closeRoom(bookingId);

      expect(roomUpdateSpy).toHaveBeenCalledWith(
        { bookingId },
        { status: ChatRoomStatus.CLOSED },
      );
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { generateUuid } from '../../test/utils/test-helper';

describe('ChatController', () => {
  let controller: ChatController;

  // Service spies
  let getRoomsForUserSpy: jest.Mock;
  let getRoomByIdSpy: jest.Mock;
  let getOrCreateRoomForBookingSpy: jest.Mock;
  let getMessagesSpy: jest.Mock;
  let sendMessageSpy: jest.Mock;
  let sendScheduleChangeSpy: jest.Mock;
  let markAsReadSpy: jest.Mock;
  let getUnreadCountSpy: jest.Mock;

  const mockUser = { user: { id: generateUuid() } };

  beforeEach(async () => {
    getRoomsForUserSpy = jest.fn();
    getRoomByIdSpy = jest.fn();
    getOrCreateRoomForBookingSpy = jest.fn();
    getMessagesSpy = jest.fn();
    sendMessageSpy = jest.fn();
    sendScheduleChangeSpy = jest.fn();
    markAsReadSpy = jest.fn();
    getUnreadCountSpy = jest.fn();

    const mockChatService = {
      getRoomsForUser: getRoomsForUserSpy,
      getRoomById: getRoomByIdSpy,
      getOrCreateRoomForBooking: getOrCreateRoomForBookingSpy,
      getMessages: getMessagesSpy,
      sendMessage: sendMessageSpy,
      sendScheduleChange: sendScheduleChangeSpy,
      markAsRead: markAsReadSpy,
      getUnreadCount: getUnreadCountSpy,
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChatController],
      providers: [
        {
          provide: ChatService,
          useValue: mockChatService,
        },
      ],
    }).compile();

    controller = module.get<ChatController>(ChatController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getRooms', () => {
    it('should return chat rooms for current user', async () => {
      const mockRooms = [
        { id: generateUuid(), employeeId: mockUser.user.id },
        { id: generateUuid(), driverId: mockUser.user.id },
      ];
      getRoomsForUserSpy.mockResolvedValue(mockRooms);

      const result = await controller.getRooms(mockUser);

      expect(result).toEqual(mockRooms);
      expect(getRoomsForUserSpy).toHaveBeenCalledWith(mockUser.user.id);
    });

    it('should return empty array when user has no rooms', async () => {
      getRoomsForUserSpy.mockResolvedValue([]);

      const result = await controller.getRooms(mockUser);

      expect(result).toEqual([]);
    });
  });

  describe('getRoom', () => {
    it('should return room by ID', async () => {
      const roomId = generateUuid();
      const mockRoom = { id: roomId, employeeId: mockUser.user.id };
      getRoomByIdSpy.mockResolvedValue(mockRoom);

      const result = await controller.getRoom(roomId, mockUser);

      expect(result).toEqual(mockRoom);
      expect(getRoomByIdSpy).toHaveBeenCalledWith(roomId, mockUser.user.id);
    });
  });

  describe('getRoomByBooking', () => {
    it('should get or create room for booking', async () => {
      const bookingId = generateUuid();
      const mockRoom = { id: generateUuid(), bookingId };
      getOrCreateRoomForBookingSpy.mockResolvedValue(mockRoom);

      const result = await controller.getRoomByBooking(bookingId, mockUser);

      expect(result).toEqual(mockRoom);
      expect(getOrCreateRoomForBookingSpy).toHaveBeenCalledWith(
        bookingId,
        mockUser.user.id,
      );
    });
  });

  describe('getMessages', () => {
    it('should return messages with default pagination', async () => {
      const roomId = generateUuid();
      const mockMessages = [
        { id: generateUuid(), content: 'Hello' },
        { id: generateUuid(), content: 'Hi' },
      ];
      getMessagesSpy.mockResolvedValue(mockMessages);

      const result = await controller.getMessages(roomId, mockUser);

      expect(result).toEqual(mockMessages);
      expect(getMessagesSpy).toHaveBeenCalledWith(
        roomId,
        mockUser.user.id,
        50,
        0,
      );
    });

    it('should return messages with custom pagination', async () => {
      const roomId = generateUuid();
      const mockMessages = [{ id: generateUuid(), content: 'Hello' }];
      getMessagesSpy.mockResolvedValue(mockMessages);

      const result = await controller.getMessages(roomId, mockUser, 10, 20);

      expect(result).toEqual(mockMessages);
      expect(getMessagesSpy).toHaveBeenCalledWith(
        roomId,
        mockUser.user.id,
        10,
        20,
      );
    });
  });

  describe('sendMessage', () => {
    it('should send a message', async () => {
      const roomId = generateUuid();
      const dto = { content: 'Hello world', messageType: 'text' };
      const mockMessage = { id: generateUuid(), ...dto };
      sendMessageSpy.mockResolvedValue(mockMessage);

      const result = await controller.sendMessage(roomId, dto, mockUser);

      expect(result).toEqual(mockMessage);
      expect(sendMessageSpy).toHaveBeenCalledWith(
        roomId,
        mockUser.user.id,
        dto,
      );
    });
  });

  describe('sendScheduleChange', () => {
    it('should send schedule change notification', async () => {
      const roomId = generateUuid();
      const dto = {
        newTime: '14:30',
        originalTime: '14:00',
        reason: 'Meeting extended',
      };
      const mockMessage = {
        id: generateUuid(),
        messageType: 'schedule_change',
        metadata: dto,
      };
      sendScheduleChangeSpy.mockResolvedValue(mockMessage);

      const result = await controller.sendScheduleChange(roomId, dto, mockUser);

      expect(result).toEqual(mockMessage);
      expect(sendScheduleChangeSpy).toHaveBeenCalledWith(
        roomId,
        mockUser.user.id,
        dto,
      );
    });
  });

  describe('markAsRead', () => {
    it('should mark messages as read', async () => {
      const roomId = generateUuid();
      markAsReadSpy.mockResolvedValue(undefined);

      const result = await controller.markAsRead(roomId, mockUser);

      expect(result).toBeUndefined();
      expect(markAsReadSpy).toHaveBeenCalledWith(roomId, mockUser.user.id);
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread message count', async () => {
      getUnreadCountSpy.mockResolvedValue(5);

      const result = await controller.getUnreadCount(mockUser);

      expect(result).toEqual({ count: 5 });
      expect(getUnreadCountSpy).toHaveBeenCalledWith(mockUser.user.id);
    });

    it('should return zero when no unread messages', async () => {
      getUnreadCountSpy.mockResolvedValue(0);

      const result = await controller.getUnreadCount(mockUser);

      expect(result).toEqual({ count: 0 });
    });
  });
});

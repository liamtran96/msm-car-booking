import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatRoom } from './entities/chat-room.entity';
import { ChatMessage } from './entities/chat-message.entity';
import { Booking } from '../bookings/entities/booking.entity';
import { ChatRoomStatus, MessageStatus, BookingType } from '../../common/enums';
import { CreateMessageDto } from './dto/create-message.dto';
import { ScheduleChangeDto } from './dto/schedule-change.dto';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatRoom)
    private readonly chatRoomRepository: Repository<ChatRoom>,
    @InjectRepository(ChatMessage)
    private readonly messageRepository: Repository<ChatMessage>,
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
  ) {}

  /**
   * Create a chat room for a booking (only for BLOCK_SCHEDULE bookings)
   */
  async createChatRoom(
    bookingId: string,
    employeeId: string,
    driverId: string,
  ): Promise<ChatRoom> {
    // Check if chat room already exists
    const existing = await this.chatRoomRepository.findOne({
      where: { bookingId },
    });
    if (existing) {
      return existing;
    }

    const chatRoom = this.chatRoomRepository.create({
      bookingId,
      employeeId,
      driverId,
      status: ChatRoomStatus.ACTIVE,
    });

    return this.chatRoomRepository.save(chatRoom);
  }

  /**
   * Create chat room when driver is assigned to a BLOCK_SCHEDULE booking
   */
  async onDriverAssigned(booking: Booking): Promise<ChatRoom | null> {
    if (booking.bookingType !== BookingType.BLOCK_SCHEDULE) {
      return null;
    }

    if (!booking.assignedDriverId) {
      return null;
    }

    return this.createChatRoom(
      booking.id,
      booking.requesterId,
      booking.assignedDriverId,
    );
  }

  /**
   * Get all chat rooms for a user
   */
  async getRoomsForUser(userId: string): Promise<ChatRoom[]> {
    return this.chatRoomRepository.find({
      where: [{ employeeId: userId }, { driverId: userId }],
      relations: ['booking', 'employee', 'driver'],
      order: { lastMessageAt: 'DESC' },
    });
  }

  /**
   * Get chat room by ID
   */
  async getRoomById(roomId: string, userId: string): Promise<ChatRoom> {
    const room = await this.chatRoomRepository.findOne({
      where: { id: roomId },
      relations: ['booking', 'employee', 'driver', 'messages'],
    });

    if (!room) {
      throw new NotFoundException(`Chat room with ID ${roomId} not found`);
    }

    // Verify user is a participant
    if (room.employeeId !== userId && room.driverId !== userId) {
      throw new ForbiddenException(
        'You are not a participant of this chat room',
      );
    }

    return room;
  }

  /**
   * Get or create chat room for a booking
   */
  async getOrCreateRoomForBooking(
    bookingId: string,
    userId: string,
  ): Promise<ChatRoom> {
    const booking = await this.bookingRepository.findOne({
      where: { id: bookingId },
    });

    if (!booking) {
      throw new NotFoundException(`Booking with ID ${bookingId} not found`);
    }

    // Verify user is related to the booking
    if (booking.requesterId !== userId && booking.assignedDriverId !== userId) {
      throw new ForbiddenException('You are not related to this booking');
    }

    let room = await this.chatRoomRepository.findOne({
      where: { bookingId },
      relations: ['employee', 'driver'],
    });

    if (!room && booking.assignedDriverId) {
      room = await this.createChatRoom(
        bookingId,
        booking.requesterId,
        booking.assignedDriverId,
      );
    }

    if (!room) {
      throw new NotFoundException('Chat room not available for this booking');
    }

    return room;
  }

  /**
   * Get messages for a chat room
   */
  async getMessages(
    roomId: string,
    userId: string,
    limit = 50,
    offset = 0,
  ): Promise<ChatMessage[]> {
    // Verify user access
    await this.getRoomById(roomId, userId);

    return this.messageRepository.find({
      where: { chatRoomId: roomId },
      relations: ['sender'],
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });
  }

  /**
   * Send a message
   */
  async sendMessage(
    roomId: string,
    senderId: string,
    dto: CreateMessageDto,
  ): Promise<ChatMessage> {
    // Verify user access (throws if not authorized)
    await this.getRoomById(roomId, senderId);

    const message = this.messageRepository.create({
      chatRoomId: roomId,
      senderId,
      content: dto.content,
      messageType: dto.messageType || 'text',
      metadata: dto.metadata,
      status: MessageStatus.SENT,
    });

    const savedMessage = await this.messageRepository.save(message);

    // Update room's last message timestamp
    await this.chatRoomRepository.update(roomId, {
      lastMessageAt: new Date(),
    });

    return savedMessage;
  }

  /**
   * Send a schedule change notification
   */
  async sendScheduleChange(
    roomId: string,
    senderId: string,
    dto: ScheduleChangeDto,
  ): Promise<ChatMessage> {
    const content = dto.reason
      ? `Schedule change: New time ${dto.newTime}. Reason: ${dto.reason}`
      : `Schedule change: New time ${dto.newTime}`;

    return this.sendMessage(roomId, senderId, {
      content,
      messageType: 'schedule_change',
      metadata: {
        newTime: dto.newTime,
        originalTime: dto.originalTime,
        reason: dto.reason,
      },
    });
  }

  /**
   * Mark messages as read
   */
  async markAsRead(roomId: string, userId: string): Promise<void> {
    // Verify user access
    await this.getRoomById(roomId, userId);

    // Mark all messages from other user as read
    await this.messageRepository
      .createQueryBuilder()
      .update(ChatMessage)
      .set({
        status: MessageStatus.READ,
        readAt: new Date(),
      })
      .where('chat_room_id = :roomId', { roomId })
      .andWhere('sender_id != :userId', { userId })
      .andWhere('status != :read', { read: MessageStatus.READ })
      .execute();
  }

  /**
   * Get unread message count for a user
   */
  async getUnreadCount(userId: string): Promise<number> {
    const rooms = await this.chatRoomRepository.find({
      where: [{ employeeId: userId }, { driverId: userId }],
    });

    if (rooms.length === 0) {
      return 0;
    }

    const roomIds = rooms.map((r) => r.id);

    const result = await this.messageRepository
      .createQueryBuilder('message')
      .where('message.chat_room_id IN (:...roomIds)', { roomIds })
      .andWhere('message.sender_id != :userId', { userId })
      .andWhere('message.status != :read', { read: MessageStatus.READ })
      .getCount();

    return result;
  }

  /**
   * Archive chat room when booking is completed
   */
  async archiveRoom(bookingId: string): Promise<void> {
    await this.chatRoomRepository.update(
      { bookingId },
      { status: ChatRoomStatus.ARCHIVED },
    );
  }

  /**
   * Close chat room when booking is cancelled
   */
  async closeRoom(bookingId: string): Promise<void> {
    await this.chatRoomRepository.update(
      { bookingId },
      { status: ChatRoomStatus.CLOSED },
    );
  }
}

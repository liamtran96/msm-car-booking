import { DataSource } from 'typeorm';
import { StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import {
  startTestDatabase,
  getTestDataSourceOptions,
  cleanDatabase,
} from '../setup/test-database';
import { seedTestData, SeededData } from '../../src/test/utils/database-seeder';
import { BookingsModule } from '../../src/modules/bookings/bookings.module';
import { UsersModule } from '../../src/modules/users/users.module';
import { VehiclesModule } from '../../src/modules/vehicles/vehicles.module';
import { DepartmentsModule } from '../../src/modules/departments/departments.module';
import { ApprovalsModule } from '../../src/modules/approvals/approvals.module';
import { NotificationsModule } from '../../src/modules/notifications/notifications.module';
import { ChatModule } from '../../src/modules/chat/chat.module';
import { ChatService } from '../../src/modules/chat/chat.service';
import { Booking } from '../../src/modules/bookings/entities/booking.entity';
import { ChatRoom } from '../../src/modules/chat/entities/chat-room.entity';
import {
  BookingStatus,
  BookingType,
  ApprovalType,
  ChatRoomStatus,
} from '../../src/common/enums';

describe('Chat Messaging Integration', () => {
  let container: StartedPostgreSqlContainer;
  let dataSource: DataSource;
  let module: TestingModule;
  let seededData: SeededData;
  let chatService: ChatService;
  let testBooking: Booking;
  let testChatRoom: ChatRoom;

  beforeAll(async () => {
    container = await startTestDatabase();
    const dsOptions = getTestDataSourceOptions(container);

    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [
            () => ({
              database: {
                host: container.getHost(),
                port: container.getMappedPort(5432),
                username: container.getUsername(),
                password: container.getPassword(),
                name: container.getDatabase(),
                synchronize: true,
                logging: false,
              },
              app: {
                jwt: {
                  secret: 'test-jwt-secret-key-for-testing',
                  expiresIn: '1d',
                },
              },
            }),
          ],
        }),
        TypeOrmModule.forRoot({
          ...dsOptions,
          autoLoadEntities: true,
        }),
        JwtModule.register({
          secret: 'test-jwt-secret-key-for-testing',
          signOptions: { expiresIn: '1d' },
        }),
        BookingsModule,
        UsersModule,
        VehiclesModule,
        DepartmentsModule,
        ApprovalsModule,
        NotificationsModule,
        ChatModule,
      ],
    }).compile();

    dataSource = module.get(DataSource);
    chatService = module.get(ChatService);
    seededData = await seedTestData(dataSource);

    // Create block schedule booking for chat
    const bookingRepo = dataSource.getRepository(Booking);
    testBooking = await bookingRepo.save({
      bookingCode: `MSM-CHAT-${Date.now()}`,
      requesterId: seededData.users.employee.id,
      departmentId: seededData.departments[0].id,
      bookingType: BookingType.BLOCK_SCHEDULE,
      status: BookingStatus.CONFIRMED,
      approvalType: ApprovalType.AUTO_APPROVED,
      isBusinessTrip: false,
      scheduledDate: new Date(),
      scheduledTime: '08:00',
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      purpose: 'Block schedule for chat test',
      passengerCount: 1,
      estimatedKm: 200,
      assignedVehicleId: seededData.vehicles[0].id,
      assignedDriverId: seededData.users.driver.id,
    });

    // Create chat room for the booking
    const chatRoomRepo = dataSource.getRepository(ChatRoom);
    testChatRoom = await chatRoomRepo.save({
      bookingId: testBooking.id,
      employeeId: seededData.users.employee.id,
      driverId: seededData.users.driver.id,
      status: ChatRoomStatus.ACTIVE,
    });
  });

  afterAll(async () => {
    await cleanDatabase(dataSource);
    await module.close();
  });

  describe('Chat Room Management', () => {
    it('should get or create chat room for booking', async () => {
      const chatRoom = await chatService.getOrCreateRoomForBooking(
        testBooking.id,
        seededData.users.employee.id,
      );

      expect(chatRoom).toBeDefined();
      expect(chatRoom.bookingId).toBe(testBooking.id);
      expect(chatRoom.status).toBe(ChatRoomStatus.ACTIVE);
    });

    it('should return rooms for employee', async () => {
      const rooms = await chatService.getRoomsForUser(
        seededData.users.employee.id,
      );

      expect(rooms.length).toBeGreaterThan(0);
      const foundRoom = rooms.find((r: ChatRoom) => r.id === testChatRoom.id);
      expect(foundRoom).toBeDefined();
    });

    it('should return rooms for driver', async () => {
      const rooms = await chatService.getRoomsForUser(
        seededData.users.driver.id,
      );

      expect(rooms.length).toBeGreaterThan(0);
      const foundRoom = rooms.find((r: ChatRoom) => r.id === testChatRoom.id);
      expect(foundRoom).toBeDefined();
    });
  });

  describe('Message Sending', () => {
    it('should send message from employee', async () => {
      const message = await chatService.sendMessage(
        testChatRoom.id,
        seededData.users.employee.id,
        { content: 'Hello from employee integration test' },
      );

      expect(message.id).toBeDefined();
      expect(message.content).toBe('Hello from employee integration test');
      expect(message.senderId).toBe(seededData.users.employee.id);
      expect(message.chatRoomId).toBe(testChatRoom.id);
    });

    it('should send message from driver', async () => {
      const message = await chatService.sendMessage(
        testChatRoom.id,
        seededData.users.driver.id,
        { content: 'Hello from driver integration test' },
      );

      expect(message.id).toBeDefined();
      expect(message.content).toBe('Hello from driver integration test');
      expect(message.senderId).toBe(seededData.users.driver.id);
    });

    it('should update lastMessageAt on room', async () => {
      const beforeSend = new Date();

      await chatService.sendMessage(
        testChatRoom.id,
        seededData.users.employee.id,
        { content: 'Update last message time' },
      );

      const room = await chatService.getRoomById(
        testChatRoom.id,
        seededData.users.employee.id,
      );
      expect(room.lastMessageAt).toBeDefined();
      expect(new Date(room.lastMessageAt!).getTime()).toBeGreaterThanOrEqual(
        beforeSend.getTime(),
      );
    });
  });

  describe('Message Retrieval', () => {
    it('should retrieve messages for room', async () => {
      // Send some test messages
      await chatService.sendMessage(
        testChatRoom.id,
        seededData.users.employee.id,
        { content: 'Test message 1' },
      );
      await chatService.sendMessage(
        testChatRoom.id,
        seededData.users.driver.id,
        { content: 'Test message 2' },
      );

      const messages = await chatService.getMessages(
        testChatRoom.id,
        seededData.users.employee.id,
      );

      expect(messages.length).toBeGreaterThanOrEqual(2);
    });

    it('should support pagination', async () => {
      const messages = await chatService.getMessages(
        testChatRoom.id,
        seededData.users.employee.id,
        2, // limit
        0, // offset
      );

      expect(messages.length).toBeLessThanOrEqual(2);
    });
  });

  describe('Room Status Management', () => {
    it('should archive chat room', async () => {
      // Create a new room for this test
      const bookingRepo = dataSource.getRepository(Booking);
      const chatRoomRepo = dataSource.getRepository(ChatRoom);

      const newBooking = await bookingRepo.save({
        bookingCode: `MSM-CHAT-ARCH-${Date.now()}`,
        requesterId: seededData.users.employee.id,
        departmentId: seededData.departments[0].id,
        bookingType: BookingType.BLOCK_SCHEDULE,
        status: BookingStatus.COMPLETED,
        approvalType: ApprovalType.AUTO_APPROVED,
        isBusinessTrip: false,
        scheduledDate: new Date(),
        scheduledTime: '09:00',
        endDate: new Date(),
        purpose: 'Completed booking',
        passengerCount: 1,
        estimatedKm: 100,
        assignedVehicleId: seededData.vehicles[0].id,
        assignedDriverId: seededData.users.driver.id,
      });

      await chatRoomRepo.save({
        bookingId: newBooking.id,
        employeeId: seededData.users.employee.id,
        driverId: seededData.users.driver.id,
        status: ChatRoomStatus.ACTIVE,
      });

      await chatService.archiveRoom(newBooking.id);

      const archivedRoom = await chatRoomRepo.findOneBy({
        bookingId: newBooking.id,
      });
      expect(archivedRoom?.status).toBe(ChatRoomStatus.ARCHIVED);
    });
  });
});

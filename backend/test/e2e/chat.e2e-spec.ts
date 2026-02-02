import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { startTestDatabase, cleanDatabase } from '../setup/test-database';
import { createTestApp, TestAppContext } from '../setup/test-app.factory';
import { seedTestData, SeededData } from '../../src/test/utils/database-seeder';
import {
  generateTestTokens,
  authHeader,
  TestTokens,
} from '../../src/test/utils/e2e-test-helper';
import { ChatRoom } from '../../src/modules/chat/entities/chat-room.entity';
import {
  BookingType,
  ChatRoomStatus,
  BookingStatus,
  ApprovalType,
} from '../../src/common/enums';
import { Booking } from '../../src/modules/bookings/entities/booking.entity';

describe('Chat (e2e)', () => {
  let container: StartedPostgreSqlContainer;
  let context: TestAppContext;
  let app: INestApplication;
  let dataSource: DataSource;
  let seededData: SeededData;
  let tokens: TestTokens;
  let testChatRoom: ChatRoom;
  let blockBooking: Booking;

  beforeAll(async () => {
    container = await startTestDatabase();
    context = await createTestApp(container);
    app = context.app;
    dataSource = context.dataSource;
    seededData = await seedTestData(dataSource);
    tokens = generateTestTokens(context.jwtService, seededData.users);

    // Create a block schedule booking (required for chat)
    const bookingRepo = dataSource.getRepository(Booking);
    blockBooking = await bookingRepo.save({
      bookingCode: `MSM-20260202-CHAT${Date.now().toString().slice(-4)}`,
      requesterId: seededData.users.employee.id,
      departmentId: seededData.departments[0].id,
      bookingType: BookingType.BLOCK_SCHEDULE,
      status: BookingStatus.CONFIRMED,
      approvalType: ApprovalType.AUTO_APPROVED,
      isBusinessTrip: true,
      scheduledDate: new Date(),
      scheduledTime: '09:00',
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      purpose: 'Test block schedule',
      passengerCount: 1,
      estimatedKm: 100,
      assignedVehicleId: seededData.vehicles[0].id,
      assignedDriverId: seededData.users.driver.id,
    });

    // Create a test chat room
    const chatRoomRepo = dataSource.getRepository(ChatRoom);
    testChatRoom = await chatRoomRepo.save({
      bookingId: blockBooking.id,
      employeeId: seededData.users.employee.id,
      driverId: seededData.users.driver.id,
      status: ChatRoomStatus.ACTIVE,
    });

    // Start app for WebSocket
    await app.listen(0);
  });

  afterAll(async () => {
    await cleanDatabase(dataSource);
    await app.close();
  });

  describe('GET /chat/rooms', () => {
    it('should return chat rooms for authenticated user', async () => {
      const response = await request(app.getHttpServer())
        .get('/chat/rooms')
        .set(authHeader(tokens.employeeToken))
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should return 401 without authentication', async () => {
      await request(app.getHttpServer()).get('/chat/rooms').expect(401);
    });
  });

  describe('GET /chat/rooms/:id', () => {
    it('should return chat room by ID', async () => {
      const response = await request(app.getHttpServer())
        .get(`/chat/rooms/${testChatRoom.id}`)
        .set(authHeader(tokens.employeeToken))
        .expect(200);

      expect(response.body.id).toBe(testChatRoom.id);
      expect(response.body.status).toBe(ChatRoomStatus.ACTIVE);
    });

    it('should return 404 for non-existent room', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      await request(app.getHttpServer())
        .get(`/chat/rooms/${fakeId}`)
        .set(authHeader(tokens.employeeToken))
        .expect(404);
    });
  });

  describe('GET /chat/rooms/:id/messages', () => {
    it('should return messages for chat room', async () => {
      const response = await request(app.getHttpServer())
        .get(`/chat/rooms/${testChatRoom.id}/messages`)
        .set(authHeader(tokens.employeeToken))
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should support pagination', async () => {
      const response = await request(app.getHttpServer())
        .get(`/chat/rooms/${testChatRoom.id}/messages?limit=10&offset=0`)
        .set(authHeader(tokens.employeeToken))
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('POST /chat/rooms/:id/messages', () => {
    it('should send message to chat room', async () => {
      const response = await request(app.getHttpServer())
        .post(`/chat/rooms/${testChatRoom.id}/messages`)
        .set(authHeader(tokens.employeeToken))
        .send({ content: 'Test message from E2E test' })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.content).toBe('Test message from E2E test');
      expect(response.body.senderId).toBe(seededData.users.employee.id);
    });

    it('should validate message content', async () => {
      await request(app.getHttpServer())
        .post(`/chat/rooms/${testChatRoom.id}/messages`)
        .set(authHeader(tokens.employeeToken))
        .send({}) // Missing content
        .expect(400);
    });
  });

  describe('GET /chat/rooms/booking/:bookingId', () => {
    it('should return chat room by booking ID', async () => {
      const response = await request(app.getHttpServer())
        .get(`/chat/rooms/booking/${blockBooking.id}`)
        .set(authHeader(tokens.employeeToken))
        .expect(200);

      expect(response.body.bookingId).toBe(blockBooking.id);
    });
  });

  describe('POST /chat/rooms/:id/schedule-change', () => {
    it('should send schedule change notification', async () => {
      const response = await request(app.getHttpServer())
        .post(`/chat/rooms/${testChatRoom.id}/schedule-change`)
        .set(authHeader(tokens.employeeToken))
        .send({
          newTime: '09:30',
          reason: 'Traffic delay',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
    });

    it('should validate schedule change data', async () => {
      await request(app.getHttpServer())
        .post(`/chat/rooms/${testChatRoom.id}/schedule-change`)
        .set(authHeader(tokens.employeeToken))
        .send({}) // Missing required newTime field
        .expect(400);
    });

    it('should return 401 without authentication', async () => {
      await request(app.getHttpServer())
        .post(`/chat/rooms/${testChatRoom.id}/schedule-change`)
        .send({
          newTime: '09:30',
        })
        .expect(401);
    });
  });

  describe('POST /chat/rooms/:id/read', () => {
    it('should mark messages as read', async () => {
      await request(app.getHttpServer())
        .post(`/chat/rooms/${testChatRoom.id}/read`)
        .set(authHeader(tokens.employeeToken))
        .expect(201);
    });

    it('should return 401 without authentication', async () => {
      await request(app.getHttpServer())
        .post(`/chat/rooms/${testChatRoom.id}/read`)
        .expect(401);
    });
  });

  describe('GET /chat/unread-count', () => {
    it('should return unread count for employee', async () => {
      const response = await request(app.getHttpServer())
        .get('/chat/unread-count')
        .set(authHeader(tokens.employeeToken))
        .expect(200);

      expect(response.body).toHaveProperty('count');
      expect(typeof response.body.count).toBe('number');
    });

    it('should return unread count for driver', async () => {
      const response = await request(app.getHttpServer())
        .get('/chat/unread-count')
        .set(authHeader(tokens.driverToken))
        .expect(200);

      expect(response.body).toHaveProperty('count');
    });

    it('should return 401 without authentication', async () => {
      await request(app.getHttpServer()).get('/chat/unread-count').expect(401);
    });
  });
});

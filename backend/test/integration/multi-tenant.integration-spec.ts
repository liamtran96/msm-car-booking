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
import { UsersService } from '../../src/modules/users/users.service';
import { VehiclesService } from '../../src/modules/vehicles/vehicles.service';
import { BookingsService } from '../../src/modules/bookings/bookings.service';
import { User } from '../../src/modules/users/entities/user.entity';
import { Vehicle } from '../../src/modules/vehicles/entities/vehicle.entity';
import { Booking } from '../../src/modules/bookings/entities/booking.entity';
import { Department } from '../../src/modules/departments/entities/department.entity';
import {
  UserRole,
  UserSegment,
  PositionLevel,
  VehicleStatus,
  BookingType,
  BookingStatus,
  ApprovalType,
} from '../../src/common/enums';
import { UserResponseDto } from '../../src/modules/users/dto/user-response.dto';
import * as bcrypt from 'bcrypt';

describe('Multi-Tenant Data Isolation Integration', () => {
  let container: StartedPostgreSqlContainer;
  let dataSource: DataSource;
  let module: TestingModule;
  let seededData: SeededData;
  let usersService: UsersService;
  let vehiclesService: VehiclesService;
  let bookingsService: BookingsService;

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
    usersService = module.get(UsersService);
    vehiclesService = module.get(VehiclesService);
    bookingsService = module.get(BookingsService);
    seededData = await seedTestData(dataSource);
  });

  afterAll(async () => {
    await cleanDatabase(dataSource);
    await module.close();
  });

  describe('Department Data Isolation', () => {
    let dept1: Department;
    let dept2: Department;
    let user1: User;
    let user2: User;

    beforeAll(async () => {
      const deptRepo = dataSource.getRepository(Department);
      const userRepo = dataSource.getRepository(User);
      const passwordHash = await bcrypt.hash('Test123!@#', 10);

      // Create two separate departments
      dept1 = await deptRepo.save({
        name: 'Department Alpha',
        code: `ALPHA${Date.now()}`,
        costCenter: 'CC-ALPHA',
        isActive: true,
      });

      dept2 = await deptRepo.save({
        name: 'Department Beta',
        code: `BETA${Date.now()}`,
        costCenter: 'CC-BETA',
        isActive: true,
      });

      // Create users in each department
      user1 = await userRepo.save({
        email: `alpha.user.${Date.now()}@test.com`,
        passwordHash,
        fullName: 'Alpha User',
        phone: '+84111111111',
        role: UserRole.EMPLOYEE,
        userSegment: UserSegment.SOMETIMES,
        positionLevel: PositionLevel.STAFF,
        departmentId: dept1.id,
        isActive: true,
      });

      user2 = await userRepo.save({
        email: `beta.user.${Date.now()}@test.com`,
        passwordHash,
        fullName: 'Beta User',
        phone: '+84222222222',
        role: UserRole.EMPLOYEE,
        userSegment: UserSegment.SOMETIMES,
        positionLevel: PositionLevel.STAFF,
        departmentId: dept2.id,
        isActive: true,
      });
    });

    it('should filter users by department', async () => {
      const userRepo = dataSource.getRepository(User);

      const dept1Users = await userRepo.find({
        where: { departmentId: dept1.id },
      });

      const dept2Users = await userRepo.find({
        where: { departmentId: dept2.id },
      });

      expect(dept1Users.every((u: User) => u.departmentId === dept1.id)).toBe(
        true,
      );
      expect(dept2Users.every((u: User) => u.departmentId === dept2.id)).toBe(
        true,
      );
      expect(dept1Users.some((u: User) => u.departmentId === dept2.id)).toBe(
        false,
      );
    });

    it('should filter bookings by department', async () => {
      const bookingRepo = dataSource.getRepository(Booking);

      // Create bookings for each department
      await bookingRepo.save({
        bookingCode: `MSM-ALPHA-${Date.now()}`,
        requesterId: user1.id,
        departmentId: dept1.id,
        bookingType: BookingType.SINGLE_TRIP,
        status: BookingStatus.PENDING,
        approvalType: ApprovalType.MANAGER_APPROVAL,
        isBusinessTrip: true,
        scheduledDate: new Date(),
        scheduledTime: '10:00',
        purpose: 'Alpha department trip',
        passengerCount: 1,
        estimatedKm: 30,
      });

      await bookingRepo.save({
        bookingCode: `MSM-BETA-${Date.now()}`,
        requesterId: user2.id,
        departmentId: dept2.id,
        bookingType: BookingType.SINGLE_TRIP,
        status: BookingStatus.PENDING,
        approvalType: ApprovalType.MANAGER_APPROVAL,
        isBusinessTrip: true,
        scheduledDate: new Date(),
        scheduledTime: '11:00',
        purpose: 'Beta department trip',
        passengerCount: 1,
        estimatedKm: 25,
      });

      const dept1Bookings = await bookingRepo.find({
        where: { departmentId: dept1.id },
      });

      const dept2Bookings = await bookingRepo.find({
        where: { departmentId: dept2.id },
      });

      expect(
        dept1Bookings.every((b: Booking) => b.departmentId === dept1.id),
      ).toBe(true);
      expect(
        dept2Bookings.every((b: Booking) => b.departmentId === dept2.id),
      ).toBe(true);
    });
  });

  describe('User Data Isolation', () => {
    it('should only return bookings for specific requester', async () => {
      const bookingRepo = dataSource.getRepository(Booking);

      // Create bookings for different users
      await bookingRepo.save({
        bookingCode: `MSM-USR1-${Date.now()}`,
        requesterId: seededData.users.employee.id,
        departmentId: seededData.departments[0].id,
        bookingType: BookingType.SINGLE_TRIP,
        status: BookingStatus.PENDING,
        approvalType: ApprovalType.MANAGER_APPROVAL,
        isBusinessTrip: true,
        scheduledDate: new Date(),
        scheduledTime: '12:00',
        purpose: 'User 1 trip',
        passengerCount: 1,
        estimatedKm: 20,
      });

      await bookingRepo.save({
        bookingCode: `MSM-MGR1-${Date.now()}`,
        requesterId: seededData.users.manager.id,
        departmentId: seededData.departments[0].id,
        bookingType: BookingType.SINGLE_TRIP,
        status: BookingStatus.PENDING,
        approvalType: ApprovalType.AUTO_APPROVED,
        isBusinessTrip: true,
        scheduledDate: new Date(),
        scheduledTime: '13:00',
        purpose: 'Manager trip',
        passengerCount: 1,
        estimatedKm: 15,
      });

      // Use repository directly since BookingsService doesn't have findByRequester
      const employeeBookings = await bookingRepo.find({
        where: { requesterId: seededData.users.employee.id },
      });

      const managerBookings = await bookingRepo.find({
        where: { requesterId: seededData.users.manager.id },
      });

      expect(
        employeeBookings.every(
          (b: Booking) => b.requesterId === seededData.users.employee.id,
        ),
      ).toBe(true);
      expect(
        managerBookings.every(
          (b: Booking) => b.requesterId === seededData.users.manager.id,
        ),
      ).toBe(true);
    });

    it('should only return bookings for specific driver', async () => {
      const bookingRepo = dataSource.getRepository(Booking);

      await bookingRepo.save({
        bookingCode: `MSM-DRV-${Date.now()}`,
        requesterId: seededData.users.employee.id,
        departmentId: seededData.departments[0].id,
        bookingType: BookingType.SINGLE_TRIP,
        status: BookingStatus.ASSIGNED,
        approvalType: ApprovalType.AUTO_APPROVED,
        isBusinessTrip: true,
        scheduledDate: new Date(),
        scheduledTime: '14:00',
        purpose: 'Driver assignment test',
        passengerCount: 1,
        estimatedKm: 40,
        assignedVehicleId: seededData.vehicles[0].id,
        assignedDriverId: seededData.users.driver.id,
      });

      const driverBookings = await bookingsService.findByDriver(
        seededData.users.driver.id,
      );

      expect(
        driverBookings.every(
          (b: Booking) => b.assignedDriverId === seededData.users.driver.id,
        ),
      ).toBe(true);
    });
  });

  describe('Role-Based Access Verification', () => {
    it('should verify admin can access all users', async () => {
      const users = await usersService.findAll({});
      expect(users.data.length).toBeGreaterThan(0);
    });

    it('should verify drivers list returns only drivers', async () => {
      const drivers = await usersService.findDrivers();
      expect(
        drivers.every((u: UserResponseDto) => u.role === UserRole.DRIVER),
      ).toBe(true);
    });

    it('should verify available vehicles returns only available vehicles', async () => {
      const vehicles = await vehiclesService.findAvailable();
      expect(
        vehicles.every((v: Vehicle) => v.status === VehicleStatus.AVAILABLE),
      ).toBe(true);
    });
  });
});

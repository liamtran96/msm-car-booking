import { DataSource, Repository } from 'typeorm';
import { User } from '../../modules/users/entities/user.entity';
import { Department } from '../../modules/departments/entities/department.entity';
import { Vehicle } from '../../modules/vehicles/entities/vehicle.entity';
import { Booking } from '../../modules/bookings/entities/booking.entity';
import {
  UserRole,
  UserSegment,
  PositionLevel,
  VehicleType,
  VehicleStatus,
  BookingType,
  BookingStatus,
  ApprovalType,
} from '../../common/enums';
import * as bcrypt from 'bcrypt';

export interface SeededData {
  departments: Department[];
  users: {
    admin: User;
    pic: User;
    ga: User;
    driver: User;
    employee: User;
    manager: User;
    sicEmployee: User;
  };
  vehicles: Vehicle[];
  bookings: Booking[];
}

/**
 * Seeds the database with test data
 */
export async function seedTestData(
  dataSource: DataSource,
): Promise<SeededData> {
  const departmentRepo = dataSource.getRepository(Department);
  const userRepo = dataSource.getRepository(User);
  const vehicleRepo = dataSource.getRepository(Vehicle);
  const bookingRepo = dataSource.getRepository(Booking);

  // Create departments
  const departments = await createDepartments(departmentRepo);

  // Create users
  const users = await createUsers(userRepo, departments[0]);

  // Create vehicles
  const vehicles = await createVehicles(vehicleRepo, users.driver);

  // Create sample bookings
  const bookings = await createBookings(
    bookingRepo,
    users.employee,
    departments[0],
    vehicles[0],
    users.driver,
  );

  return { departments, users, vehicles, bookings };
}

async function createDepartments(
  repo: Repository<Department>,
): Promise<Department[]> {
  const departments = [
    { name: 'Engineering', code: 'ENG', costCenter: 'CC-001' },
    { name: 'Marketing', code: 'MKT', costCenter: 'CC-002' },
    { name: 'Operations', code: 'OPS', costCenter: 'CC-003' },
  ];

  const created: Department[] = [];
  for (const dept of departments) {
    const entity = repo.create({ ...dept, isActive: true });
    created.push(await repo.save(entity));
  }
  return created;
}

async function createUsers(
  repo: Repository<User>,
  department: Department,
): Promise<SeededData['users']> {
  const passwordHash = await bcrypt.hash('Test123!@#', 10);

  // Create manager first (for managerId references)
  const manager = repo.create({
    email: 'manager@test.com',
    passwordHash,
    fullName: 'Test Manager',
    phone: '+84123456700',
    role: UserRole.EMPLOYEE,
    userSegment: UserSegment.SOMETIMES,
    positionLevel: PositionLevel.MGR,
    departmentId: department.id,
    isActive: true,
  });
  const savedManager = await repo.save(manager);

  const admin = repo.create({
    email: 'admin@test.com',
    passwordHash,
    fullName: 'Test Admin',
    phone: '+84123456701',
    role: UserRole.ADMIN,
    userSegment: UserSegment.SOMETIMES,
    positionLevel: PositionLevel.C_LEVEL,
    departmentId: department.id,
    isActive: true,
  });
  const savedAdmin = await repo.save(admin);

  const pic = repo.create({
    email: 'pic@test.com',
    passwordHash,
    fullName: 'Test PIC',
    phone: '+84123456702',
    role: UserRole.PIC,
    userSegment: UserSegment.SOMETIMES,
    positionLevel: PositionLevel.STAFF,
    departmentId: department.id,
    isActive: true,
  });
  const savedPic = await repo.save(pic);

  const ga = repo.create({
    email: 'ga@test.com',
    passwordHash,
    fullName: 'Test GA',
    phone: '+84123456703',
    role: UserRole.GA,
    userSegment: UserSegment.SOMETIMES,
    positionLevel: PositionLevel.STAFF,
    departmentId: department.id,
    isActive: true,
  });
  const savedGa = await repo.save(ga);

  const driver = repo.create({
    email: 'driver@test.com',
    passwordHash,
    fullName: 'Test Driver',
    phone: '+84123456704',
    role: UserRole.DRIVER,
    userSegment: UserSegment.DAILY,
    positionLevel: PositionLevel.STAFF,
    departmentId: department.id,
    isActive: true,
  });
  const savedDriver = await repo.save(driver);

  const employee = repo.create({
    email: 'employee@test.com',
    passwordHash,
    fullName: 'Test Employee',
    phone: '+84123456705',
    role: UserRole.EMPLOYEE,
    userSegment: UserSegment.SOMETIMES,
    positionLevel: PositionLevel.STAFF,
    managerId: savedManager.id,
    departmentId: department.id,
    isActive: true,
  });
  const savedEmployee = await repo.save(employee);

  const sicEmployee = repo.create({
    email: 'sic.employee@test.com',
    passwordHash,
    fullName: 'SIC Employee',
    phone: '+84123456706',
    role: UserRole.EMPLOYEE,
    userSegment: UserSegment.DAILY, // SIC user
    positionLevel: PositionLevel.STAFF,
    managerId: savedManager.id,
    departmentId: department.id,
    isActive: true,
  });
  const savedSicEmployee = await repo.save(sicEmployee);

  return {
    admin: savedAdmin,
    pic: savedPic,
    ga: savedGa,
    driver: savedDriver,
    employee: savedEmployee,
    manager: savedManager,
    sicEmployee: savedSicEmployee,
  };
}

async function createVehicles(
  repo: Repository<Vehicle>,
  driver: User,
): Promise<Vehicle[]> {
  const vehicle1 = repo.create({
    licensePlate: '51A-TEST1',
    brand: 'Toyota',
    model: 'Camry',
    year: 2023,
    capacity: 4,
    vehicleType: VehicleType.SEDAN,
    status: VehicleStatus.AVAILABLE,
    currentOdometerKm: 10000,
    gpsDeviceId: 'GPS-TEST-001',
    assignedDriverId: driver.id,
    isActive: true,
  });

  const vehicle2 = repo.create({
    licensePlate: '51A-TEST2',
    brand: 'Toyota',
    model: 'Fortuner',
    year: 2023,
    capacity: 7,
    vehicleType: VehicleType.SUV,
    status: VehicleStatus.AVAILABLE,
    currentOdometerKm: 15000,
    gpsDeviceId: 'GPS-TEST-002',
    isActive: true,
  });

  const vehicle3 = repo.create({
    licensePlate: '51A-TEST3',
    brand: 'Ford',
    model: 'Transit',
    year: 2022,
    capacity: 16,
    vehicleType: VehicleType.VAN,
    status: VehicleStatus.MAINTENANCE,
    currentOdometerKm: 50000,
    gpsDeviceId: 'GPS-TEST-003',
    isActive: true,
  });

  return Promise.all([
    repo.save(vehicle1),
    repo.save(vehicle2),
    repo.save(vehicle3),
  ]);
}

async function createBookings(
  repo: Repository<Booking>,
  requester: User,
  department: Department,
  vehicle: Vehicle,
  driver: User,
): Promise<Booking[]> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const booking1 = repo.create({
    bookingCode: 'MSM-20260202-0001',
    requesterId: requester.id,
    departmentId: department.id,
    bookingType: BookingType.SINGLE_TRIP,
    status: BookingStatus.PENDING,
    approvalType: ApprovalType.MANAGER_APPROVAL,
    isBusinessTrip: true,
    scheduledDate: today,
    scheduledTime: '09:00',
    purpose: 'Client meeting',
    passengerCount: 2,
    estimatedKm: 50,
  });

  const booking2 = repo.create({
    bookingCode: 'MSM-20260202-0002',
    requesterId: requester.id,
    departmentId: department.id,
    bookingType: BookingType.SINGLE_TRIP,
    status: BookingStatus.CONFIRMED,
    approvalType: ApprovalType.AUTO_APPROVED,
    isBusinessTrip: true,
    scheduledDate: today,
    scheduledTime: '14:00',
    purpose: 'Office visit',
    passengerCount: 1,
    estimatedKm: 30,
    assignedVehicleId: vehicle.id,
    assignedDriverId: driver.id,
  });

  return Promise.all([repo.save(booking1), repo.save(booking2)]);
}

/**
 * Cleans all seeded data from database
 */
export async function cleanTestData(dataSource: DataSource): Promise<void> {
  const entities = dataSource.entityMetadatas;

  await dataSource.query('SET session_replication_role = replica;');

  for (const entity of entities) {
    await dataSource.query(`TRUNCATE TABLE "${entity.tableName}" CASCADE;`);
  }

  await dataSource.query('SET session_replication_role = DEFAULT;');
}

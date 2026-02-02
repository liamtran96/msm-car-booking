import { Vehicle } from '../../modules/vehicles/entities/vehicle.entity';
import { VehicleType, VehicleStatus } from '../../common/enums';
import { generateUuid } from '../utils/test-helper';
import { User } from '../../modules/users/entities/user.entity';

export interface CreateVehicleOptions {
  id?: string;
  licensePlate?: string;
  brand?: string;
  model?: string;
  year?: number;
  capacity?: number;
  vehicleType?: VehicleType;
  status?: VehicleStatus;
  currentOdometerKm?: number;
  gpsDeviceId?: string;
  assignedDriverId?: string;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Creates a mock Vehicle entity
 */
export function createMockVehicle(options: CreateVehicleOptions = {}): Vehicle {
  const now = new Date();
  const suffix = Date.now().toString().slice(-4);
  return {
    id: options.id ?? generateUuid(),
    licensePlate: options.licensePlate ?? `51A-${suffix}`,
    brand: options.brand ?? 'Toyota',
    model: options.model ?? 'Camry',
    year: options.year ?? 2023,
    capacity: options.capacity ?? 4,
    vehicleType: options.vehicleType ?? VehicleType.SEDAN,
    status: options.status ?? VehicleStatus.AVAILABLE,
    currentOdometerKm: options.currentOdometerKm ?? 10000,
    gpsDeviceId: options.gpsDeviceId ?? `GPS-${suffix}`,
    assignedDriverId: options.assignedDriverId ?? null!,
    assignedDriver: undefined as unknown as User,
    isActive: options.isActive ?? true,
    createdAt: options.createdAt ?? now,
    updatedAt: options.updatedAt ?? now,
  };
}

/**
 * Creates an available vehicle
 */
export function createAvailableVehicle(
  options: CreateVehicleOptions = {},
): Vehicle {
  return createMockVehicle({
    ...options,
    status: VehicleStatus.AVAILABLE,
  });
}

/**
 * Creates an in-use vehicle
 */
export function createInUseVehicle(
  options: CreateVehicleOptions = {},
): Vehicle {
  return createMockVehicle({
    ...options,
    status: VehicleStatus.IN_USE,
  });
}

/**
 * Creates a maintenance vehicle
 */
export function createMaintenanceVehicle(
  options: CreateVehicleOptions = {},
): Vehicle {
  return createMockVehicle({
    ...options,
    status: VehicleStatus.MAINTENANCE,
  });
}

/**
 * Creates an SUV vehicle
 */
export function createSuvVehicle(options: CreateVehicleOptions = {}): Vehicle {
  return createMockVehicle({
    ...options,
    vehicleType: VehicleType.SUV,
    capacity: 7,
    brand: 'Toyota',
    model: 'Fortuner',
  });
}

/**
 * Creates a van vehicle
 */
export function createVanVehicle(options: CreateVehicleOptions = {}): Vehicle {
  return createMockVehicle({
    ...options,
    vehicleType: VehicleType.VAN,
    capacity: 16,
    brand: 'Ford',
    model: 'Transit',
  });
}

/**
 * Creates multiple mock vehicles
 */
export function createMockVehicles(
  count: number,
  options: CreateVehicleOptions = {},
): Vehicle[] {
  return Array.from({ length: count }, (_, i) =>
    createMockVehicle({
      ...options,
      licensePlate: options.licensePlate ?? `51A-${1000 + i}`,
    }),
  );
}

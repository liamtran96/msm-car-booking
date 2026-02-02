import { GpsLocation } from '../../modules/gps/entities/gps-location.entity';
import { generateUuid } from '../utils/test-helper';
import { Vehicle } from '../../modules/vehicles/entities/vehicle.entity';

export interface CreateGpsLocationOptions {
  id?: string;
  vehicleId?: string;
  latitude?: number;
  longitude?: number;
  speedKmh?: number;
  heading?: number;
  recordedAt?: Date;
}

/**
 * Creates a mock GpsLocation entity
 */
export function createMockGpsLocation(
  options: CreateGpsLocationOptions = {},
): GpsLocation {
  return {
    id: options.id ?? generateUuid(),
    vehicleId: options.vehicleId ?? generateUuid(),
    vehicle: undefined as unknown as Vehicle,
    latitude: options.latitude ?? 10.762622, // Ho Chi Minh City coordinates
    longitude: options.longitude ?? 106.660172,
    speedKmh: options.speedKmh ?? 0,
    heading: options.heading ?? 0,
    recordedAt: options.recordedAt ?? new Date(),
  };
}

/**
 * Creates a moving vehicle GPS location
 */
export function createMovingGpsLocation(
  options: CreateGpsLocationOptions = {},
): GpsLocation {
  return createMockGpsLocation({
    ...options,
    speedKmh: options.speedKmh ?? 45,
    heading: options.heading ?? 90,
  });
}

/**
 * Creates a stationary vehicle GPS location
 */
export function createStationaryGpsLocation(
  options: CreateGpsLocationOptions = {},
): GpsLocation {
  return createMockGpsLocation({
    ...options,
    speedKmh: 0,
    heading: 0,
  });
}

/**
 * Creates multiple GPS locations for a vehicle (simulating a route)
 */
export function createGpsLocationHistory(
  vehicleId: string,
  count: number,
  intervalMinutes: number = 5,
): GpsLocation[] {
  const now = new Date();
  const baseLatitude = 10.762622;
  const baseLongitude = 106.660172;

  return Array.from({ length: count }, (_, i) => {
    const recordedAt = new Date(
      now.getTime() - (count - i - 1) * intervalMinutes * 60 * 1000,
    );
    return createMockGpsLocation({
      vehicleId,
      latitude: baseLatitude + i * 0.001,
      longitude: baseLongitude + i * 0.001,
      speedKmh: i === count - 1 ? 0 : 40 + Math.random() * 20,
      heading: 45 + Math.random() * 10,
      recordedAt,
    });
  });
}

/**
 * Creates GPS locations for multiple vehicles (latest position each)
 */
export function createLatestPositions(vehicleIds: string[]): GpsLocation[] {
  return vehicleIds.map((vehicleId, i) =>
    createMockGpsLocation({
      vehicleId,
      latitude: 10.762622 + i * 0.01,
      longitude: 106.660172 + i * 0.01,
    }),
  );
}

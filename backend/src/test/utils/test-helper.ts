import { Test, TestingModule } from '@nestjs/testing';
import { Type, Provider } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';

/**
 * Creates a mock guard that always allows access
 */
export const createMockGuard = () => ({
  canActivate: jest.fn().mockReturnValue(true),
});

/**
 * Creates a testing module with common configurations
 */
export async function createTestingModule(options: {
  controllers?: Type<unknown>[];
  providers?: Provider[];
  imports?: Type<unknown>[];
}): Promise<TestingModule> {
  const moduleBuilder = Test.createTestingModule({
    controllers: options.controllers || [],
    providers: options.providers || [],
    imports: options.imports || [],
  });

  return moduleBuilder.compile();
}

/**
 * Creates a mock repository token provider
 */
export function mockRepositoryProvider<T>(
  entity: Type<T>,
  mockRepository: object,
) {
  return {
    provide: getRepositoryToken(entity),
    useValue: mockRepository,
  };
}

/**
 * Creates a mock service provider
 */
export function mockServiceProvider<T>(service: Type<T>, mockService: object) {
  return {
    provide: service,
    useValue: mockService,
  };
}

/**
 * Generates a random UUID for testing
 */
export function generateUuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Creates a date offset from now
 */
export function dateOffset(days: number, hours: number = 0): Date {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(date.getHours() + hours);
  return date;
}

/**
 * Creates today's date at midnight
 */
export function today(): Date {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

/**
 * Formats time string (HH:mm)
 */
export function formatTime(hours: number, minutes: number = 0): string {
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

/**
 * Formats date string (YYYY-MM-DD)
 */
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

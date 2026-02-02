import { Department } from '../../modules/departments/entities/department.entity';
import { generateUuid } from '../utils/test-helper';

export interface CreateDepartmentOptions {
  id?: string;
  name?: string;
  code?: string;
  costCenter?: string;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Creates a mock Department entity
 */
export function createMockDepartment(
  options: CreateDepartmentOptions = {},
): Department {
  const now = new Date();
  const suffix = Date.now().toString().slice(-4);
  return {
    id: options.id ?? generateUuid(),
    name: options.name ?? `Department ${suffix}`,
    code: options.code ?? `DEPT-${suffix}`,
    costCenter: options.costCenter ?? `CC-${suffix}`,
    isActive: options.isActive ?? true,
    createdAt: options.createdAt ?? now,
    updatedAt: options.updatedAt ?? now,
  };
}

/**
 * Creates multiple mock departments
 */
export function createMockDepartments(
  count: number,
  options: CreateDepartmentOptions = {},
): Department[] {
  return Array.from({ length: count }, (_, i) =>
    createMockDepartment({
      ...options,
      name: options.name ?? `Department ${i + 1}`,
      code: options.code ?? `DEPT-${i + 1}`,
    }),
  );
}

/**
 * Creates an inactive department
 */
export function createInactiveDepartment(
  options: CreateDepartmentOptions = {},
): Department {
  return createMockDepartment({
    ...options,
    isActive: false,
  });
}

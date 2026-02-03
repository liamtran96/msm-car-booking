import { UserRole } from '@/types/enums';

export const ROUTE_PERMISSIONS: Record<string, UserRole[]> = {
  '/dashboard': [UserRole.ADMIN, UserRole.PIC, UserRole.GA, UserRole.DRIVER, UserRole.EMPLOYEE],
  '/users': [UserRole.ADMIN],
  '/bookings': [UserRole.ADMIN, UserRole.PIC, UserRole.EMPLOYEE],
  '/vehicles': [UserRole.ADMIN, UserRole.PIC],
};

export const DEFAULT_ROUTE_BY_ROLE: Record<UserRole, string> = {
  [UserRole.ADMIN]: '/dashboard',
  [UserRole.PIC]: '/dashboard',
  [UserRole.GA]: '/dashboard',
  [UserRole.DRIVER]: '/dashboard',
  [UserRole.EMPLOYEE]: '/dashboard',
};

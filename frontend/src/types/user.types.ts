import type { UserRole, UserSegment, PositionLevel } from './enums';

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  role: UserRole;
  userSegment: UserSegment | null;
  positionLevel: PositionLevel;
  managerId: string | null;
  departmentId: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

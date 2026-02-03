import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import type { UserRole } from '@/types/enums';

interface RoleGuardProps {
  allowedRoles: UserRole[];
  fallbackPath?: string;
}

export function RoleGuard({ allowedRoles, fallbackPath = '/dashboard' }: RoleGuardProps) {
  const { user } = useAuth();

  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to={fallbackPath} replace />;
  }

  return <Outlet />;
}

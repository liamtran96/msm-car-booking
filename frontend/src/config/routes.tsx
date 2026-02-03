import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProtectedRoute, RoleGuard } from '@/features/auth';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { DashboardPage } from '@/features/dashboard';
import { UsersPage } from '@/features/users';
import { BookingsPage } from '@/features/bookings';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { UserRole } from '@/types/enums';

export const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    children: [
      { path: '/login', element: <LoginPage /> },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <Navigate to="/dashboard" replace /> },
          { path: 'dashboard', element: <DashboardPage /> },
          {
            element: <RoleGuard allowedRoles={[UserRole.ADMIN]} />,
            children: [
              { path: 'users', element: <UsersPage /> },
            ],
          },
          {
            element: <RoleGuard allowedRoles={[UserRole.ADMIN, UserRole.PIC, UserRole.EMPLOYEE]} />,
            children: [
              { path: 'bookings', element: <BookingsPage /> },
            ],
          },
        ],
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
]);

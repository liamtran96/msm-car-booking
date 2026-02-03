import { useAuth } from '@/features/auth/hooks/useAuth';

export function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="text-muted-foreground">
        Welcome back, {user?.fullName ?? 'User'}
      </p>
    </div>
  );
}

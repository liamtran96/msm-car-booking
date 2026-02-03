import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { UserRole } from '@/types/enums';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

export function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen">
      <header className="glass sticky top-0 z-50">
        <div className="flex h-14 items-center justify-between px-4 md:px-6">
          <nav role="navigation" className="flex items-center gap-6">
            <Link to="/dashboard" className="text-sm font-semibold">
              MSM Car Booking
            </Link>
            <Link to="/dashboard" className="text-muted-foreground hover:text-foreground text-sm">
              Dashboard
            </Link>
            <Link to="/bookings" className="text-muted-foreground hover:text-foreground text-sm">
              Bookings
            </Link>
            {user?.role === UserRole.ADMIN && (
              <Link to="/users" className="text-muted-foreground hover:text-foreground text-sm">
                Users
              </Link>
            )}
          </nav>

          <div className="flex items-center gap-4">
            <span className="text-muted-foreground text-sm">{user?.fullName}</span>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="p-4 md:p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
}

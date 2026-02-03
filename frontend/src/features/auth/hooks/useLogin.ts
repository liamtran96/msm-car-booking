import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/auth.service';
import { useAuthStore } from '../store/auth.store';
import { DEFAULT_ROUTE_BY_ROLE } from '@/constants/roles';
import type { LoginCredentials } from '../types/auth.types';

export function useLogin() {
  const navigate = useNavigate();
  const setUser = useAuthStore((state) => state.setUser);

  return useMutation({
    mutationFn: (credentials: LoginCredentials) => authService.login(credentials),
    onSuccess: (data) => {
      setUser(data.user);
      const defaultRoute = DEFAULT_ROUTE_BY_ROLE[data.user.role] ?? '/dashboard';
      navigate(defaultRoute, { replace: true });
    },
  });
}

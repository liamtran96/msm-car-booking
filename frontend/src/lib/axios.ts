import axios from 'axios';

export const apiClient = axios.create({
  baseURL: '/api/v1',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      const isLoginRequest = error.config?.url?.includes('/auth/login');
      const isMeRequest = error.config?.url?.includes('/auth/me');

      if (!isLoginRequest && !isMeRequest) {
        localStorage.removeItem('auth-user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

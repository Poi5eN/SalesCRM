import { useAuthStore } from '@/store/auth.store.ts';
import * as authApi from '@/api/auth.api.ts';
import { useNavigate } from 'react-router-dom';
import { useCallback } from 'react';

export const useAuth = () => {
  const { user, tenant, isAuthenticated, isLoading, setAuth, clearAuth, setLoading } = useAuthStore();
  const navigate = useNavigate();

  const login = async (credentials: any) => {
    setLoading(true);
    try {
      const response = await authApi.login(credentials);
      const { user, accessToken, tenant } = response.data;
      setAuth(user, accessToken, tenant);
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      clearAuth();
      navigate('/login');
    }
  }, [clearAuth, navigate]);

  return {
    user,
    tenant,
    isAuthenticated,
    isLoading,
    login,
    logout,
  };
};

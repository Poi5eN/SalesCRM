import { useAuthStore } from '@/store/auth.store.ts';
import client from '@/api/client.ts';
import { useNavigate } from 'react-router-dom';

export const useAuth = () => {
  const { user, tenant, isAuthenticated, setAuth, clearAuth } = useAuthStore();
  const navigate = useNavigate();

  const login = async (credentials: any) => {
    const { data } = await client.post('/auth/login', credentials);
    const { user, accessToken, tenant } = data.data;
    setAuth(user, accessToken, tenant);
    navigate('/dashboard');
  };

  const logout = async () => {
    try {
      await client.post('/auth/logout');
    } finally {
      clearAuth();
      navigate('/login');
    }
  };

  return {
    user,
    tenant,
    isAuthenticated,
    login,
    logout,
  };
};

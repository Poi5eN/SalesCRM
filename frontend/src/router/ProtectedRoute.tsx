
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store.ts';

export const ProtectedRoute = () => {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

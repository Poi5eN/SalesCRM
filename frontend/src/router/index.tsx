import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute.tsx';
import { AppShell } from '@/components/layout/AppShell.tsx';

// Lazy load pages
const LoginPage = lazy(() => import('@/pages/auth/LoginPage.tsx'));
const DashboardPage = lazy(() => import('@/pages/dashboard/DashboardPage.tsx'));
const LeadsPage = lazy(() => import('@/pages/leads/LeadsPage.tsx'));
const DealsPage = lazy(() => import('@/pages/PlaceholderPages.tsx').then(m => ({ default: m.DealsPage })));
const ContactsPage = lazy(() => import('@/pages/PlaceholderPages.tsx').then(m => ({ default: m.ContactsPage })));
const CompaniesPage = lazy(() => import('@/pages/PlaceholderPages.tsx').then(m => ({ default: m.CompaniesPage })));
const TasksPage = lazy(() => import('@/pages/PlaceholderPages.tsx').then(m => ({ default: m.TasksPage })));
const CommunicationsPage = lazy(() => import('@/pages/PlaceholderPages.tsx').then(m => ({ default: m.CommunicationsPage })));
const ProductsPage = lazy(() => import('@/pages/PlaceholderPages.tsx').then(m => ({ default: m.ProductsPage })));
const ProposalsPage = lazy(() => import('@/pages/PlaceholderPages.tsx').then(m => ({ default: m.ProposalsPage })));
const SettingsPage = lazy(() => import('@/pages/PlaceholderPages.tsx').then(m => ({ default: m.SettingsPage })));

export const AppRouter = () => {
  return (
    <Suspense fallback={<div className="h-screen w-screen flex items-center justify-center">Loading...</div>}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        
        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell children={<Outlet />} />}>
             <Route index element={<Navigate to="/dashboard" replace />} />
             <Route path="/dashboard" element={<DashboardPage />} />
             <Route path="/leads" element={<LeadsPage />} />
             <Route path="/deals" element={<DealsPage />} />
             <Route path="/contacts" element={<ContactsPage />} />
             <Route path="/companies" element={<CompaniesPage />} />
             <Route path="/tasks" element={<TasksPage />} />
             <Route path="/communications" element={<CommunicationsPage />} />
             <Route path="/products" element={<ProductsPage />} />
             <Route path="/proposals" element={<ProposalsPage />} />
             <Route path="/settings" element={<SettingsPage />} />
             <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  );
};

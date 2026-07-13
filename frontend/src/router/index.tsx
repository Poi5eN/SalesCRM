import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute.tsx';
import { AppShell } from '@/components/layout/AppShell.tsx';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary.tsx';

// Lazy load pages
const LoginPage = lazy(() => import('@/pages/auth/LoginPage.tsx'));
const DashboardPage = lazy(() => import('@/pages/dashboard/DashboardPage.tsx'));
const LeadsPage = lazy(() => import('@/pages/leads/LeadsPage.tsx'));
const CampaignsPage = lazy(() => import('@/pages/campaigns/CampaignsPage.tsx'));
const DealsPage = lazy(() => import('@/pages/deals/DealsPage.tsx'));
const ContactsPage = lazy(() => import('@/pages/contacts/ContactsPage.tsx'));
const CompaniesPage = lazy(() => import('@/pages/companies/CompaniesPage.tsx'));
const TasksPage = lazy(() => import('@/pages/tasks/TasksPage.tsx'));
const CommunicationsPage = lazy(() => import('@/pages/communications/CommunicationsPage.tsx'));
const ProductsPage = lazy(() => import('@/pages/products/ProductsPage.tsx'));
const ProposalsPage = lazy(() => import('@/pages/proposals/ProposalsPage.tsx'));
const ProposalBuilder = lazy(() => import('@/pages/proposals/ProposalBuilder.tsx'));
const ProposalDetail = lazy(() => import('@/pages/proposals/ProposalDetail.tsx'));
const PublicProposalView = lazy(() => import('@/pages/proposals/PublicProposalView.tsx'));
const SettingsPage = lazy(() => import('@/pages/settings/SettingsPage.tsx'));
const ReportsPage = lazy(() => import('@/pages/reports/ReportsPage.tsx'));

export const AppRouter = () => {
  return (
    <Suspense fallback={<div className="h-screen w-screen flex items-center justify-center">Loading...</div>}>
      <ErrorBoundary>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          <Route element={<ProtectedRoute />}>
            <Route element={<AppShell children={<Outlet />} />}>
               <Route index element={<Navigate to="/dashboard" replace />} />
               <Route path="/dashboard" element={<DashboardPage />} />
               <Route path="/leads" element={<LeadsPage />} />
               <Route path="/campaigns" element={<CampaignsPage />} />
               <Route path="/deals" element={<DealsPage />} />
               <Route path="/contacts" element={<ContactsPage />} />
               <Route path="/companies" element={<CompaniesPage />} />
               <Route path="/tasks" element={<TasksPage />} />
               <Route path="/communications" element={<CommunicationsPage />} />
               <Route path="/products" element={<ProductsPage />} />
               <Route path="/proposals" element={<ProposalsPage />} />
               <Route path="/proposals/new" element={<ProposalBuilder />} />
               <Route path="/proposals/:id" element={<ProposalDetail />} />
               <Route path="/proposals/:id/edit" element={<ProposalBuilder />} />
               <Route path="/settings" element={<SettingsPage />} />
               <Route path="/reports" element={<ReportsPage />} />
               <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>
          </Route>
          <Route path="/p/:publicToken" element={<PublicProposalView />} />
        </Routes>
      </ErrorBoundary>
    </Suspense>
  );
};

import React, { useEffect, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { ToastProvider } from './lib/toast';
import { usePWAUpdate } from './lib/pwaUpdate';
import PWAUpdatePrompt from './components/UI/PWAUpdatePrompt';
import ManagerLayout from './components/Layout/ManagerLayout';

// Lazy-loaded route components for optimal initial bundle & fast navigation
const LoginPage = React.lazy(() => import('./pages/manager/LoginPage'));
const DashboardPage = React.lazy(() => import('./pages/manager/DashboardPage'));
const OrdersPage = React.lazy(() => import('./pages/manager/OrdersPage'));
const MenuPage = React.lazy(() => import('./pages/manager/MenuPage'));
const TablesPage = React.lazy(() => import('./pages/manager/TablesPage'));
const StaffPage = React.lazy(() => import('./pages/manager/StaffPage'));
const ReportsPage = React.lazy(() => import('./pages/manager/ReportsPage'));
const SettingsPage = React.lazy(() => import('./pages/manager/SettingsPage'));

// Sleek fallback loading component
const PageFallback: React.FC = () => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 animate-fade-in">
    <div className="relative">
      <div className="w-12 h-12 rounded-2xl bg-[#F59E0B]/10 border border-[#F59E0B]/30 flex items-center justify-center text-[#F59E0B] text-xl font-bold animate-pulse">
        🍽️
      </div>
      <div className="absolute inset-0 rounded-2xl border-2 border-[#F59E0B] border-t-transparent animate-spin" />
    </div>
    <p className="text-xs text-[#A1A1AA] font-medium tracking-wide">Sahifa yuklanmoqda...</p>
  </div>
);

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#F59E0B] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return user ? <>{children}</> : <Navigate to="/login" replace />;
};

const App: React.FC = () => {
  const { user, loadProfile } = useAuthStore();
  const { needRefresh, updateApp, closePrompt } = usePWAUpdate();

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  return (
    <ToastProvider>
      <BrowserRouter>
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path="/login" element={user ? <Navigate to="/manager" replace /> : <LoginPage />} />
            
            <Route path="/manager" element={<ProtectedRoute><ManagerLayout /></ProtectedRoute>}>
              <Route index element={<DashboardPage />} />
              <Route path="orders" element={<OrdersPage />} />
              <Route path="menu" element={<MenuPage />} />
              <Route path="tables" element={<TablesPage />} />
              <Route path="staff" element={<StaffPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/manager" replace />} />
          </Routes>
        </Suspense>
        
        {/* PWA Update Prompt */}
        <PWAUpdatePrompt
          show={needRefresh}
          onUpdate={updateApp}
          onClose={closePrompt}
        />
      </BrowserRouter>
    </ToastProvider>
  );
};

export default App;

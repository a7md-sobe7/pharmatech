import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { NotificationProvider } from './context/NotificationContext';
import { Navbar } from './components/layout/Navbar';
import { NotificationPermissionBanner } from './components/notifications/NotificationPermissionBanner';
import { NotificationSettingsModal } from './components/notifications/NotificationSettingsModal';
import { DashboardPage } from './pages/DashboardPage';
import { SearchPage } from './pages/SearchPage';
import { CatalogPage } from './pages/CatalogPage';
import { InventoryPage } from './pages/InventoryPage';
import { AdminPage } from './pages/AdminPage';
import { ShortagesPage } from './pages/ShortagesPage';
import { useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { LoginPage } from './pages/LoginPage';
import { useAuth } from './context/AuthContext';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});


const ProtectedRoute = ({ children, allowedRole }: { children: React.ReactNode, allowedRole?: string }) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRole && user.role !== allowedRole) {
    return <Navigate to={user.role === 'ADMIN' ? '/admin' : '/dashboard'} replace />;
  }

  return <>{children}</>;
};

const PageWrapper = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  // Don't animate login page
  if (location.pathname === '/login') return <>{children}</>;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="h-full w-full"
    >
      {children}
    </motion.div>
  );
};

const AnimatedRoutes = () => {
  const location = useLocation();
  const hideNavbar = location.pathname === '/login';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {!hideNavbar && <NotificationPermissionBanner />}
      {!hideNavbar && <Navbar />}
      
      <main className={`flex-1 w-full max-w-7xl mx-auto ${hideNavbar ? 'p-0' : 'px-4 sm:px-6 lg:px-8 py-6'} overflow-y-auto overflow-x-hidden relative`}>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/dashboard" element={<ProtectedRoute allowedRole="PHARMACIST"><PageWrapper><DashboardPage /></PageWrapper></ProtectedRoute>} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/search" element={<ProtectedRoute><PageWrapper><SearchPage /></PageWrapper></ProtectedRoute>} />
            <Route path="/catalog" element={<ProtectedRoute><PageWrapper><CatalogPage /></PageWrapper></ProtectedRoute>} />
            <Route path="/inventory" element={<ProtectedRoute><PageWrapper><InventoryPage /></PageWrapper></ProtectedRoute>} />
            <Route path="/shortages" element={<ProtectedRoute><PageWrapper><ShortagesPage /></PageWrapper></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute allowedRole="ADMIN"><PageWrapper><AdminPage /></PageWrapper></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AnimatePresence>
      </main>
      
      {!hideNavbar && <NotificationSettingsModal />}
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <LanguageProvider>
          <NotificationProvider>
            <BrowserRouter>
              <AnimatedRoutes />
            </BrowserRouter>
          </NotificationProvider>
        </LanguageProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

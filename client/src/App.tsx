import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const PageWrapper = ({ children }: { children: React.ReactNode }) => {
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

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <NotificationPermissionBanner />
      <Navbar />
      
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 overflow-y-auto overflow-x-hidden relative">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<PageWrapper><DashboardPage /></PageWrapper>} />
            <Route path="/search" element={<PageWrapper><SearchPage /></PageWrapper>} />
            <Route path="/catalog" element={<PageWrapper><CatalogPage /></PageWrapper>} />
            <Route path="/inventory" element={<PageWrapper><InventoryPage /></PageWrapper>} />
            <Route path="/shortages" element={<PageWrapper><ShortagesPage /></PageWrapper>} />
            <Route path="/admin" element={<PageWrapper><AdminPage /></PageWrapper>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AnimatePresence>
      </main>
      
      <NotificationSettingsModal />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <NotificationProvider>
          <BrowserRouter>
            <AnimatedRoutes />
          </BrowserRouter>
        </NotificationProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
};

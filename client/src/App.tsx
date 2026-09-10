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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <LanguageProvider>
          <NotificationProvider>
            <BrowserRouter>
              <div className="min-h-screen flex flex-col bg-slate-50">
                <NotificationPermissionBanner />
                <Navbar />
                <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 overflow-y-auto">
                  <Routes>
                    <Route path="/" element={<DashboardPage />} />
                    <Route path="/search" element={<SearchPage />} />
                    <Route path="/catalog" element={<CatalogPage />} />
                    <Route path="/inventory" element={<InventoryPage />} />
                    <Route path="/shortages" element={<ShortagesPage />} />
                    <Route path="/admin" element={<AdminPage />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </main>
                <NotificationSettingsModal />
              </div>
            </BrowserRouter>
          </NotificationProvider>
        </LanguageProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

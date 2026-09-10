import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
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
          <BrowserRouter>
            <div className="min-h-screen flex flex-col bg-[#F7F9FC]">
              <Navbar />
              <div className="flex-1 flex max-w-7xl w-full mx-auto">
                <Sidebar />
                <main className="flex-1 p-6 overflow-y-auto max-h-[calc(100vh-4rem)]">
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
              </div>
            </div>
          </BrowserRouter>
        </LanguageProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

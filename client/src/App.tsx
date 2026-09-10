import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { Navbar } from './components/layout/Navbar';
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
            <div className="min-h-screen flex flex-col bg-slate-50">
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
            </div>
          </BrowserRouter>
        </LanguageProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

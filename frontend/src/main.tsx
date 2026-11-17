import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './auth';
import { AuthPage } from './pages/AuthPage';
import { Layout } from './components/Layout';
import { CategoriesPage } from './pages/CategoriesPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { DashboardPage } from './pages/DashboardPage';
import './styles.css';
import './workspace.css';

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 30000 } } });

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><QueryClientProvider client={queryClient}><BrowserRouter><AuthProvider><Routes>
    <Route path="/login" element={<AuthPage />} /><Route path="/register" element={<AuthPage register />} />
    <Route element={<Layout />}><Route path="/" element={<DashboardPage />} /><Route path="/categories" element={<CategoriesPage />} /><Route path="/transactions" element={<TransactionsPage />} /><Route path="*" element={<Navigate to="/" replace />} /></Route>
  </Routes></AuthProvider></BrowserRouter></QueryClientProvider></React.StrictMode>,
);

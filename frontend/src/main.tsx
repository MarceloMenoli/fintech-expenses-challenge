import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './auth';
import { AuthPage } from './pages/AuthPage';
import { Layout } from './components/Layout';
import './styles.css';

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 30000 } } });

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><QueryClientProvider client={queryClient}><BrowserRouter><AuthProvider><Routes>
    <Route path="/login" element={<AuthPage />} /><Route path="/register" element={<AuthPage register />} />
    <Route element={<Layout />}><Route path="*" element={<p>Seu espaço financeiro está sendo preparado.</p>} /></Route>
  </Routes></AuthProvider></BrowserRouter></QueryClientProvider></React.StrictMode>,
);

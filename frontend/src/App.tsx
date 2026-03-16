import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { EntregasPage } from './pages/EntregasPage';
import { NovaEntregaPage } from './pages/NovaEntregaPage';
import { DetalheEntregaPage } from './pages/DetalheEntregaPage';
import { MotoboysPage } from './pages/MotoboysPage';
import { GestoresPage } from './pages/GestoresPage';
import { FiliaisPage } from './pages/FiliaisPage';
import { useDetectorVersao } from './hooks/useDetectorVersao';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30000 } },
});

function AppRoutes() {
  useDetectorVersao();
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <Layout>
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/entregas" element={<EntregasPage />} />
                <Route path="/entregas/nova" element={<NovaEntregaPage />} />
                <Route path="/entregas/:id" element={<DetalheEntregaPage />} />
                <Route path="/motoboys" element={<MotoboysPage />} />
                <Route path="/gestores" element={<GestoresPage />} />
                <Route path="/filiais" element={<FiliaisPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

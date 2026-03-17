import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { usuario, carregando, carregarSessao } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => { carregarSessao(); }, [carregarSessao]);

  useEffect(() => {
    if (!carregando && !usuario) navigate('/login');
    if (!carregando && usuario && !['admin', 'gestor'].includes(usuario.perfil)) navigate('/login');
  }, [carregando, usuario, navigate]);

  if (carregando) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return usuario ? <>{children}</> : null;
}

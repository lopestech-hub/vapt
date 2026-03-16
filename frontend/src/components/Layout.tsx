import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Truck, Users, LogOut, Menu, Building2, UserCog } from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '../store/authStore';

export function Layout({ children }: { children: React.ReactNode }) {
  const [aberto, setAberto] = useState(false);
  const logout = useAuthStore((s) => s.logout);
  const usuario = useAuthStore((s) => s.usuario);
  const navigate = useNavigate();
  const isAdmin = usuario?.perfil === 'admin';

  const navBase = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/entregas', icon: Truck, label: 'Entregas' },
    { to: '/motoboys', icon: Users, label: 'Motoboys' },
  ];

  const navAdmin = [
    { to: '/gestores', icon: UserCog, label: 'Gestores' },
    { to: '/filiais', icon: Building2, label: 'Filiais' },
  ];

  const nav = isAdmin ? [...navBase, ...navAdmin] : navBase;

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="min-h-screen bg-slate-900 flex">
      {aberto && (
        <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={() => setAberto(false)} />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-30 w-60 bg-slate-800 border-r border-slate-700 flex flex-col transition-transform duration-200 ${
          aberto ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center gap-3 px-5 border-b border-slate-700">
          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
            <Truck size={16} className="text-white" />
          </div>
          <span className="text-white font-bold text-lg">VAPT</span>
        </div>

        {/* Links */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
          {nav.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={() => setAberto(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-orange-500/15 text-orange-400'
                    : 'text-slate-400 hover:bg-slate-700 hover:text-slate-100'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Info usuário + Sair */}
        <div className="px-3 pb-4 flex flex-col gap-1">
          {isAdmin && (
            <div className="px-3 py-2 mb-1 rounded-lg bg-orange-500/10 border border-orange-500/20">
              <p className="text-xs font-semibold text-orange-400 uppercase tracking-wide">Admin</p>
              <p className="text-xs text-slate-400 truncate">{usuario?.nome}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-700 hover:text-slate-100 transition-colors cursor-pointer"
          >
            <LogOut size={18} />
            Sair
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-slate-800 border-b border-slate-700 flex items-center px-4 lg:hidden">
          <button
            onClick={() => setAberto(true)}
            className="text-slate-400 hover:text-white cursor-pointer"
          >
            <Menu size={22} />
          </button>
          <span className="ml-3 text-white font-semibold">VAPT</span>
        </header>

        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}

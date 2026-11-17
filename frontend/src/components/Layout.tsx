import {
  ArrowLeftRight,
  ArrowUpRight,
  FolderOpen,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import { NavLink, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../auth';

export function Logo() {
  return (
    <span className="logo">
      <span className="logo-symbol">
        <ArrowUpRight size={26} strokeWidth={2.5} />
      </span>
      fluxo<span className="logo-dot">.</span>
    </span>
  );
}
export function Layout() {
  const { user, logout } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Logo />
        <button className="icon-button mobile-logout" onClick={logout} aria-label="Sair da conta">
          <LogOut size={18} />
        </button>
        <div className="workspace-label">ESPAÇO DE TRABALHO</div>
        <div className="workspace">
          <div className="workspace-avatar">{user.name.charAt(0).toUpperCase()}</div>
          <div>
            <strong>Minhas finanças</strong>
            <small>Conta pessoal</small>
          </div>
          <span className="live-dot" />
        </div>
        <div className="nav-label">PRINCIPAL</div>
        <nav aria-label="Navegação principal">
          <NavLink to="/" end>
            <LayoutDashboard size={19} />
            Visão geral
          </NavLink>
          <NavLink to="/transactions">
            <ArrowLeftRight size={19} />
            Transações
          </NavLink>
          <NavLink to="/categories">
            <FolderOpen size={19} />
            Categorias
          </NavLink>
        </nav>
        <div className="sidebar-bottom">
          <div className="security-note">
            <ShieldCheck size={20} />
            <div>
              <strong>Seu dinheiro, com clareza.</strong>
              <p>Organize hoje. Planeje o amanhã.</p>
            </div>
          </div>
          <div className="profile">
            <div className="profile-avatar">{user.name.charAt(0).toUpperCase()}</div>
            <div className="profile-text">
              <strong>{user.name}</strong>
              <small>{user.email}</small>
            </div>
            <button
              onClick={logout}
              className="icon-button"
              title="Sair"
              aria-label="Sair da conta"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>
      <main className="main">
        <header className="topbar">
          <span>
            Gestão financeira <span className="topbar-slash">/</span> <strong>Meu espaço</strong>
          </span>
          <span className="private-tag">
            <ShieldCheck size={14} /> Ambiente privado
          </span>
        </header>
        <div className="page-content">
          <Outlet />
        </div>
        <footer>
          Fluxo · Mais clareza para suas finanças.<span>Valores em BRL</span>
        </footer>
      </main>
    </div>
  );
}

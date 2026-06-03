import { Link, useLocation, useNavigate } from 'react-router-dom';
import Logo from './Logo.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useBusiness } from '../../context/BusinessContext.jsx';

const nav = [
  { to: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { to: '/inventory', label: 'Inventory', icon: 'inventory_2' },
  { to: '/pos', label: 'POS', icon: 'point_of_sale' },
  { to: '/reports', label: 'Reports', icon: 'analytics' },
  { to: '/bulk-upload', label: 'Bulk Upload', icon: 'upload_file' },
  { to: '/settings', label: 'Settings', icon: 'settings', adminOnly: true },
];

export default function AppShell({ children }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { business, clearBusiness } = useBusiness();

  const switchBusiness = () => {
    clearBusiness();
    navigate('/select-business');
  };

  return (
    <div className="min-h-screen flex bg-surface">
      <aside className="hidden lg:flex w-60 flex-col border-r border-outline-variant bg-surface-container-lowest p-4">
        <div className="flex items-center gap-2 mb-8">
          <Logo />
          <span className="font-headline font-semibold text-sm leading-tight">BizSphere</span>
        </div>
        <nav className="flex flex-col gap-1">
          {nav.filter((item) => !item.adminOnly || user?.role === 'ADMIN').map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname === item.to
                  ? 'bg-primary-container text-on-primary-container'
                  : 'text-on-surface-variant hover:bg-surface-container'
              }`}
            >
              <span className="material-symbols-outlined text-xl">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-outline-variant flex items-center justify-between px-4 bg-surface-container-lowest">
          <div className="flex items-center gap-2 lg:hidden">
            <Logo className="w-8 h-8" />
          </div>
          <h1 className="font-headline text-sm font-semibold text-primary truncate">
            {business?.name}
          </h1>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={switchBusiness}
              className="text-xs px-3 py-1.5 rounded-lg border border-outline-variant hover:border-primary hover:text-primary"
            >
              Switch business
            </button>
            <span className="text-xs text-on-surface-variant hidden sm:inline">{user?.name}</span>
            <button
              type="button"
              onClick={() => { logout(); navigate('/login'); }}
              className="text-xs text-on-surface-variant hover:text-error"
            >
              Logout
            </button>
          </div>
        </header>
        <main className="flex-1 p-4 overflow-auto">{children}</main>
        <nav className="lg:hidden flex border-t border-outline-variant bg-surface-container-lowest">
          {nav.filter((item) => !item.adminOnly || user?.role === 'ADMIN').slice(0, 4).map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`flex-1 flex flex-col items-center py-2 text-xs ${
                pathname === item.to ? 'text-primary' : 'text-on-surface-variant'
              }`}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}

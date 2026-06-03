import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Logo from './Logo.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useBusiness } from '../../context/BusinessContext.jsx';

const nav = [
  { to: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { to: '/inventory', label: 'Inventory', icon: 'inventory_2' },
  { to: '/pos', label: 'POS', icon: 'point_of_sale' },
  { to: '/reports', label: 'Reports', icon: 'assessment' },
  { to: '/bulk-upload', label: 'Bulk Upload', icon: 'upload_file' },
  { to: '/settings', label: 'Settings', icon: 'settings', adminOnly: true },
  { to: '/super-admin', label: 'Super Admin', icon: 'admin_panel_settings', superAdminOnly: true },
];

export default function AppShell({ children }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { business, clearBusiness } = useBusiness();
  const [showMobileMore, setShowMobileMore] = useState(false);

  const switchBusiness = () => {
    clearBusiness();
    navigate('/select-business');
  };

  return (
    <div className="h-screen w-screen flex bg-surface text-on-surface font-body antialiased overflow-hidden">
      {/* Sidebar for large screens */}
      <aside className="hidden lg:flex w-60 flex-col border-r border-outline-variant bg-surface-container-lowest p-4 shrink-0">
        <div 
          onClick={() => navigate('/select-business')} 
          className="mb-8 px-2 flex items-center gap-3 cursor-pointer group"
        >
          <Logo variant="login" className="object-contain shrink-0 h-10 w-10 group-hover:scale-105 transition-transform" />
          <div className="flex flex-col text-left">
            <span className="text-sm font-bold text-on-surface font-headline leading-tight">Gohite Management</span>
            <span className="text-xs text-on-surface-variant font-label">Enterprise Suite</span>
          </div>
        </div>

        <nav className="flex flex-col gap-1 text-left">
          {nav.filter((item) => {
            if (item.superAdminOnly) return user?.role === 'SUPER_ADMIN';
            if (item.adminOnly) return user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
            return true;
          }).map((item) => {
            const isActive = pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary-container text-on-primary-container'
                    : 'text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                <span 
                  className="material-symbols-outlined text-xl"
                  style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
                >
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <header className="h-16 border-b border-outline-variant flex items-center justify-between px-6 bg-surface-container-lowest sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <div className="lg:hidden shrink-0">
              <Logo className="w-8 h-8" />
            </div>
            <h1 className="font-headline text-lg font-semibold text-primary flex items-center gap-2 truncate">
              <span className="material-symbols-outlined text-primary">storefront</span>
              {business?.name}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={switchBusiness}
              className="flex items-center gap-2 px-3 py-1.5 border border-outline-variant rounded-full text-xs font-medium hover:bg-surface-container-low transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">storefront</span>
              <span className="hidden sm:inline">Business Switcher</span>
              <span className="material-symbols-outlined text-[14px]">expand_more</span>
            </button>

            <div className="hidden md:flex items-center gap-1">
              <button className="hover:bg-surface-container-low rounded-full p-1.5 text-on-surface-variant transition-colors cursor-pointer">
                <span className="material-symbols-outlined text-[20px]">notifications</span>
              </button>
              <button className="hover:bg-surface-container-low rounded-full p-1.5 text-on-surface-variant transition-colors cursor-pointer">
                <span className="material-symbols-outlined text-[20px]">apps</span>
              </button>
            </div>

            <div className="hidden md:block h-8 w-px bg-outline-variant mx-1"></div>

            <span className="text-xs text-on-surface-variant font-medium hidden sm:inline">{user?.name}</span>

            <button
              type="button"
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="text-xs text-on-surface-variant hover:text-error transition-colors hidden sm:inline-block"
            >
              Logout
            </button>

            <div className="w-8 h-8 rounded-full bg-surface-container-high border border-outline-variant flex items-center justify-center overflow-hidden shrink-0">
              <span className="material-symbols-outlined text-on-surface-variant text-[20px]">person</span>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-auto bg-surface bg-opacity-30">
          {children}
        </main>

        {/* Mobile Navigation */}
        {(() => {
          const allowedNav = nav.filter((item) => {
            if (item.superAdminOnly) return user?.role === 'SUPER_ADMIN';
            if (item.adminOnly) return user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
            return true;
          });

          const showMoreButton = allowedNav.length > 4;
          const visibleNav = showMoreButton ? allowedNav.slice(0, 3) : allowedNav;
          const hiddenNav = showMoreButton ? allowedNav.slice(3) : [];

          return (
            <>
              <nav className="lg:hidden flex border-t border-outline-variant bg-surface-container-lowest sticky bottom-0 z-40">
                {visibleNav.map((item) => {
                  const isActive = pathname === item.to;
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={`flex-1 flex flex-col items-center py-2.5 text-xs transition-colors ${
                        isActive ? 'text-primary font-semibold' : 'text-on-surface-variant'
                      }`}
                    >
                      <span 
                        className="material-symbols-outlined"
                        style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
                      >
                        {item.icon}
                      </span>
                      {item.label}
                    </Link>
                  );
                })}

                {showMoreButton && (
                  <button
                    onClick={() => setShowMobileMore(true)}
                    className="flex-1 flex flex-col items-center py-2.5 text-xs transition-colors text-on-surface-variant"
                  >
                    <span className="material-symbols-outlined">more_horiz</span>
                    More
                  </button>
                )}
              </nav>

              {/* Mobile More Sheet */}
              {showMobileMore && (
                <div className="fixed inset-0 z-50 flex items-end justify-center lg:hidden">
                  {/* Backdrop */}
                  <div 
                    className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity animate-fade-in"
                    onClick={() => setShowMobileMore(false)}
                  />
                  {/* Drawer */}
                  <div className="relative w-full bg-surface-container-lowest border-t border-outline-variant rounded-t-2xl p-6 z-10 animate-slide-up shadow-lg">
                    {/* Drag indicator line */}
                    <div className="mx-auto w-12 h-1.5 bg-outline-variant/60 rounded-full mb-6" />
                    
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-base font-bold font-headline">More Options</h3>
                      <button 
                        onClick={() => setShowMobileMore(false)}
                        className="p-1 rounded-full hover:bg-surface-container-low"
                      >
                        <span className="material-symbols-outlined text-[20px]">close</span>
                      </button>
                    </div>

                    <div className="flex flex-col gap-2">
                      {hiddenNav.map((item) => {
                        const isActive = pathname === item.to;
                        return (
                          <Link
                            key={item.to}
                            to={item.to}
                            onClick={() => setShowMobileMore(false)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                              isActive
                                ? 'bg-primary-container text-on-primary-container font-semibold'
                                : 'text-on-surface-variant hover:bg-surface-container-high'
                            }`}
                          >
                            <span 
                              className="material-symbols-outlined text-xl"
                              style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
                            >
                              {item.icon}
                            </span>
                            {item.label}
                          </Link>
                        );
                      })}

                      <div className="h-px bg-outline-variant/30 my-2" />

                      <button
                        onClick={() => {
                          setShowMobileMore(false);
                          logout();
                          navigate('/login');
                        }}
                        className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold text-error hover:bg-error-container/20 transition-colors w-full text-left"
                      >
                        <span className="material-symbols-outlined text-xl text-error">logout</span>
                        Logout
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          );
        })()}
      </div>
    </div>
  );
}

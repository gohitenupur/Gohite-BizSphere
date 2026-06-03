import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/common/Logo.jsx';
import { useBusiness } from '../context/BusinessContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useApi } from '../hooks/useApi.js';
import { applyTheme } from '../theme/tokens.js';

const businessDetails = {
  KRISHI: {
    accentColor: '#5a9c24',
    watermarkIcon: 'eco',
    icon: 'energy_savings_leaf',
    description: 'Manage agricultural inputs, track seed inventory, and monitor fertilizer distribution. Tailored for agribusiness operations.',
    features: [
      'Seed & Crop Protection Inventory',
      'Seasonal Demand Forecasting',
      'Farmer Ledger & POS'
    ],
    buttonClass: 'bg-[#5a9c24] text-white hover:bg-[#5a9c24]/90 hover:shadow-md'
  },
  HARDWARE: {
    accentColor: '#29659a',
    watermarkIcon: 'construction',
    icon: 'home_repair_service',
    description: 'Control industrial tools, plumbing supplies, and electrical inventory. Optimized for high-volume hardware retail.',
    features: [
      'Bulk Fastener & Tool Tracking',
      'Supplier Reorder Thresholds',
      'Contractor Invoicing'
    ],
    buttonClass: 'bg-surface-variant text-on-surface hover:bg-surface-container-highest border border-outline-variant group-hover:border-[#29659a] group-hover:text-[#29659a]'
  }
};

export default function BusinessSelect() {
  const { get } = useApi();
  const { setBusiness } = useBusiness();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [businesses, setBusinesses] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    applyTheme('neutral');
  }, []);

  useEffect(() => {
    get('/api/auth/businesses')
      .then((r) => setBusinesses(r.data))
      .catch((e) => setError(e.message));
  }, [get]);

  const select = (b) => {
    logout();
    setBusiness(b);
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-surface text-on-surface font-body flex flex-col antialiased selection:bg-primary-container selection:text-on-primary-container relative">
      {/* Top Navigation */}
      <header className="bg-surface border-b border-outline-variant flex justify-between items-center w-full px-6 h-16 sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <Logo />
          <span className="text-lg font-bold text-on-surface font-headline tracking-tight hidden sm:inline">Gohite Enterprise</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-on-surface-variant font-medium mr-2 hidden sm:inline">
            {user?.name || 'Admin User'}
          </span>
          <div className="h-8 w-8 rounded-full bg-surface-variant flex items-center justify-center border border-outline-variant">
            <span className="material-symbols-outlined text-sm text-on-surface-variant">person</span>
          </div>
        </div>
      </header>

      {/* Main Content Canvas */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 relative overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 flex items-center justify-center">
          <div className="absolute top-[10%] left-[10%] w-[40vw] h-[40vw] bg-primary-container/20 rounded-full blur-3xl opacity-50 mix-blend-multiply"></div>
          <div className="absolute bottom-[10%] right-[10%] w-[35vw] h-[35vw] bg-tertiary-container/20 rounded-full blur-3xl opacity-50 mix-blend-multiply"></div>
        </div>

        <div className="z-10 w-full max-w-5xl mx-auto flex flex-col items-center">
          <div className="text-center mb-12 max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-headline font-bold text-on-surface mb-4 tracking-tight">
              Select Business Unit
            </h1>
            <p className="text-lg text-on-surface-variant leading-relaxed">
              Choose an operating entity to access its dedicated management dashboard and inventory controls.
            </p>
            {user?.role === 'SUPER_ADMIN' && (
              <button
                onClick={() => navigate('/super-admin')}
                className="mt-6 flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary text-sm font-semibold rounded-lg shadow-sm hover:opacity-90 active:scale-[0.98] transition-all"
              >
                <span className="material-symbols-outlined text-[20px]">admin_panel_settings</span>
                Go to Super Admin Panel
              </button>
            )}
          </div>

          {error && <p className="text-error mb-4 text-center">{error}</p>}

          {/* Bento Grid / Dual Card Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
            {businesses.map((b) => {
              const isKrishi = b.type === 'KRISHI';
              const details = isKrishi ? businessDetails.KRISHI : businessDetails.HARDWARE;
              return (
                <div
                  key={b.id}
                  onClick={() => select(b)}
                  className="group relative bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col h-full cursor-pointer"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = details.accentColor;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '';
                  }}
                >
                  {/* Watermark Background Icon */}
                  <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
                    <span
                      className="material-symbols-outlined text-9xl"
                      style={{
                        color: details.accentColor,
                        fontVariationSettings: "'FILL' 1",
                      }}
                    >
                      {details.watermarkIcon}
                    </span>
                  </div>

                  <div className="p-8 flex-1 flex flex-col relative z-10">
                    {/* Brand Icon */}
                    <div
                      className="h-16 w-16 rounded-lg flex items-center justify-center mb-6 shadow-sm border group-hover:scale-105 transition-transform"
                      style={{
                        backgroundColor: `${details.accentColor}15`,
                        borderColor: `${details.accentColor}20`,
                      }}
                    >
                      <span
                        className="material-symbols-outlined text-3xl"
                        style={{
                          color: details.accentColor,
                          fontVariationSettings: "'FILL' 1",
                        }}
                      >
                        {details.icon}
                      </span>
                    </div>

                    <h2 className="text-2xl font-headline font-bold text-on-surface mb-3">
                      {b.name}
                    </h2>

                    <p className="text-on-surface-variant text-base mb-8 flex-1 leading-relaxed">
                      {details.description}
                    </p>

                    {/* Features Checklist */}
                    <div className="space-y-3 mb-8 text-sm text-on-surface-variant">
                      {details.features.map((feat, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span
                            className="material-symbols-outlined text-[20px]"
                            style={{ color: details.accentColor }}
                          >
                            check_circle
                          </span>
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>

                    {/* Action Button */}
                    <button
                      type="button"
                      className={`w-full font-label font-medium text-sm px-6 py-3 rounded-lg transition-all flex items-center justify-center gap-2 group-hover:translate-y-[-2px] ${details.buttonClass}`}
                    >
                      Select Business Unit
                      <span className="material-symbols-outlined text-sm transition-transform group-hover:translate-x-1">
                        arrow_forward
                      </span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-12 text-center flex flex-col gap-2 items-center">
            <a
              className="text-sm text-primary font-medium hover:underline flex items-center gap-1 justify-center"
              href="#"
              onClick={(e) => e.preventDefault()}
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Register New Business Unit
            </a>
            <button
              onClick={() => navigate('/super-admin/login')}
              className="text-xs text-on-surface-variant/70 hover:text-primary font-semibold flex items-center gap-1 justify-center transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">admin_panel_settings</span>
              Super Admin Console
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}


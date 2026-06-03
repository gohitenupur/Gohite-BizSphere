import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/common/Logo.jsx';
import { useBusiness } from '../context/BusinessContext.jsx';
import { useApi } from '../hooks/useApi.js';
import { applyTheme } from '../theme/tokens.js';

export default function BusinessSelect() {
  const { get } = useApi();
  const { setBusiness } = useBusiness();
  const navigate = useNavigate();
  const [businesses, setBusinesses] = useState([]);
  const [error, setError] = useState('');

  applyTheme('neutral');

  useEffect(() => {
    get('/api/auth/businesses')
      .then((r) => setBusinesses(r.data))
      .catch((e) => setError(e.message));
  }, [get]);

  const select = (b) => {
    setBusiness(b);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-surface p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Logo />
          <h1 className="font-headline text-2xl font-semibold">Select Business Unit</h1>
        </div>
        {error && <p className="text-error mb-4">{error}</p>}
        <div className="grid md:grid-cols-2 gap-6">
          {businesses.map((b) => {
            const isKrishi = b.type === 'KRISHI';
            const accent = isKrishi ? '#5a9c24' : '#29659a';
            return (
              <button
                key={b.id}
                type="button"
                onClick={() => select(b)}
                className="text-left bg-surface-container-lowest rounded-xl border border-outline-variant p-6 hover:shadow-md transition-all"
                style={{ borderColor: undefined }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = accent; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = ''; }}
              >
                <div
                  className="w-14 h-14 rounded-lg flex items-center justify-center mb-4"
                  style={{ backgroundColor: `${accent}20`, color: accent }}
                >
                  <span className="material-symbols-outlined text-3xl">
                    {isKrishi ? 'energy_savings_leaf' : 'home_repair_service'}
                  </span>
                </div>
                <h2 className="font-headline font-semibold text-lg">{b.name}</h2>
                <p className="text-sm text-on-surface-variant mt-1">{b.type}</p>
                <span
                  className="inline-block mt-4 text-sm font-medium px-4 py-2 rounded-lg text-white"
                  style={{ backgroundColor: isKrishi ? accent : undefined }}
                >
                  {isKrishi ? 'Enter Krishi' : 'Enter Hardware'}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

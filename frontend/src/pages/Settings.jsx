import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import AppShell from '../components/common/AppShell.jsx';
import Toast from '../components/common/Toast.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useApi } from '../hooks/useApi.js';
import { useConfig } from '../context/ConfigContext.jsx';

export default function Settings() {
  const { user } = useAuth();
  const { get, put } = useApi();
  const { reload } = useConfig();
  const [definitions, setDefinitions] = useState([]);
  const [form, setForm] = useState({});
  const [toast, setToast] = useState('');
  const [loading, setLoading] = useState(true);

  if (user?.role !== 'ADMIN') {
    return <Navigate to="/dashboard" replace />;
  }

  useEffect(() => {
    get('/api/config/definitions')
      .then((res) => {
        setDefinitions(res.data || []);
        const initial = {};
        res.data.forEach((d) => {
          const v = res.effective?.[d.key];
          initial[d.key] =
            d.type === 'json' ? JSON.stringify(v, null, 2) : String(v ?? d.default ?? '');
        });
        setForm(initial);
      })
      .catch((e) => setToast(e.message))
      .finally(() => setLoading(false));
  }, [get]);

  const handleSave = async (key) => {
    try {
      let value = form[key];
      const def = definitions.find((d) => d.key === key);
      if (def?.type === 'json') {
        JSON.parse(value);
      }
      await put('/api/config', { key, value });
      await reload();
      setToast(`Saved ${def?.label || key} successfully`);
    } catch (e) {
      setToast(e.message);
    }
  };

  const handleSaveAll = async () => {
    try {
      const settings = definitions.map((d) => ({ key: d.key, value: form[d.key] }));
      await put('/api/config/bulk', { settings });
      await reload();
      setToast('All settings saved successfully');
    } catch (e) {
      setToast(e.message);
    }
  };

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-[50vh]">
          <p className="text-sm text-on-surface-variant animate-pulse">Loading system settings...</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <Toast
        message={toast}
        type={toast.includes('successfully') ? 'success' : 'error'}
        onClose={() => setToast('')}
      />

      <div className="max-w-4xl mx-auto space-y-6 text-left">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-on-background font-headline tracking-tight">System Configuration</h1>
            <p className="text-xs text-on-surface-variant mt-1">
              Configure parameters, pagination limits, tax rules, and POS operations.
            </p>
          </div>
          <button
            type="button"
            onClick={handleSaveAll}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary text-xs font-semibold rounded-lg hover:opacity-95 transition-opacity cursor-pointer shadow-sm"
          >
            <span className="material-symbols-outlined text-[16px]">save_all</span>
            Save All Settings
          </button>
        </div>

        {/* Configurations List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {definitions.map((d) => {
            const isGlobal = d.scope === 'global';
            return (
              <div
                key={d.key}
                className="p-5 border border-outline-variant/70 rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-xs font-bold text-on-surface leading-normal">{d.label}</span>
                    <span
                      className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                        isGlobal ? 'bg-primary-container/20 text-primary' : 'bg-tertiary-container/30 text-on-tertiary-container'
                      }`}
                    >
                      {isGlobal ? 'Global' : 'Local Override'}
                    </span>
                  </div>
                  <p className="text-[11px] text-on-surface-variant leading-relaxed">{d.description}</p>
                  <span className="inline-block text-[10px] text-on-surface-variant/70 font-mono bg-surface px-1.5 py-0.5 rounded border border-outline-variant/10">
                    {d.key}
                  </span>

                  <div className="pt-2">
                    {d.type === 'boolean' ? (
                      <select
                        value={form[d.key]}
                        onChange={(e) => setForm({ ...form, [d.key]: e.target.value })}
                        className="w-full h-10 px-2 border border-outline-variant rounded-lg bg-surface text-xs focus:ring-2 focus:ring-primary outline-none"
                      >
                        <option value="true">Enabled</option>
                        <option value="false">Disabled</option>
                      </select>
                    ) : d.type === 'json' ? (
                      <textarea
                        value={form[d.key]}
                        onChange={(e) => setForm({ ...form, [d.key]: e.target.value })}
                        rows={3}
                        className="w-full px-3 py-2 border border-outline-variant rounded-lg bg-surface text-xs font-mono focus:ring-2 focus:ring-primary outline-none"
                      />
                    ) : (
                      <input
                        type={d.type === 'number' ? 'number' : 'text'}
                        value={form[d.key]}
                        onChange={(e) => setForm({ ...form, [d.key]: e.target.value })}
                        className="w-full h-10 px-3 border border-outline-variant rounded-lg bg-surface text-xs focus:ring-2 focus:ring-primary outline-none"
                      />
                    )}
                  </div>
                </div>

                <div className="flex justify-end pt-4 mt-3 border-t border-outline-variant/20">
                  <button
                    type="button"
                    onClick={() => handleSave(d.key)}
                    className="flex items-center gap-1 text-xs text-primary font-bold hover:underline cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">save</span>
                    Save setting
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}

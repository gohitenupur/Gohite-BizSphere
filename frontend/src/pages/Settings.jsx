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
        setDefinitions(res.data);
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
      setToast(`Saved ${def?.label || key}`);
    } catch (e) {
      setToast(e.message);
    }
  };

  const handleSaveAll = async () => {
    try {
      const settings = definitions.map((d) => ({ key: d.key, value: form[d.key] }));
      await put('/api/config/bulk', { settings });
      await reload();
      setToast('All settings saved');
    } catch (e) {
      setToast(e.message);
    }
  };

  if (loading) {
    return (
      <AppShell>
        <p className="text-on-surface-variant">Loading settings...</p>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <Toast message={toast} type={toast.includes('Saved') ? 'success' : 'error'} onClose={() => setToast('')} />
      <div className="max-w-2xl">
        <h2 className="font-headline text-xl font-semibold mb-1">System Configuration</h2>
        <p className="text-sm text-on-surface-variant mb-6">
          All business rules are configurable here — no code changes required. Global settings apply to all stores; business-scoped settings override per unit.
        </p>
        <div className="space-y-4">
          {definitions.map((d) => (
            <div key={d.key} className="p-4 border border-outline-variant rounded-xl bg-surface-container-lowest">
              <label className="block font-medium text-sm">{d.label}</label>
              <p className="text-xs text-on-surface-variant mb-2">{d.description}</p>
              <span className="text-xs text-primary font-mono">{d.key}</span>
              {d.type === 'boolean' ? (
                <select
                  value={form[d.key]}
                  onChange={(e) => setForm({ ...form, [d.key]: e.target.value })}
                  className="mt-2 w-full h-9 px-2 border rounded-lg text-sm"
                >
                  <option value="true">Enabled</option>
                  <option value="false">Disabled</option>
                </select>
              ) : d.type === 'json' ? (
                <textarea
                  value={form[d.key]}
                  onChange={(e) => setForm({ ...form, [d.key]: e.target.value })}
                  rows={3}
                  className="mt-2 w-full px-2 py-1 border rounded-lg text-sm font-mono"
                />
              ) : (
                <input
                  type={d.type === 'number' ? 'number' : 'text'}
                  value={form[d.key]}
                  onChange={(e) => setForm({ ...form, [d.key]: e.target.value })}
                  className="mt-2 w-full h-9 px-2 border rounded-lg text-sm"
                />
              )}
              <button
                type="button"
                onClick={() => handleSave(d.key)}
                className="mt-2 text-xs text-primary font-medium hover:underline"
              >
                Save this setting
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={handleSaveAll}
          className="mt-6 h-10 px-6 bg-primary text-on-primary rounded-lg font-medium"
        >
          Save all settings
        </button>
      </div>
    </AppShell>
  );
}

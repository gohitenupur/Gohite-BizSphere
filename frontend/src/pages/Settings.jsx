import { useEffect, useState, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import AppShell from '../components/common/AppShell.jsx';
import Toast from '../components/common/Toast.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useApi } from '../hooks/useApi.js';
import { useConfig } from '../context/ConfigContext.jsx';

export default function Settings() {
  const { user } = useAuth();
  const { get, put, post, del } = useApi();
  const { reload } = useConfig();
  const [definitions, setDefinitions] = useState([]);
  const [form, setForm] = useState({});
  const [toast, setToast] = useState('');
  const [loading, setLoading] = useState(true);

  // Category Management states
  const [categories, setCategories] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');

  const loadCategories = useCallback(async () => {
    try {
      const res = await get('/api/categories');
      setCategories(res.data || []);
    } catch (e) {
      setToast(e.message);
    }
  }, [get]);

  useEffect(() => {
    if (!['ADMIN', 'SUPER_ADMIN'].includes(user?.role)) return;

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

    loadCategories();
  }, [get, loadCategories, user?.role]);

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

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    try {
      await post('/api/categories', { name: newCategoryName });
      setNewCategoryName('');
      loadCategories();
      setToast('Category added successfully');
    } catch (err) {
      setToast(err.message);
    }
  };

  const handleUpdateCategory = async (id) => {
    if (!editingCategoryName.trim()) return;
    try {
      await put(`/api/categories/${id}`, { name: editingCategoryName });
      setEditingCategoryId(null);
      setEditingCategoryName('');
      loadCategories();
      setToast('Category updated successfully');
    } catch (err) {
      setToast(err.message);
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    try {
      await del(`/api/categories/${id}`);
      loadCategories();
      setToast('Category deleted successfully');
    } catch (err) {
      setToast(err.message);
    }
  };

  if (!['ADMIN', 'SUPER_ADMIN'].includes(user?.role)) {
    return <Navigate to="/dashboard" replace />;
  }

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

        {/* Category Management */}
        <div className="p-6 border border-outline-variant/70 rounded-xl bg-surface-container-lowest shadow-sm space-y-6">
          <div>
            <h2 className="text-lg font-bold text-on-background font-headline tracking-tight flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[22px]">category</span>
              Inventory Categories
            </h2>
            <p className="text-xs text-on-surface-variant mt-1">
              Manage product categories used across inventory management and point-of-sale billing.
            </p>
          </div>

          {/* Add Category Form */}
          <form onSubmit={handleAddCategory} className="flex gap-3 max-w-md">
            <input
              type="text"
              placeholder="e.g. Fertilizers"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              className="h-10 flex-1 px-3 border border-outline-variant rounded-lg bg-surface text-xs focus:ring-2 focus:ring-primary outline-none"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-on-primary text-xs font-semibold rounded-lg hover:opacity-95 transition-opacity cursor-pointer shadow-sm flex items-center gap-1 shrink-0"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              Add Category
            </button>
          </form>

          {/* Categories Table */}
          <div className="border border-outline-variant/50 rounded-xl overflow-hidden bg-surface-container-low/30">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-surface-container-low/75 text-on-surface-variant font-bold border-b border-outline-variant/40">
                  <tr>
                    <th className="px-4 py-3">Category Name</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20">
                  {categories.length === 0 ? (
                    <tr>
                      <td colSpan={2} className="px-4 py-6 text-center text-on-surface-variant/70 italic">
                        No categories defined yet. Add one above.
                      </td>
                    </tr>
                  ) : (
                    categories.map((c) => (
                      <tr key={c.id} className="hover:bg-surface-container-low/50 transition-colors">
                        <td className="px-4 py-3">
                          {editingCategoryId === c.id ? (
                            <div className="flex gap-2 max-w-sm">
                              <input
                                type="text"
                                value={editingCategoryName}
                                onChange={(e) => setEditingCategoryName(e.target.value)}
                                className="h-8 flex-1 px-2 border border-outline-variant rounded bg-surface text-xs focus:ring-2 focus:ring-primary outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => handleUpdateCategory(c.id)}
                                className="px-2.5 bg-primary text-on-primary text-[10px] font-bold rounded hover:opacity-90 cursor-pointer"
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingCategoryId(null)}
                                className="px-2.5 border border-outline-variant bg-surface text-on-surface text-[10px] font-bold rounded hover:bg-surface-container transition-colors cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <span className="font-semibold text-on-surface">{c.name}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right space-x-3">
                          {editingCategoryId !== c.id && (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingCategoryId(c.id);
                                  setEditingCategoryName(c.name);
                                }}
                                className="text-primary font-bold hover:underline cursor-pointer"
                              >
                                Rename
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteCategory(c.id)}
                                className="text-error font-bold hover:underline cursor-pointer"
                              >
                                Delete
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

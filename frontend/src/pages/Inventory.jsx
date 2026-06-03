import { useEffect, useState, useCallback } from 'react';
import AppShell from '../components/common/AppShell.jsx';
import StatusBadge from '../components/common/StatusBadge.jsx';
import Toast from '../components/common/Toast.jsx';
import { useBusiness } from '../context/BusinessContext.jsx';
import { useApi } from '../hooks/useApi.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useConfig } from '../context/ConfigContext.jsx';

export default function Inventory() {
  const { business } = useBusiness();
  const { user } = useAuth();
  const { config } = useConfig();
  const units = config?.allowed_units || ['KG', 'Bags', 'Liters', 'Pieces'];
  const { get, post, put, del } = useApi();
  const [products, setProducts] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [categories, setCategories] = useState([]);
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState('');

  const canEdit = ['ADMIN', 'MANAGER'].includes(user?.role);

  const load = useCallback(async () => {
    try {
      const q = new URLSearchParams({ page, pageSize: 25, search });
      const res = await get(`/api/products?${q}`);
      setProducts(res.data);
      setMeta(res.meta);
    } catch (e) {
      setToast(e.message);
    }
  }, [get, page, search]);

  useEffect(() => {
    load();
    get('/api/categories').then((r) => setCategories(r.data));
  }, [load, get]);

  const saveProduct = async (form) => {
    try {
      if (modal?.id) {
        await put(`/api/products/${modal.id}`, form);
      } else {
        await post('/api/products', form);
      }
      setModal(null);
      load();
      setToast('Product saved');
    } catch (e) {
      setToast(e.message);
    }
  };

  const removeProduct = async (id) => {
    if (!confirm('Soft delete this product?')) return;
    try {
      await del(`/api/products/${id}`);
      load();
      setToast('Product removed');
    } catch (e) {
      setToast(e.message);
    }
  };

  const isKrishi = business?.type === 'KRISHI';

  return (
    <AppShell>
      <Toast message={toast} type={toast.includes('saved') || toast.includes('removed') ? 'success' : 'error'} onClose={() => setToast('')} />
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          placeholder="Search name, SKU..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="flex-1 h-10 px-3 rounded-lg border border-outline-variant"
        />
        {canEdit && (
          <button
            type="button"
            onClick={() => setModal({})}
            className="h-10 px-4 bg-primary text-on-primary rounded-lg text-sm font-medium"
          >
            Add Product
          </button>
        )}
      </div>
      <div className="overflow-x-auto rounded-xl border border-outline-variant bg-surface-container-lowest">
        <table className="w-full dense-table text-sm">
          <thead>
            <tr className="border-b border-outline-variant text-left text-xs uppercase text-on-surface-variant">
              <th className="p-2">Name</th>
              <th className="p-2">SKU</th>
              <th className="p-2">Qty</th>
              {isKrishi ? (
                <>
                  <th className="p-2">Batch</th>
                  <th className="p-2">Expiry</th>
                </>
              ) : (
                <>
                  <th className="p-2">Size</th>
                  <th className="p-2">Material</th>
                </>
              )}
              <th className="p-2">Status</th>
              {canEdit && <th className="p-2">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-b border-outline-variant/50 h-8">
                <td className="p-2">{p.name}</td>
                <td className="p-2">{p.sku}</td>
                <td className="p-2">{p.quantity}</td>
                {isKrishi ? (
                  <>
                    <td className="p-2">{p.metadata?.batchNo || '—'}</td>
                    <td className="p-2">{p.metadata?.expiryDate || '—'}</td>
                  </>
                ) : (
                  <>
                    <td className="p-2">{p.metadata?.size || '—'}</td>
                    <td className="p-2">{p.metadata?.material || '—'}</td>
                  </>
                )}
                <td className="p-2">
                  <StatusBadge
                    status={p.quantity <= p.minStock ? 'lowStock' : 'inStock'}
                    label={p.quantity <= p.minStock ? 'Low Stock' : 'In Stock'}
                  />
                </td>
                {canEdit && (
                  <td className="p-2 space-x-2">
                    <button type="button" className="text-primary text-xs" onClick={() => setModal(p)}>Edit</button>
                    <button type="button" className="text-error text-xs" onClick={() => removeProduct(p.id)}>Delete</button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex justify-between mt-4 text-sm">
        <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="disabled:opacity-40">Previous</button>
        <span>Page {meta.page} of {meta.totalPages}</span>
        <button type="button" disabled={page >= meta.totalPages} onClick={() => setPage((p) => p + 1)} className="disabled:opacity-40">Next</button>
      </div>
      {modal && (
        <ProductModal
          product={modal}
          categories={categories}
          isKrishi={isKrishi}
          units={units}
          defaultGst={config?.default_gst_percentage ?? 18}
          defaultMinStock={config?.default_min_stock ?? 5}
          onClose={() => setModal(null)}
          onSave={saveProduct}
        />
      )}
    </AppShell>
  );
}

function ProductModal({ product, categories, isKrishi, units, defaultGst, defaultMinStock, onClose, onSave }) {
  const [form, setForm] = useState({
    name: product.name || '',
    sku: product.sku || '',
    categoryId: product.categoryId || categories[0]?.id || '',
    purchasePrice: product.purchasePrice || 0,
    sellingPrice: product.sellingPrice || 0,
    quantity: product.quantity || 0,
    minStock: product.minStock ?? defaultMinStock,
    unit: product.unit || units[0] || 'Pieces',
    companyName: product.companyName || '',
    gstPercentage: product.gstPercentage ?? defaultGst,
    metadata: product.metadata || {},
  });

  const setMeta = (key, val) => setForm((f) => ({ ...f, metadata: { ...f.metadata, [key]: val } }));

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-40 p-4">
      <div className="bg-surface-container-lowest rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
        <h2 className="font-semibold mb-4">{product.id ? 'Edit' : 'Add'} Product</h2>
        <div className="grid gap-3 text-sm">
          <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="h-9 px-2 border rounded" />
          <input placeholder="SKU" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} className="h-9 px-2 border rounded" />
          <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className="h-9 px-2 border rounded">
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className="h-9 px-2 border rounded">
            {units.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
          <div className="grid grid-cols-2 gap-2">
            <input type="number" placeholder="Purchase" value={form.purchasePrice} onChange={(e) => setForm({ ...form, purchasePrice: +e.target.value })} className="h-9 px-2 border rounded" />
            <input type="number" placeholder="Selling" value={form.sellingPrice} onChange={(e) => setForm({ ...form, sellingPrice: +e.target.value })} className="h-9 px-2 border rounded" />
          </div>
          {isKrishi ? (
            <>
              <input placeholder="Batch No" value={form.metadata.batchNo || ''} onChange={(e) => setMeta('batchNo', e.target.value)} className="h-9 px-2 border rounded" />
              <input type="date" value={form.metadata.expiryDate || ''} onChange={(e) => setMeta('expiryDate', e.target.value)} className="h-9 px-2 border rounded" />
            </>
          ) : (
            <>
              <input placeholder="Size" value={form.metadata.size || ''} onChange={(e) => setMeta('size', e.target.value)} className="h-9 px-2 border rounded" />
              <input placeholder="Material" value={form.metadata.material || ''} onChange={(e) => setMeta('material', e.target.value)} className="h-9 px-2 border rounded" />
            </>
          )}
        </div>
        <div className="flex gap-2 mt-4">
          <button type="button" onClick={onClose} className="flex-1 h-9 border rounded">Cancel</button>
          <button type="button" onClick={() => onSave(form)} className="flex-1 h-9 bg-primary text-on-primary rounded">Save</button>
        </div>
      </div>
    </div>
  );
}

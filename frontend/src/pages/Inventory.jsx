import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
  const units = config?.allowed_units || ['KG', 'Bags', 'Liters', 'Pieces'];
  const { get, post, put, del } = useApi();
  const [products, setProducts] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState('');

  const canEdit = ['ADMIN', 'MANAGER'].includes(user?.role);

  const load = useCallback(async () => {
    try {
      const q = new URLSearchParams({ page, pageSize: 25, search });
      const res = await get(`/api/products?${q}`);
      setProducts(res.data || []);
      setMeta(res.meta || { page: 1, totalPages: 1 });
    } catch (e) {
      setToast(e.message);
    }
  }, [get, page, search]);

  useEffect(() => {
    load();
    get('/api/categories').then((r) => setCategories(r.data || []));
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
      setToast('Product saved successfully');
    } catch (e) {
      setToast(e.message);
    }
  };

  const removeProduct = async (id) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await del(`/api/products/${id}`);
      load();
      setToast('Product removed successfully');
    } catch (e) {
      setToast(e.message);
    }
  };

  const isKrishi = business?.type === 'KRISHI';

  // Client side filters for category and brand
  const filteredProducts = products.filter((p) => {
    if (selectedCategory && p.categoryId !== selectedCategory) return false;
    if (selectedBrand && p.companyName !== selectedBrand) return false;
    return true;
  });

  // Extract unique brands (companyNames)
  const brands = [...new Set(products.map((p) => p.companyName).filter(Boolean))];

  return (
    <AppShell>
      <Toast
        message={toast}
        type={toast.includes('successfully') ? 'success' : 'error'}
        onClose={() => setToast('')}
      />

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-left">
          <div>
            <h1 className="text-2xl font-bold text-on-background font-headline tracking-tight">
              {isKrishi ? 'Agricultural Inventory' : 'Hardware Inventory'}
            </h1>
            <p className="text-xs text-on-surface-variant mt-1">
              Manage and track products, specifications, and stock levels.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/bulk-upload')}
              className="flex items-center gap-2 px-4 py-2 bg-surface-container text-on-surface text-xs font-semibold rounded-lg border border-outline-variant hover:bg-surface-container-high transition-colors shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">upload_file</span>
              Bulk Upload
            </button>
            {canEdit && (
              <button
                onClick={() => setModal({})}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary text-xs font-semibold rounded-lg hover:opacity-90 transition-opacity shadow-sm cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                Add Product
              </button>
            )}
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-sm text-left">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2 text-xs font-semibold text-on-surface-variant">
              <span className="material-symbols-outlined text-[18px]">filter_list</span>
              Filters
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="h-10 text-xs bg-surface-container-low border border-outline-variant rounded-lg px-3 focus:ring-primary focus:border-primary outline-none"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="h-10 text-xs bg-surface-container-low border border-outline-variant rounded-lg px-3 focus:ring-primary focus:border-primary outline-none"
            >
              <option value="">All Brands</option>
              {brands.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>

            {/* Quick search input inside filter bar */}
            <div className="relative flex-1 max-w-xs ml-auto">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
                search
              </span>
              <input
                placeholder="Search SKU or name..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-9 pr-4 py-2 bg-surface-container-low border border-outline-variant rounded-full text-xs focus:outline-none focus:ring-2 focus:ring-primary w-full h-10"
                type="text"
              />
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm dense-table border-collapse">
              <thead className="bg-surface-container-low text-on-surface-variant font-medium border-b border-outline-variant">
                <tr>
                  <th className="px-4 py-3 w-8">
                    <input
                      className="rounded border-outline-variant text-primary focus:ring-primary h-4 w-4 bg-surface cursor-pointer"
                      type="checkbox"
                      readOnly
                    />
                  </th>
                  <th className="px-4 py-3">Product Name</th>
                  <th className="px-4 py-3">SKU</th>
                  <th className="px-4 py-3">Qty</th>
                  {isKrishi ? (
                    <>
                      <th className="px-4 py-3">Batch</th>
                      <th className="px-4 py-3">Expiry</th>
                    </>
                  ) : (
                    <>
                      <th className="px-4 py-3">Size</th>
                      <th className="px-4 py-3">Material</th>
                    </>
                  )}
                  <th className="px-4 py-3">Status</th>
                  {canEdit && <th className="px-4 py-3 text-center">Actions</th>}
                </tr>
              </thead>
              <tbody className="text-on-surface font-medium divide-y divide-outline-variant/30">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-4 text-center text-xs text-on-surface-variant">
                      No products found matching filters.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((p) => (
                    <tr key={p.id} className="hover:bg-surface-container-low/30 transition-colors h-8">
                      <td className="px-4 py-2">
                        <input
                          className="rounded border-outline-variant text-primary focus:ring-primary h-4 w-4 bg-surface cursor-pointer"
                          type="checkbox"
                          readOnly
                        />
                      </td>
                      <td className="px-4 py-2 text-xs font-bold text-on-surface">{p.name}</td>
                      <td className="px-4 py-2 text-xs text-on-surface-variant">{p.sku}</td>
                      <td className="px-4 py-2 text-xs">
                        {p.quantity} {p.unit}
                      </td>
                      {isKrishi ? (
                        <>
                          <td className="px-4 py-2 text-xs">{p.metadata?.batchNo || '—'}</td>
                          <td className="px-4 py-2 text-xs">{p.metadata?.expiryDate || '—'}</td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-2 text-xs">{p.metadata?.size || '—'}</td>
                          <td className="px-4 py-2 text-xs">{p.metadata?.material || '—'}</td>
                        </>
                      )}
                      <td className="px-4 py-2">
                        <StatusBadge
                          status={p.quantity <= p.minStock ? 'lowStock' : 'inStock'}
                          label={p.quantity <= p.minStock ? 'Low Stock' : 'In Stock'}
                        />
                      </td>
                      {canEdit && (
                        <td className="px-4 py-2 text-center space-x-3">
                          <button
                            type="button"
                            className="text-primary text-xs font-semibold hover:underline cursor-pointer animate-none"
                            onClick={() => setModal(p)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="text-error text-xs font-semibold hover:underline cursor-pointer"
                            onClick={() => removeProduct(p.id)}
                          >
                            Delete
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="flex items-center justify-between px-4 py-3 bg-surface-container-low border-t border-outline-variant text-xs font-medium">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1.5 border border-outline-variant bg-surface rounded hover:bg-surface-container transition-colors disabled:opacity-40 cursor-pointer"
            >
              Previous
            </button>
            <span className="text-on-surface-variant">
              Page {meta.page} of {meta.totalPages}
            </span>
            <button
              type="button"
              disabled={page >= meta.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1.5 border border-outline-variant bg-surface rounded hover:bg-surface-container transition-colors disabled:opacity-40 cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
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
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-surface-container-lowest rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 border border-outline-variant/30 shadow-xl text-left">
        <h2 className="font-headline font-bold text-lg text-on-surface mb-4">
          {product.id ? 'Edit' : 'Add'} Product
        </h2>
        <div className="grid gap-3 text-xs">
          <div className="space-y-1">
            <label className="block text-[11px] font-semibold text-on-surface-variant">Product Name</label>
            <input
              placeholder="e.g. Urea Fertilizer"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="h-10 w-full px-3 border rounded-lg bg-surface focus:ring-2 focus:ring-primary focus:border-primary outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="block text-[11px] font-semibold text-on-surface-variant">SKU Code</label>
              <input
                placeholder="SKU-CODE"
                value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value })}
                className="h-10 w-full px-3 border rounded-lg bg-surface focus:ring-2 focus:ring-primary focus:border-primary outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[11px] font-semibold text-on-surface-variant">Company Name</label>
              <input
                placeholder="Brand / Manufacturer"
                value={form.companyName}
                onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                className="h-10 w-full px-3 border rounded-lg bg-surface focus:ring-2 focus:ring-primary focus:border-primary outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="block text-[11px] font-semibold text-on-surface-variant">Category</label>
              <select
                value={form.categoryId}
                onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                className="h-10 w-full px-2 border rounded-lg bg-surface focus:ring-2 focus:ring-primary focus:border-primary outline-none"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-[11px] font-semibold text-on-surface-variant">Unit</label>
              <select
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
                className="h-10 w-full px-2 border rounded-lg bg-surface focus:ring-2 focus:ring-primary focus:border-primary outline-none"
              >
                {units.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="block text-[11px] font-semibold text-on-surface-variant">Purchase Price (₹)</label>
              <input
                type="number"
                placeholder="0"
                value={form.purchasePrice}
                onChange={(e) => setForm({ ...form, purchasePrice: +e.target.value })}
                className="h-10 w-full px-3 border rounded-lg bg-surface focus:ring-2 focus:ring-primary focus:border-primary outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[11px] font-semibold text-on-surface-variant">Selling Price (₹)</label>
              <input
                type="number"
                placeholder="0"
                value={form.sellingPrice}
                onChange={(e) => setForm({ ...form, sellingPrice: +e.target.value })}
                className="h-10 w-full px-3 border rounded-lg bg-surface focus:ring-2 focus:ring-primary focus:border-primary outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <label className="block text-[11px] font-semibold text-on-surface-variant">Quantity</label>
              <input
                type="number"
                placeholder="0"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: +e.target.value })}
                className="h-10 w-full px-3 border rounded-lg bg-surface focus:ring-2 focus:ring-primary focus:border-primary outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[11px] font-semibold text-on-surface-variant">Min Stock</label>
              <input
                type="number"
                placeholder="5"
                value={form.minStock}
                onChange={(e) => setForm({ ...form, minStock: +e.target.value })}
                className="h-10 w-full px-3 border rounded-lg bg-surface focus:ring-2 focus:ring-primary focus:border-primary outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[11px] font-semibold text-on-surface-variant">GST %</label>
              <input
                type="number"
                placeholder="18"
                value={form.gstPercentage}
                onChange={(e) => setForm({ ...form, gstPercentage: +e.target.value })}
                className="h-10 w-full px-3 border rounded-lg bg-surface focus:ring-2 focus:ring-primary focus:border-primary outline-none"
              />
            </div>
          </div>

          {isKrishi ? (
            <div className="grid grid-cols-2 gap-2 border-t border-outline-variant/30 pt-3">
              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-on-surface-variant">Batch No</label>
                <input
                  placeholder="e.g. BT-9912"
                  value={form.metadata.batchNo || ''}
                  onChange={(e) => setMeta('batchNo', e.target.value)}
                  className="h-10 w-full px-3 border rounded-lg bg-surface focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-on-surface-variant">Expiry Date</label>
                <input
                  type="date"
                  value={form.metadata.expiryDate || ''}
                  onChange={(e) => setMeta('expiryDate', e.target.value)}
                  className="h-10 w-full px-3 border rounded-lg bg-surface focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 border-t border-outline-variant/30 pt-3">
              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-on-surface-variant">Size</label>
                <input
                  placeholder="e.g. 1/2 inch, M10"
                  value={form.metadata.size || ''}
                  onChange={(e) => setMeta('size', e.target.value)}
                  className="h-10 w-full px-3 border rounded-lg bg-surface focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-on-surface-variant">Material</label>
                <input
                  placeholder="e.g. Brass, Carbon Steel"
                  value={form.metadata.material || ''}
                  onChange={(e) => setMeta('material', e.target.value)}
                  className="h-10 w-full px-3 border rounded-lg bg-surface focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-10 border border-outline-variant rounded-lg text-xs font-semibold hover:bg-surface-container transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onSave(form)}
            className="flex-1 h-10 bg-primary text-on-primary rounded-lg text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer animate-none"
          >
            Save Product
          </button>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AppShell from '../components/common/AppShell.jsx';
import StatusBadge from '../components/common/StatusBadge.jsx';
import Toast from '../components/common/Toast.jsx';
import { useBusiness } from '../context/BusinessContext.jsx';
import { useApi } from '../hooks/useApi.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useConfig } from '../context/ConfigContext.jsx';
import CustomFieldsForm from '../components/common/CustomFieldsForm.jsx';
import ImagePreviewModal from '../components/common/ImagePreviewModal.jsx';

export default function Inventory() {
  const { business } = useBusiness();
  const { user } = useAuth();
  const { config } = useConfig();
  const navigate = useNavigate();
  const units = config?.allowed_units || ['KG', 'Bags', 'Liters', 'Pieces'];
  const customFields = config?.custom_metadata_fields || [];
  const { get, post, put, del } = useApi();
  const [products, setProducts] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [toast, setToast] = useState('');
  const [previewSrc, setPreviewSrc] = useState('');
  const [previewTitle, setPreviewTitle] = useState('');

  const canEdit = ['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(user?.role);

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
                onClick={() => navigate('/bulk-upload', { state: { tab: 'single', focusImage: true } })}
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
                  {customFields.map((cf) => (
                    <th key={cf.key} className="px-4 py-3">{cf.label}</th>
                  ))}
                  <th className="px-4 py-3">Status</th>
                  {canEdit && <th className="px-4 py-3 text-center">Actions</th>}
                </tr>
              </thead>
              <tbody className="text-on-surface font-medium divide-y divide-outline-variant/30">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={7 + customFields.length} className="p-4 text-center text-xs text-on-surface-variant">
                      No products found matching filters.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((p) => (
                    <tr key={p.id} className="hover:bg-surface-container-low/30 transition-colors">
                      <td className="px-4 py-2">
                        <input
                          className="rounded border-outline-variant text-primary focus:ring-primary h-4 w-4 bg-surface cursor-pointer"
                          type="checkbox"
                          readOnly
                        />
                      </td>
                      <td className="px-4 py-2 text-xs font-bold text-on-surface flex items-center gap-2.5">
                        {p.metadata?.imageUrl ? (
                          <img
                            src={p.metadata.imageUrl}
                            alt={p.name}
                            className="w-8 h-8 rounded-md object-cover border border-outline-variant/30 shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => {
                              setPreviewSrc(p.metadata.imageUrl);
                              setPreviewTitle(p.name);
                            }}
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-md bg-surface-container-high flex items-center justify-center border border-outline-variant/30 shrink-0 text-on-surface-variant/40">
                            <span className="material-symbols-outlined text-[16px]">image</span>
                          </div>
                        )}
                        <span>{p.name}</span>
                      </td>
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
                      {customFields.map((cf) => {
                        const val = p.metadata?.[cf.key];
                        let element = '—';
                        
                        if (val !== undefined && val !== null && String(val).trim() !== '') {
                          if (cf.type === 'toggle') {
                            element = val ? 'Yes' : 'No';
                          } else if (cf.type === 'multiselect') {
                            element = Array.isArray(val) ? val.join(', ') : String(val);
                          } else if (cf.type === 'file' && typeof val === 'string' && val.startsWith('data:')) {
                            const isPdf = val.startsWith('data:application/pdf');
                            element = (
                              <button
                                type="button"
                                onClick={() => {
                                  setPreviewSrc(val);
                                  setPreviewTitle(`${p.name} - ${cf.label}`);
                                }}
                                className="inline-flex items-center gap-1 text-primary hover:underline font-semibold cursor-pointer bg-transparent border-none p-0"
                                title="Click to view attachment"
                              >
                                <span className="material-symbols-outlined text-[16px]">
                                  {isPdf ? 'picture_as_pdf' : 'attachment'}
                                </span>
                                <span className="text-[10px]">View</span>
                              </button>
                            );
                          } else {
                            element = String(val);
                          }
                        }

                        return (
                          <td key={cf.key} className="px-4 py-2 text-xs">{element}</td>
                        );
                      })}
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
                            onClick={() => navigate('/bulk-upload', { state: { tab: 'single', product: p } })}
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

      <ImagePreviewModal
        isOpen={!!previewSrc}
        onClose={() => setPreviewSrc('')}
        src={previewSrc}
        title={previewTitle}
      />
    </AppShell>
  );
}

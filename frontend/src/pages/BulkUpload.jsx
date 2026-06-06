import { useState, useEffect, useRef } from 'react';
import AppShell from '../components/common/AppShell.jsx';
import Toast from '../components/common/Toast.jsx';
import { useApi } from '../hooks/useApi.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useConfig } from '../context/ConfigContext.jsx';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useBusiness } from '../context/BusinessContext.jsx';
import { downloadPdf } from '../services/api.js';
import CustomFieldsForm from '../components/common/CustomFieldsForm.jsx';
import ImagePreviewModal from '../components/common/ImagePreviewModal.jsx';

export default function BulkUpload() {
  const { user } = useAuth();
  const { business } = useBusiness();
  const { get, post, put, upload } = useApi();
  const { config } = useConfig();
  const navigate = useNavigate();
  const location = useLocation();
  const editProduct = location.state?.product;
  const isEdit = !!editProduct;
  const bulkEnabled = config?.enable_bulk_upload !== false && config?._env?.enableBulkUpload !== false;
  const customFields = config?.custom_metadata_fields || [];
  
  const [activeTab, setActiveTab] = useState(isEdit ? 'single' : (location.state?.tab || (bulkEnabled ? 'bulk' : 'single')));
  const imageInputRef = useRef(null);
  const [shouldAnimateImage, setShouldAnimateImage] = useState(false);
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');
  const [categories, setCategories] = useState([]);
  const [previewSrc, setPreviewSrc] = useState('');
  const [previewTitle, setPreviewTitle] = useState('');

  const defaultMinStock = config?.default_min_stock ?? 5;
  const defaultGst = config?.default_gst_percentage ?? 18;
  const units = config?.allowed_units || ['KG', 'Bags', 'Liters', 'Pieces'];

  const [form, setForm] = useState({
    name: '',
    sku: '',
    categoryId: '',
    purchasePrice: 0,
    sellingPrice: 0,
    quantity: 0,
    minStock: defaultMinStock,
    unit: units[0] || 'Pieces',
    companyName: '',
    gstPercentage: defaultGst,
    metadata: {},
  });

  if (!['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(user?.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  useEffect(() => {
    if (!bulkEnabled) {
      setActiveTab('single');
    }
  }, [bulkEnabled]);

  useEffect(() => {
    get('/api/categories')
      .then((r) => setCategories(r.data || []))
      .catch((e) => setToast(e.message));
  }, [get]);

  useEffect(() => {
    if (isEdit && editProduct) {
      setForm({
        name: editProduct.name || '',
        sku: editProduct.sku || '',
        categoryId: editProduct.categoryId || '',
        purchasePrice: editProduct.purchasePrice || 0,
        sellingPrice: editProduct.sellingPrice || 0,
        quantity: editProduct.quantity || 0,
        minStock: editProduct.minStock ?? defaultMinStock,
        unit: editProduct.unit || units[0] || 'Pieces',
        companyName: editProduct.companyName || '',
        gstPercentage: editProduct.gstPercentage ?? defaultGst,
        metadata: editProduct.metadata || {},
      });
    } else {
      setForm((f) => ({
        ...f,
        categoryId: f.categoryId || categories[0]?.id || '',
        minStock: defaultMinStock,
        unit: f.unit || units[0] || 'Pieces',
        gstPercentage: defaultGst,
      }));
    }
  }, [isEdit, editProduct, categories, defaultMinStock, defaultGst, units]);

  useEffect(() => {
    if (location.state?.tab) {
      setActiveTab(location.state.tab);
    }
    if (location.state?.focusImage) {
      setShouldAnimateImage(true);
      setTimeout(() => {
        if (imageInputRef.current) {
          imageInputRef.current.focus();
          imageInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 300);
      const timer = setTimeout(() => setShouldAnimateImage(false), 2500);
      return () => clearTimeout(timer);
    }
  }, [location.state]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    setToast('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await upload('/api/excel/upload', fd);
      setResult(res);
      setToast(`Uploaded ${res.successCount} products successfully`);
    } catch (err) {
      setToast(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const typeStr = business?.type?.toLowerCase() || 'krishi';
      await downloadPdf('/api/excel/template', `gohite_template_${typeStr}.xlsx`);
      setToast('Template downloaded successfully');
    } catch (err) {
      setToast(`Download failed: ${err.message}`);
    }
  };

  const setMeta = (key, val) => {
    setForm((f) => ({
      ...f,
      metadata: {
        ...f.metadata,
        [key]: val,
      },
    }));
  };

  const handleSingleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setToast('');
    try {
      if (!form.name.trim()) throw new Error('Product Name is required');
      if (!form.sku.trim()) throw new Error('SKU Code is required');
      if (!form.categoryId) throw new Error('Category is required');

      // filter metadata to only include truthy trimmed values
      const metadata = {};
      Object.entries(form.metadata).forEach(([k, v]) => {
        if (v !== undefined && v !== null && String(v).trim() !== '') {
          metadata[k] = typeof v === 'boolean' ? v : String(v).trim();
        }
      });

      const payload = {
        ...form,
        purchasePrice: Number(form.purchasePrice || 0),
        sellingPrice: Number(form.sellingPrice || 0),
        quantity: Number(form.quantity || 0),
        minStock: Number(form.minStock || 0),
        gstPercentage: Number(form.gstPercentage || 0),
        metadata,
      };

      if (isEdit) {
        await put(`/api/products/${editProduct.id}`, payload);
        setToast('Product updated successfully');
        setTimeout(() => navigate('/inventory'), 1000);
      } else {
        await post('/api/products', payload);
        setToast('Product created successfully');
        
        setForm({
          name: '',
          sku: '',
          categoryId: categories[0]?.id || '',
          purchasePrice: 0,
          sellingPrice: 0,
          quantity: 0,
          minStock: defaultMinStock,
          unit: units[0] || 'Pieces',
          companyName: '',
          gstPercentage: defaultGst,
          metadata: {},
        });
      }
    } catch (err) {
      setToast(err.message);
    } finally {
      setLoading(false);
    }
  };

  const isKrishi = business?.type === 'KRISHI';

  return (
    <AppShell>
      <Toast
        message={toast}
        type={toast.includes('successfully') ? 'success' : 'error'}
        onClose={() => setToast('')}
      />

      <div className="max-w-4xl mx-auto space-y-6 text-left">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-on-background font-headline tracking-tight">
            {isEdit ? 'Edit Product' : 'Inventory Entry & Import'}
          </h1>
          <p className="text-xs text-on-surface-variant mt-1">
            {isEdit 
              ? `Modify details for product ${editProduct.name}`
              : 'Import products using spreadsheet templates or enter details individually.'
            }
          </p>
        </div>

        {/* Tab Switcher - only show if bulkEnabled is true and not editing */}
        {isEdit ? (
          <div className="bg-surface-container-low border border-outline-variant p-3 rounded-lg text-xs text-on-surface-variant flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[18px]">info</span>
              <span>You are editing <strong>{editProduct.name}</strong> (SKU: {editProduct.sku}).</span>
            </div>
            <button onClick={() => navigate('/inventory')} className="text-error font-semibold underline text-xs">Cancel</button>
          </div>
        ) : bulkEnabled ? (
          <div className="flex border-b border-outline-variant">
            <button
              type="button"
              onClick={() => setActiveTab('bulk')}
              className={`pb-3 text-xs font-semibold px-4 flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeTab === 'bulk'
                  ? 'border-primary text-primary font-bold'
                  : 'border-transparent text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">upload_file</span>
              Bulk Spreadsheet Import
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('single')}
              className={`pb-3 text-xs font-semibold px-4 flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeTab === 'single'
                  ? 'border-primary text-primary font-bold'
                  : 'border-transparent text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">add_box</span>
              Single Product Entry
            </button>
          </div>
        ) : (
          <div className="bg-surface-container-low border border-outline-variant p-3 rounded-lg text-xs text-on-surface-variant flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[18px]">info</span>
            <span>Bulk Spreadsheet Import is currently disabled. Showing Single Product Entry.</span>
          </div>
        )}

        {activeTab === 'bulk' && bulkEnabled && !isEdit ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            <div className="md:col-span-2 bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm space-y-5">
              <h2 className="font-headline font-bold text-base text-on-surface pb-2 border-b border-outline-variant/30 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">upload_file</span>
                Upload spreadsheet
              </h2>

              <form onSubmit={handleUpload} className="space-y-4">
                <div className="border-2 border-dashed border-outline-variant hover:border-primary/50 transition-colors rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer relative bg-surface-container-low/10">
                  <span className="material-symbols-outlined text-4xl text-primary/70 mb-3">upload_file</span>
                  
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={(e) => setFile(e.target.files?.[0])}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  
                  {file ? (
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-on-surface">{file.name}</p>
                      <p className="text-[10px] text-on-surface-variant">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs font-bold text-on-surface">Click to browse or drag file here</p>
                      <p className="text-[10px] text-on-surface-variant mt-1">Supports Microsoft Excel .xlsx and .xls formats</p>
                    </div>
                  )}
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={!file || loading}
                    className="h-10 px-6 bg-primary text-on-primary rounded-lg text-xs font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex items-center gap-1 cursor-pointer transition-opacity"
                  >
                    <span className="material-symbols-outlined text-[18px]">publish</span>
                    {loading ? 'Uploading File...' : 'Upload & Parse'}
                  </button>
                </div>
              </form>

              {result?.errors?.length > 0 && (
                <div className="mt-4 p-4 border border-error/30 rounded-lg bg-error-container/10 space-y-3">
                  <h3 className="font-bold text-sm text-on-error-container flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-error text-[18px]">error</span>
                    Row validation errors ({result.errors.length})
                  </h3>
                  <ul className="text-xs font-mono text-on-error-container/90 space-y-1 max-h-48 overflow-y-auto pr-1 bg-surface-container-lowest/50 p-2.5 rounded-lg border border-error/10">
                    {result.errors.map((err, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="font-bold text-error">Row {err.row}:</span>
                        <span>{err.error}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm space-y-4">
              <h2 className="font-headline font-bold text-sm text-on-surface pb-2 border-b border-outline-variant/30">
                Columns Specification
              </h2>
              <p className="text-[11px] text-on-surface-variant leading-relaxed">
                Your Excel sheet must follow the column headers template described below to avoid validation errors:
              </p>
              <div className="space-y-2 text-xs">
                <div className="flex gap-2 items-start">
                  <span className="material-symbols-outlined text-[#146c2e] text-[18px]">check_circle</span>
                  <div>
                    <p className="font-semibold">Core Product Fields</p>
                    <p className="text-[10px] text-on-surface-variant leading-normal">name, sku, category, purchasePrice, sellingPrice, quantity, unit, companyName, gstPercentage</p>
                  </div>
                </div>
                <div className="flex gap-2 items-start border-t border-outline-variant/20 pt-2">
                  <span className="material-symbols-outlined text-primary text-[18px]">info</span>
                  <div>
                    <p className="font-semibold">Polymorphic Metadata Fields</p>
                    <p className="text-[10px] text-on-surface-variant leading-normal">
                      {isKrishi ? (
                        <>
                          <strong>Krishi:</strong> batchNo, expiryDate, manufacturer, composition, licenseNo
                        </>
                      ) : (
                        <>
                          <strong>Hardware:</strong> size, brand, material, color, warranty
                        </>
                      )}
                      {customFields.length > 0 && (
                        <>
                          <br />
                          <strong>Custom:</strong> {customFields.map((f) => f.key).join(', ')}
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </div>
              <div className="border-t border-outline-variant/20 pt-3">
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="w-full h-10 px-4 border border-primary text-primary hover:bg-primary/5 font-semibold rounded-lg text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">download</span>
                  Download template format
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            <div className="md:col-span-2 bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm space-y-6">
              <h2 className="font-headline font-bold text-base text-on-surface pb-2 border-b border-outline-variant/30 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">
                  {isEdit ? 'edit_document' : 'add_box'}
                </span>
                {isEdit ? 'Edit Product Details' : 'Single Product Entry'}
              </h2>

              <form onSubmit={handleSingleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-primary uppercase tracking-wider">General Information</h3>
                  
                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold text-on-surface-variant">Product Name *</label>
                    <input
                      placeholder="e.g. Urea Fertilizer"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="h-10 w-full px-3 border border-outline-variant rounded-lg bg-surface focus:ring-2 focus:ring-primary focus:border-primary outline-none text-xs"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-[11px] font-semibold text-on-surface-variant">SKU Code *</label>
                      <input
                        placeholder="e.g. SKU-12345"
                        value={form.sku}
                        onChange={(e) => setForm({ ...form, sku: e.target.value })}
                        className="h-10 w-full px-3 border border-outline-variant rounded-lg bg-surface focus:ring-2 focus:ring-primary focus:border-primary outline-none text-xs"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[11px] font-semibold text-on-surface-variant">Brand / Company Name</label>
                      <input
                        placeholder="Manufacturer name"
                        value={form.companyName}
                        onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                        className="h-10 w-full px-3 border border-outline-variant rounded-lg bg-surface focus:ring-2 focus:ring-primary focus:border-primary outline-none text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-[11px] font-semibold text-on-surface-variant">Category *</label>
                      <select
                        value={form.categoryId}
                        onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                        className="h-10 w-full px-2 border border-outline-variant rounded-lg bg-surface focus:ring-2 focus:ring-primary focus:border-primary outline-none text-xs"
                        required
                      >
                        <option value="">Select Category</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[11px] font-semibold text-on-surface-variant">Unit *</label>
                      <select
                        value={form.unit}
                        onChange={(e) => setForm({ ...form, unit: e.target.value })}
                        className="h-10 w-full px-2 border border-outline-variant rounded-lg bg-surface focus:ring-2 focus:ring-primary focus:border-primary outline-none text-xs"
                        required
                      >
                        {units.map((u) => (
                          <option key={u} value={u}>
                            {u}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-outline-variant/20">
                  <h3 className="text-xs font-bold text-primary uppercase tracking-wider">Pricing & Stock</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="block text-[11px] font-semibold text-on-surface-variant">Purchase Price (₹)</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0"
                        value={form.purchasePrice}
                        onChange={(e) => setForm({ ...form, purchasePrice: e.target.value })}
                        className="h-10 w-full px-3 border border-outline-variant rounded-lg bg-surface focus:ring-2 focus:ring-primary focus:border-primary outline-none text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[11px] font-semibold text-on-surface-variant">Selling Price (₹)</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0"
                        value={form.sellingPrice}
                        onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })}
                        className="h-10 w-full px-3 border border-outline-variant rounded-lg bg-surface focus:ring-2 focus:ring-primary focus:border-primary outline-none text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[11px] font-semibold text-on-surface-variant">GST %</label>
                      <input
                        type="number"
                        placeholder="18"
                        value={form.gstPercentage}
                        onChange={(e) => setForm({ ...form, gstPercentage: e.target.value })}
                        className="h-10 w-full px-3 border border-outline-variant rounded-lg bg-surface focus:ring-2 focus:ring-primary focus:border-primary outline-none text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-[11px] font-semibold text-on-surface-variant">Initial Quantity</label>
                      <input
                        type="number"
                        placeholder="0"
                        value={form.quantity}
                        onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                        className="h-10 w-full px-3 border border-outline-variant rounded-lg bg-surface focus:ring-2 focus:ring-primary focus:border-primary outline-none text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[11px] font-semibold text-on-surface-variant">Min Stock Level</label>
                      <input
                        type="number"
                        placeholder="5"
                        value={form.minStock}
                        onChange={(e) => setForm({ ...form, minStock: e.target.value })}
                        className="h-10 w-full px-3 border border-outline-variant rounded-lg bg-surface focus:ring-2 focus:ring-primary focus:border-primary outline-none text-xs"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-outline-variant/20">
                  <h3 className="text-xs font-bold text-primary uppercase tracking-wider">Additional Specifications</h3>
                  
                  {isKrishi ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="block text-[11px] font-semibold text-on-surface-variant">Batch Number</label>
                          <input
                            placeholder="e.g. B-9912A"
                            value={form.metadata.batchNo || ''}
                            onChange={(e) => setMeta('batchNo', e.target.value)}
                            className="h-10 w-full px-3 border border-outline-variant rounded-lg bg-surface focus:ring-2 focus:ring-primary focus:border-primary outline-none text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-[11px] font-semibold text-on-surface-variant">Expiry Date</label>
                          <input
                            type="date"
                            value={form.metadata.expiryDate || ''}
                            onChange={(e) => setMeta('expiryDate', e.target.value)}
                            className="h-10 w-full px-3 border border-outline-variant rounded-lg bg-surface focus:ring-2 focus:ring-primary focus:border-primary outline-none text-xs"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <label className="block text-[11px] font-semibold text-on-surface-variant">Manufacturer</label>
                          <input
                            placeholder="e.g. Indo-Agro Corp"
                            value={form.metadata.manufacturer || ''}
                            onChange={(e) => setMeta('manufacturer', e.target.value)}
                            className="h-10 w-full px-3 border border-outline-variant rounded-lg bg-surface focus:ring-2 focus:ring-primary focus:border-primary outline-none text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-[11px] font-semibold text-on-surface-variant">Composition</label>
                          <input
                            placeholder="e.g. Hybrid Corn Seed"
                            value={form.metadata.composition || ''}
                            onChange={(e) => setMeta('composition', e.target.value)}
                            className="h-10 w-full px-3 border border-outline-variant rounded-lg bg-surface focus:ring-2 focus:ring-primary focus:border-primary outline-none text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-[11px] font-semibold text-on-surface-variant">License Number</label>
                          <input
                            placeholder="e.g. LIC-AGR-4421"
                            value={form.metadata.licenseNo || ''}
                            onChange={(e) => setMeta('licenseNo', e.target.value)}
                            className="h-10 w-full px-3 border border-outline-variant rounded-lg bg-surface focus:ring-2 focus:ring-primary focus:border-primary outline-none text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="block text-[11px] font-semibold text-on-surface-variant">Size / Dimension</label>
                          <input
                            placeholder="e.g. 1/2 inch"
                            value={form.metadata.size || ''}
                            onChange={(e) => setMeta('size', e.target.value)}
                            className="h-10 w-full px-3 border border-outline-variant rounded-lg bg-surface focus:ring-2 focus:ring-primary focus:border-primary outline-none text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-[11px] font-semibold text-on-surface-variant">Brand Model</label>
                          <input
                            placeholder="e.g. ApexFit"
                            value={form.metadata.brand || ''}
                            onChange={(e) => setMeta('brand', e.target.value)}
                            className="h-10 w-full px-3 border border-outline-variant rounded-lg bg-surface focus:ring-2 focus:ring-primary focus:border-primary outline-none text-xs"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <label className="block text-[11px] font-semibold text-on-surface-variant">Material</label>
                          <input
                            placeholder="e.g. Brass"
                            value={form.metadata.material || ''}
                            onChange={(e) => setMeta('material', e.target.value)}
                            className="h-10 w-full px-3 border border-outline-variant rounded-lg bg-surface focus:ring-2 focus:ring-primary focus:border-primary outline-none text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-[11px] font-semibold text-on-surface-variant">Color</label>
                          <input
                            placeholder="e.g. Gold"
                            value={form.metadata.color || ''}
                            onChange={(e) => setMeta('color', e.target.value)}
                            className="h-10 w-full px-3 border border-outline-variant rounded-lg bg-surface focus:ring-2 focus:ring-primary focus:border-primary outline-none text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-[11px] font-semibold text-on-surface-variant">Warranty</label>
                          <input
                            placeholder="e.g. 1 Year"
                            value={form.metadata.warranty || ''}
                            onChange={(e) => setMeta('warranty', e.target.value)}
                            className="h-10 w-full px-3 border border-outline-variant rounded-lg bg-surface focus:ring-2 focus:ring-primary focus:border-primary outline-none text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {customFields.length > 0 && (
                  <div className="space-y-4 pt-4 border-t border-outline-variant/20">
                    <h3 className="text-xs font-bold text-primary uppercase tracking-wider">Custom Fields</h3>
                    <CustomFieldsForm fields={customFields} values={form.metadata} onChange={setMeta} />
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t border-outline-variant/20">
                  {isEdit && (
                    <button
                      type="button"
                      onClick={() => navigate('/inventory')}
                      className="h-10 px-6 border border-outline-variant rounded-lg text-xs font-semibold hover:bg-surface-container transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={loading}
                    className="h-10 px-6 bg-primary text-on-primary rounded-lg text-xs font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex items-center gap-1 cursor-pointer transition-opacity animate-none"
                  >
                    <span className="material-symbols-outlined text-[18px]">save</span>
                    {loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Product'}
                  </button>
                </div>
              </form>
            </div>

            <div className="space-y-6">
              {/* Product Image Card */}
              <div 
                className={`bg-surface-container-lowest border rounded-xl p-5 shadow-sm space-y-4 text-left transition-all duration-300 ${
                  shouldAnimateImage 
                    ? 'border-primary ring-4 ring-primary/20 animate-highlight-glow' 
                    : 'border-outline-variant'
                }`}
              >
                <h2 className="font-headline font-bold text-sm text-on-surface pb-2 border-b border-outline-variant/30 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[20px]">image</span>
                  Product Image
                </h2>
                
                <div className="space-y-4">
                  {/* Visual Dropzone/Preview Area */}
                  <div className="relative group border-2 border-dashed border-outline-variant hover:border-primary/50 rounded-xl p-4 flex flex-col items-center justify-center bg-surface-container-low transition-colors min-h-[140px] text-center">
                    {form.metadata?.imageUrl ? (
                      <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-outline-variant">
                        <img
                          src={form.metadata.imageUrl}
                          alt="Product preview"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-3 transition-opacity duration-200 z-20">
                          <button
                            type="button"
                            onClick={() => {
                              setPreviewSrc(form.metadata.imageUrl);
                              setPreviewTitle(form.name || 'Product Image Preview');
                            }}
                            className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg text-xs font-semibold backdrop-blur-sm border border-white/20 transition-all flex items-center gap-1 cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[16px]">zoom_in</span>
                            Preview
                          </button>
                          <button
                            type="button"
                            onClick={() => setMeta('imageUrl', '')}
                            className="px-3 py-1.5 bg-error/80 hover:bg-error text-white rounded-lg text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                            Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-4 text-on-surface-variant/40">
                        <span className="material-symbols-outlined text-3xl">add_photo_alternate</span>
                        <p className="text-xs font-semibold mt-2 text-on-surface">Click or Drag Image Here</p>
                        <p className="text-[9px] mt-1">Supports PNG, JPG, JPEG, GIF</p>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setMeta('imageUrl', reader.result);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                  </div>

                  {/* Image URL text input */}
                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold text-on-surface-variant">Image URL</label>
                    <input
                      ref={imageInputRef}
                      type="text"
                      placeholder="https://example.com/product.jpg"
                      value={form.metadata?.imageUrl || ''}
                      onChange={(e) => setMeta('imageUrl', e.target.value)}
                      className="h-10 w-full px-3 border border-outline-variant rounded-lg bg-surface focus:ring-2 focus:ring-primary focus:border-primary outline-none text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Product Guidelines */}
              <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm space-y-4 text-left">
                <h2 className="font-headline font-bold text-sm text-on-surface pb-2 border-b border-outline-variant/30">
                  Product Guidelines
                </h2>
                <div className="space-y-3 text-xs leading-relaxed text-on-surface-variant">
                  <div>
                    <p className="font-semibold text-on-surface">Required Fields (*)</p>
                    <p className="text-[10px]">Product Name, SKU Code, Category, and Unit are mandatory to create a product record.</p>
                  </div>
                  <div className="border-t border-outline-variant/20 pt-2">
                    <p className="font-semibold text-on-surface">SKU Uniqueness</p>
                    <p className="text-[10px]">Each product must have a unique Stock Keeping Unit (SKU) identifier inside the business inventory.</p>
                  </div>
                  <div className="border-t border-outline-variant/20 pt-2">
                    <p className="font-semibold text-on-surface">Pricing & Taxations</p>
                    <p className="text-[10px]">Ensure prices are formatted as numbers. Selling Price should generally be greater than or equal to Purchase Price.</p>
                  </div>
                  <div className="border-t border-outline-variant/20 pt-2">
                    <p className="font-semibold text-on-surface">Dynamic Metadata</p>
                    <p className="text-[10px]">
                      {isKrishi 
                        ? "As a Krishi business, you can supply Batch Numbers and Expiry Dates to track perishables and schedule expiry notifications."
                        : "As a Hardware business, you can specify dimensions/sizes, models, materials, and warranties for item categorization."
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
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

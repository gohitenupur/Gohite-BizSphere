import { useState } from 'react';
import AppShell from '../components/common/AppShell.jsx';
import Toast from '../components/common/Toast.jsx';
import { useApi } from '../hooks/useApi.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useConfig } from '../context/ConfigContext.jsx';
import { Navigate } from 'react-router-dom';

export default function BulkUpload() {
  const { user } = useAuth();
  const { upload } = useApi();
  const { config } = useConfig();
  const bulkEnabled = config?.enable_bulk_upload !== false && config?._env?.enableBulkUpload !== false;
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');

  if (!['ADMIN', 'MANAGER'].includes(user?.role)) {
    return <Navigate to="/dashboard" replace />;
  }

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

  if (!bulkEnabled) {
    return (
      <AppShell>
        <div className="max-w-md mx-auto mt-12 bg-surface-container-lowest p-6 border border-outline-variant rounded-xl shadow-sm text-center">
          <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-2">lock</span>
          <p className="text-sm text-on-surface-variant">
            Bulk upload is disabled. Enable it in Settings (Admin).
          </p>
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
        <div>
          <h1 className="text-2xl font-bold text-on-background font-headline tracking-tight">Bulk Inventory Import</h1>
          <p className="text-xs text-on-surface-variant mt-1">Upload spreadsheet spreadsheets (.xlsx, .xls) to populate inventory.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {/* File Upload Target */}
          <div className="md:col-span-2 bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm space-y-5">
            <h2 className="font-headline font-bold text-base text-on-surface pb-2 border-b border-outline-variant/30">
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

            {/* Error Log Console */}
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

          {/* Template Details Panel */}
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
                  <p className="text-[10px] text-on-surface-variant">name, sku, category, purchasePrice, sellingPrice, quantity, unit, companyName, gstPercentage</p>
                </div>
              </div>
              <div className="flex gap-2 items-start border-t border-outline-variant/20 pt-2">
                <span className="material-symbols-outlined text-primary text-[18px]">info</span>
                <div>
                  <p className="font-semibold">Polymorphic Metadata Fields</p>
                  <p className="text-[10px] text-on-surface-variant leading-normal">
                    <strong>Krishi:</strong> batchNo, expiryDate<br />
                    <strong>Hardware:</strong> size, material
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

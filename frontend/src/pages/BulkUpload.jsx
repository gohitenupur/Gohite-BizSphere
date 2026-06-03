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
      setToast(`Uploaded ${res.successCount} products`);
    } catch (err) {
      setToast(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!bulkEnabled) {
    return (
      <AppShell>
        <p className="text-on-surface-variant">Bulk upload is disabled. Enable it in Settings (Admin).</p>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <Toast message={toast} type={toast.includes('Uploaded') ? 'success' : 'error'} onClose={() => setToast('')} />
      <div className="max-w-xl">
        <h2 className="font-semibold mb-2">Bulk Product Upload</h2>
        <p className="text-sm text-on-surface-variant mb-4">
          Excel columns: name, sku, category, purchasePrice, sellingPrice, quantity, unit, companyName, gstPercentage, plus metadata fields.
        </p>
        <form onSubmit={handleUpload} className="space-y-4">
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={(e) => setFile(e.target.files?.[0])}
            className="block w-full text-sm"
          />
          <button
            type="submit"
            disabled={!file || loading}
            className="h-10 px-6 bg-primary text-on-primary rounded-lg disabled:opacity-50"
          >
            {loading ? 'Uploading...' : 'Upload'}
          </button>
        </form>
        {result?.errors?.length > 0 && (
          <div className="mt-4 p-4 border border-error/30 rounded-lg bg-error-container/30">
            <p className="font-medium text-sm mb-2">Row errors ({result.errors.length})</p>
            <ul className="text-xs space-y-1 max-h-40 overflow-y-auto">
              {result.errors.map((err, i) => (
                <li key={i}>Row {err.row}: {err.error}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </AppShell>
  );
}

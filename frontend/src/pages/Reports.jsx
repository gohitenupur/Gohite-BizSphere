import { useEffect, useState } from 'react';
import AppShell from '../components/common/AppShell.jsx';
import Toast from '../components/common/Toast.jsx';
import { useApi } from '../hooks/useApi.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Navigate } from 'react-router-dom';

export default function Reports() {
  const { user } = useAuth();
  const { get } = useApi();
  const [summary, setSummary] = useState(null);
  const [sales, setSales] = useState([]);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ totalPages: 1 });
  const [toast, setToast] = useState('');

  if (!['ADMIN', 'MANAGER'].includes(user?.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  useEffect(() => {
    get('/api/reports/sales-summary')
      .then(setSummary)
      .catch((e) => setToast(e.message));
  }, [get]);

  useEffect(() => {
    get(`/api/reports/sales?page=${page}&pageSize=25`)
      .then((r) => { setSales(r.data); setMeta(r.meta); })
      .catch((e) => setToast(e.message));
  }, [get, page]);

  return (
    <AppShell>
      <Toast message={toast} onClose={() => setToast('')} />
      {summary && (
        <div className="grid sm:grid-cols-3 gap-4 mb-6">
          <div className="p-4 border rounded-xl bg-surface-container-lowest">
            <p className="text-xs text-on-surface-variant">Total Sales</p>
            <p className="text-2xl font-semibold text-primary">{summary.totalSales}</p>
          </div>
          <div className="p-4 border rounded-xl bg-surface-container-lowest">
            <p className="text-xs text-on-surface-variant">Revenue</p>
            <p className="text-2xl font-semibold">₹{summary.totalAmount?.toFixed(2)}</p>
          </div>
          <div className="p-4 border rounded-xl bg-surface-container-lowest">
            <p className="text-xs text-on-surface-variant">GST Collected</p>
            <p className="text-2xl font-semibold">₹{summary.totalGst?.toFixed(2)}</p>
          </div>
        </div>
      )}
      <div className="overflow-x-auto border rounded-xl">
        <table className="w-full text-sm dense-table">
          <thead>
            <tr className="text-left text-xs uppercase text-on-surface-variant border-b">
              <th className="p-2">Date</th>
              <th className="p-2">Customer</th>
              <th className="p-2">Payment</th>
              <th className="p-2">Total</th>
            </tr>
          </thead>
          <tbody>
            {sales.map((s) => (
              <tr key={s.id} className="border-b border-outline-variant/50">
                <td className="p-2">{new Date(s.createdAt).toLocaleString()}</td>
                <td className="p-2">{s.customerName}</td>
                <td className="p-2">{s.paymentType}</td>
                <td className="p-2">₹{s.totalAmount.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex justify-between mt-4 text-sm">
        <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
        <span>Page {page} of {meta.totalPages}</span>
        <button type="button" disabled={page >= meta.totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
      </div>
    </AppShell>
  );
}

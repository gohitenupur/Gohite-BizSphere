import { useEffect, useState } from 'react';
import AppShell from '../components/common/AppShell.jsx';
import Toast from '../components/common/Toast.jsx';
import { useApi } from '../hooks/useApi.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Navigate } from 'react-router-dom';
import { downloadPdf } from '../services/api.js';

export default function Reports() {
  const { user } = useAuth();
  const { get } = useApi();
  const [summary, setSummary] = useState(null);
  const [sales, setSales] = useState([]);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ totalPages: 1 });
  const [toast, setToast] = useState('');

  const [filterType, setFilterType] = useState('all');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  if (!['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(user?.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  const getQueryParams = () => {
    const params = {};
    const now = new Date();
    if (filterType === 'week') {
      const d = new Date();
      d.setDate(now.getDate() - 6);
      d.setHours(0, 0, 0, 0);
      params.from = d.toISOString();
    } else if (filterType === 'month') {
      const d = new Date();
      d.setDate(now.getDate() - 29);
      d.setHours(0, 0, 0, 0);
      params.from = d.toISOString();
    } else if (filterType === 'custom') {
      if (customFrom) {
        const d = new Date(customFrom);
        d.setHours(0, 0, 0, 0);
        params.from = d.toISOString();
      }
      if (customTo) {
        const d = new Date(customTo);
        d.setHours(23, 59, 59, 999);
        params.to = d.toISOString();
      }
    }
    return params;
  };

  const getRegisterLabel = () => {
    switch (filterType) {
      case 'week':
        return 'Weekly Register';
      case 'month':
        return 'Monthly Register';
      case 'custom':
        return 'Custom Range Register';
      default:
        return 'All-time Register';
    }
  };

  // Reset page to 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [filterType, customFrom, customTo]);

  useEffect(() => {
    const params = getQueryParams();
    const queryStr = new URLSearchParams(params).toString();
    get(`/api/reports/sales-summary?${queryStr}`)
      .then(setSummary)
      .catch((e) => setToast(e.message));
  }, [get, filterType, customFrom, customTo]);

  useEffect(() => {
    const params = getQueryParams();
    params.page = page;
    params.pageSize = 25;
    const queryStr = new URLSearchParams(params).toString();
    get(`/api/reports/sales?${queryStr}`)
      .then((r) => {
        setSales(r.data || []);
        setMeta(r.meta || { totalPages: 1 });
      })
      .catch((e) => setToast(e.message));
  }, [get, page, filterType, customFrom, customTo]);

  const handleExportExcel = () => {
    setToast('Excel export initiated...');
    const params = getQueryParams();
    const queryStr = new URLSearchParams(params).toString();
    downloadPdf(`/api/reports/sales-excel?${queryStr}`, 'sales-report.xlsx')
      .then(() => setToast('Excel report downloaded successfully!'))
      .catch((e) => setToast('Error exporting Excel: ' + e.message));
  };

  const handleExportPdf = () => {
    setToast('PDF report generation started...');
    const params = getQueryParams();
    const queryStr = new URLSearchParams(params).toString();
    downloadPdf(`/api/reports/sales-pdf?${queryStr}`, 'sales-report.pdf')
      .then(() => setToast('PDF report downloaded successfully!'))
      .catch((e) => setToast('Error exporting PDF: ' + e.message));
  };

  return (
    <AppShell>
      <Toast message={toast} onClose={() => setToast('')} />

      <div className="max-w-7xl mx-auto space-y-6 text-left">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-on-background font-headline tracking-tight">Reports &amp; Analytics</h1>
            <p className="text-xs text-on-surface-variant mt-1">Review sales transactions, margins, and financial records.</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-2 px-3 py-1.5 border border-outline-variant bg-surface rounded-lg text-xs font-semibold hover:bg-surface-container transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">file_download</span>
              Export Excel
            </button>
            <button
              onClick={handleExportPdf}
              className="flex items-center gap-2 px-3 py-1.5 bg-primary text-on-primary rounded-lg text-xs font-semibold hover:opacity-95 transition-opacity cursor-pointer shadow-sm"
            >
              <span className="material-symbols-outlined text-[16px]">picture_as_pdf</span>
              Export PDF
            </button>
          </div>
        </div>


        {/* Bento Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Total Invoices */}
            <div className="p-4 border border-outline-variant bg-surface-container-lowest rounded-xl shadow-sm flex flex-col justify-between h-28">
              <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Total Sales Invoices</span>
              <div className="flex justify-between items-end mt-2">
                <span className="text-2xl font-bold font-headline text-on-surface">{summary.totalSales}</span>
                <span className="material-symbols-outlined text-primary text-2xl">receipt</span>
              </div>
            </div>

            {/* Total Revenue */}
            <div className="p-4 border border-outline-variant bg-surface-container-lowest rounded-xl shadow-sm flex flex-col justify-between h-28">
              <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Total Revenue (Gross)</span>
              <div className="flex justify-between items-end mt-2">
                <span className="text-2xl font-bold font-headline text-primary">
                  ₹ {summary.totalAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="material-symbols-outlined text-primary text-2xl">payments</span>
              </div>
            </div>

            {/* GST Collected */}
            <div className="p-4 border border-outline-variant bg-surface-container-lowest rounded-xl shadow-sm flex flex-col justify-between h-28">
              <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">GST Collected</span>
              <div className="flex justify-between items-end mt-2">
                <span className="text-2xl font-bold font-headline text-on-surface">
                  ₹ {summary.totalGst?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="material-symbols-outlined text-primary text-2xl">percent</span>
              </div>
            </div>
          </div>
        )}

        {/* Transactions Table Container */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-outline-variant flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-container-lowest">
            <h2 className="text-sm font-bold font-headline">Sales Register Journal</h2>
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <div className="flex items-center gap-2 border border-outline-variant bg-surface rounded-lg px-2.5 py-1.5">
                <span className="material-symbols-outlined text-[16px] text-on-surface-variant">calendar_month</span>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="bg-transparent border-none text-xs font-semibold text-on-surface-variant focus:outline-none cursor-pointer pr-1"
                >
                  <option value="all">All-time Register</option>
                  <option value="week">Weekly Register</option>
                  <option value="month">Monthly Register</option>
                  <option value="custom">Custom Range</option>
                </select>
              </div>

              {filterType === 'custom' && (
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={customFrom}
                    onChange={(e) => setCustomFrom(e.target.value)}
                    className="px-2 py-1.5 border border-outline-variant bg-surface rounded-lg text-xs font-semibold text-on-surface-variant focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  />
                  <span className="text-on-surface-variant font-bold">to</span>
                  <input
                    type="date"
                    value={customTo}
                    onChange={(e) => setCustomTo(e.target.value)}
                    className="px-2 py-1.5 border border-outline-variant bg-surface rounded-lg text-xs font-semibold text-on-surface-variant focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm dense-table border-collapse">
              <thead className="bg-surface-container-low text-on-surface-variant font-medium border-b border-outline-variant">
                <tr>
                  <th className="px-4 py-3">Transaction Date</th>
                  <th className="px-4 py-3">Customer Name</th>
                  <th className="px-4 py-3">Payment Type</th>
                  <th className="px-4 py-3 text-right">Invoice Amount</th>
                </tr>
              </thead>
              <tbody className="text-on-surface font-medium divide-y divide-outline-variant/30">
                {sales.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-4 text-center text-xs text-on-surface-variant">
                      No transactions recorded.
                    </td>
                  </tr>
                ) : (
                  sales.map((s) => (
                    <tr key={s.id} className="hover:bg-surface-container-low/30 transition-colors h-8">
                      <td className="px-4 py-2 text-xs text-on-surface-variant">
                        {new Date(s.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-2 text-xs font-bold">{s.customerName}</td>
                      <td className="px-4 py-2 text-xs">
                        <span className="px-2 py-0.5 rounded bg-surface-container-high text-[10px] uppercase font-bold">
                          {s.paymentType}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-xs text-right text-primary font-bold">
                        ₹ {s.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
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
              Page {page} of {meta.totalPages}
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
    </AppShell>
  );
}

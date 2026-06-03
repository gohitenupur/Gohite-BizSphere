import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppShell from '../components/common/AppShell.jsx';
import { useBusiness } from '../context/BusinessContext.jsx';
import { useApi } from '../hooks/useApi.js';

export default function Dashboard() {
  const { business } = useBusiness();
  const { get } = useApi();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    productsCount: 0,
    lowStock: 0,
    expiring: 0,
    stockValue: 0,
    totalSales: 0,
  });
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [expiringProducts, setExpiringProducts] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        // Fetch products
        const productsRes = await get('/api/products?pageSize=100');
        const prodList = productsRes.data || [];
        const low = prodList.filter((p) => p.quantity <= p.minStock).length;
        const totalValue = prodList.reduce((acc, p) => acc + p.quantity * p.purchasePrice, 0);

        setProducts(prodList);

        // Fetch sales
        const salesRes = await get('/api/sales?pageSize=100');
        const salesList = salesRes.data || [];
        const totalSalesAmount = salesList.reduce((acc, s) => acc + s.totalAmount, 0);
        setSales(salesList);

        // Fetch expiring
        let expiringCount = 0;
        let expiringList = [];
        if (business?.type === 'KRISHI') {
          const expRes = await get('/api/products/alerts/expiring');
          expiringList = expRes.data || [];
          expiringCount = expRes.meta?.count ?? expiringList.length ?? 0;
          setExpiringProducts(expiringList);
        }

        setStats({
          productsCount: productsRes.meta?.total ?? prodList.length,
          lowStock: low,
          expiring: expiringCount,
          stockValue: totalValue,
          totalSales: totalSalesAmount,
        });
      } catch (e) {
        setError(e.message);
      }
    };
    load();
  }, [get, business?.type]);

  const isKrishi = business?.type === 'KRISHI';

  // Compute last 7 days sales for chart
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().split('T')[0];
  }).reverse();

  const salesByDay = last7Days.map((day) => {
    const daySales = sales.filter((s) => s.createdAt.startsWith(day));
    const total = daySales.reduce((acc, s) => acc + s.totalAmount, 0);
    return { day, total };
  });

  const maxSale = Math.max(...salesByDay.map((d) => d.total), 1);

  // Get recent stock movements
  const recentMovements = [...products]
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .slice(0, 4);

  return (
    <AppShell>
      {error && <p className="text-error mb-4 text-center">{error}</p>}

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Metrics Bento Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Sales */}
          <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant shadow-sm flex flex-col justify-between h-32">
            <div className="flex justify-between items-start">
              <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Total Sales</span>
              <div className="w-8 h-8 rounded bg-primary-container/30 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-[20px]">currency_rupee</span>
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold font-headline text-on-surface">
                ₹ {stats.totalSales.toLocaleString('en-IN')}
              </div>
              <div className="text-xs text-[#146c2e] mt-1 flex items-center gap-0.5">
                <span className="material-symbols-outlined text-[14px]">trending_up</span>
                Active billing
              </div>
            </div>
          </div>

          {/* Stock Value */}
          <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant shadow-sm flex flex-col justify-between h-32">
            <div className="flex justify-between items-start">
              <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Est. Stock Value</span>
              <div className="w-8 h-8 rounded bg-primary-container/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-[20px]">inventory</span>
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold font-headline text-on-surface">
                ₹ {stats.stockValue.toLocaleString('en-IN')}
              </div>
              <div className="text-xs text-on-surface-variant mt-1">Across {stats.productsCount} items</div>
            </div>
          </div>

          {/* Low Stock Alerts */}
          <div 
            onClick={() => navigate('/inventory')}
            className="bg-error-container/10 p-4 rounded-xl border border-error/20 shadow-sm flex flex-col justify-between h-32 cursor-pointer hover:bg-error-container/20 transition-colors"
          >
            <div className="flex justify-between items-start">
              <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Low Stock Alerts</span>
              <div className="w-8 h-8 rounded bg-error-container flex items-center justify-center">
                <span className="material-symbols-outlined text-on-error-container text-[20px]">warning</span>
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold font-headline text-on-error-container">
                {stats.lowStock} Items
              </div>
              <div className="text-xs text-primary mt-1 hover:underline">View list →</div>
            </div>
          </div>

          {/* Business Unit Context */}
          {isKrishi ? (
            <div className="bg-tertiary-container/20 p-4 rounded-xl border border-tertiary/20 shadow-sm flex flex-col justify-between h-32">
              <div className="flex justify-between items-start">
                <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Expiring &lt; 30 Days</span>
                <div className="w-8 h-8 rounded bg-tertiary-container flex items-center justify-center">
                  <span className="material-symbols-outlined text-on-tertiary-container text-[20px]">event_busy</span>
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold font-headline text-on-tertiary-container">
                  {stats.expiring} Batches
                </div>
                <div className="text-xs text-primary mt-1 hover:underline">Review batches</div>
              </div>
            </div>
          ) : (
            <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant shadow-sm flex flex-col justify-between h-32">
              <div className="flex justify-between items-start">
                <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Business Segment</span>
                <div className="w-8 h-8 rounded bg-primary-container/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-[20px]">construction</span>
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold font-headline text-on-surface">Hardware</div>
                <div className="text-xs text-on-surface-variant mt-1">Tools &amp; Plumbing</div>
              </div>
            </div>
          )}
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Chart & Recent Updates */}
          <div className="lg:col-span-2 space-y-6">
            {/* Sales Trend Chart */}
            <div className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant shadow-sm h-72 flex flex-col">
              <h2 className="text-sm font-bold font-headline mb-4 text-left">Sales Trend (7 Days)</h2>
              <div className="flex-1 relative border-b border-l border-outline-variant/30 flex items-end justify-between px-6 pb-2">
                {salesByDay.map((d, idx) => {
                  const heightPercent = maxSale > 1 ? Math.min(100, Math.max(10, (d.total / maxSale) * 100)) : 10;
                  return (
                    <div
                      key={idx}
                      className="w-1/12 bg-primary/20 hover:bg-primary/40 rounded-t-sm transition-colors cursor-pointer group relative flex flex-col justify-end"
                      style={{ height: `${heightPercent}%` }}
                    >
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-inverse-surface text-inverse-on-surface text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-10 transition-opacity">
                        ₹ {d.total.toFixed(0)}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between px-6 mt-2 text-[10px] text-on-surface-variant font-medium">
                {salesByDay.map((d, idx) => {
                  const label = new Date(d.day).toLocaleDateString('en-US', { weekday: 'short' });
                  return <span key={idx} className="w-1/12 text-center">{label}</span>;
                })}
              </div>
            </div>

            {/* Recent Stock Movements Table */}
            <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden flex flex-col">
              <div className="p-4 border-b border-outline-variant flex justify-between items-center bg-surface-container-lowest">
                <h2 className="text-sm font-bold font-headline">Recent Stock Updates</h2>
                <button onClick={() => navigate('/inventory')} className="text-xs text-primary font-medium hover:underline">
                  View Inventory
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm dense-table">
                  <thead className="bg-surface-container-low text-on-surface-variant text-xs uppercase font-semibold border-b border-outline-variant">
                    <tr>
                      <th className="p-2">SKU</th>
                      <th className="p-2">Product Name</th>
                      <th className="p-2">Type</th>
                      <th className="p-2">Qty</th>
                      <th className="p-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="text-on-surface font-medium divide-y divide-outline-variant/30">
                    {recentMovements.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-4 text-center text-xs text-on-surface-variant">
                          No recent inventory updates.
                        </td>
                      </tr>
                    ) : (
                      recentMovements.map((p) => (
                        <tr key={p.id} className="h-9 hover:bg-surface-container-low/30 transition-colors">
                          <td className="p-2 text-on-surface-variant text-xs">{p.sku}</td>
                          <td className="p-2 text-xs">{p.name}</td>
                          <td className="p-2">
                            <span className="px-2 py-0.5 rounded bg-surface-container-high text-[10px]">
                              Update
                            </span>
                          </td>
                          <td className={`p-2 text-xs ${p.quantity === 0 ? 'text-error' : 'text-primary'}`}>
                            {p.quantity} {p.unit}
                          </td>
                          <td className="p-2">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                p.quantity <= p.minStock
                                  ? 'bg-error-container/20 text-on-error-container'
                                  : 'bg-[#146c2e]/10 text-[#146c2e]'
                              }`}
                            >
                              {p.quantity <= p.minStock ? 'Low Stock' : 'Active'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Column: Expiry Alerts & Quick Actions */}
          <div className="space-y-6">
            {/* Expiry Alerts (Agricultural specifics) */}
            {isKrishi && (
              <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm flex flex-col h-[320px]">
                <div className="p-4 border-b border-outline-variant bg-tertiary-container/10 flex items-center gap-2">
                  <span className="material-symbols-outlined text-on-tertiary-container text-[20px]">timer</span>
                  <h2 className="text-sm font-bold font-headline text-on-surface">Expiry Alerts</h2>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-2 text-left">
                  {expiringProducts.length === 0 ? (
                    <p className="text-xs text-on-surface-variant text-center pt-8">No expiring batches found.</p>
                  ) : (
                    expiringProducts.slice(0, 3).map((p) => (
                      <div key={p.id} className="p-3 border border-tertiary/30 bg-tertiary-container/10 rounded-lg">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-bold text-xs">{p.name}</span>
                          <span className="text-[10px] font-bold text-on-tertiary-container bg-tertiary-container px-1.5 py-0.5 rounded">
                            {p.metadata?.expiryDate || 'Soon'}
                          </span>
                        </div>
                        <div className="text-[11px] text-on-surface-variant flex justify-between">
                          <span>Batch: {p.metadata?.batchNo || 'N/A'}</span>
                          <span>Qty: {p.quantity} {p.unit}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant shadow-sm text-left">
              <h2 className="text-sm font-bold font-headline mb-3">Quick Actions</h2>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => navigate('/pos')}
                  className="flex flex-col items-center justify-center p-3 border border-outline-variant rounded-lg hover:bg-primary-container/20 hover:border-primary transition-colors group cursor-pointer"
                >
                  <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary mb-1 text-2xl">
                    add_shopping_cart
                  </span>
                  <span className="text-xs font-semibold">New Sale</span>
                </button>
                <button
                  onClick={() => navigate('/inventory')}
                  className="flex flex-col items-center justify-center p-3 border border-outline-variant rounded-lg hover:bg-primary-container/20 hover:border-primary transition-colors group cursor-pointer"
                >
                  <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary mb-1 text-2xl">
                    inventory_2
                  </span>
                  <span className="text-xs font-semibold">Receive Stock</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

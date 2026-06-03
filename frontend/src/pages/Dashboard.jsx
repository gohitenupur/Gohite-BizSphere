import { useEffect, useState } from 'react';
import AppShell from '../components/common/AppShell.jsx';
import { useBusiness } from '../context/BusinessContext.jsx';
import { useApi } from '../hooks/useApi.js';

export default function Dashboard() {
  const { business } = useBusiness();
  const { get } = useApi();
  const [stats, setStats] = useState({ products: 0, lowStock: 0, expiring: 0 });
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const products = await get('/api/products?pageSize=100');
        const low = products.data.filter((p) => p.quantity <= p.minStock).length;
        let expiring = 0;
        if (business?.type === 'KRISHI') {
          const exp = await get('/api/products/alerts/expiring');
          expiring = exp.meta?.count ?? exp.data?.length ?? 0;
        }
        setStats({ products: products.meta.total, lowStock: low, expiring });
      } catch (e) {
        setError(e.message);
      }
    };
    load();
  }, [get, business?.type]);

  return (
    <AppShell>
      {error && <p className="text-error mb-4">{error}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard title="Total Products" value={stats.products} icon="inventory_2" />
        <MetricCard title="Low Stock" value={stats.lowStock} icon="warning" warn />
        {business?.type === 'KRISHI' && (
          <MetricCard title="Expiring Soon" value={stats.expiring} icon="schedule" warn />
        )}
        <MetricCard title="Business" value={business?.type} icon="store" />
      </div>
      <p className="text-sm text-on-surface-variant">
        Welcome to {business?.name}. Use the sidebar to manage inventory, POS, and reports.
      </p>
    </AppShell>
  );
}

function MetricCard({ title, value, icon, warn }) {
  return (
    <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-4">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-xs text-on-surface-variant uppercase tracking-wide">{title}</p>
          <p className={`text-2xl font-semibold mt-1 ${warn ? 'text-amber-700' : 'text-primary'}`}>
            {value}
          </p>
        </div>
        <span className={`material-symbols-outlined text-2xl ${warn ? 'text-amber-600' : 'text-primary'}`}>
          {icon}
        </span>
      </div>
    </div>
  );
}

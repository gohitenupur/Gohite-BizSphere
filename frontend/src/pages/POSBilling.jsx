import { useEffect, useState } from 'react';
import AppShell from '../components/common/AppShell.jsx';
import Toast from '../components/common/Toast.jsx';
import { useApi } from '../hooks/useApi.js';
import { useConfig } from '../context/ConfigContext.jsx';
import { downloadPdf } from '../services/api.js';

export default function POSBilling() {
  const { get, post } = useApi();
  const { config } = useConfig();
  const paymentTypes = config?.allowed_payment_types || ['CASH', 'UPI', 'CARD', 'CREDIT'];
  const posEnabled = config?.enable_pos !== false;
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState('Cash Customer');
  const [paymentType, setPaymentType] = useState('CASH');
  const [toast, setToast] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = new URLSearchParams({ pageSize: 50, search });
    get(`/api/products?${q}`).then((r) => setProducts(r.data));
  }, [get, search]);

  const addToCart = (p) => {
    setCart((c) => {
      const existing = c.find((x) => x.productId === p.id);
      if (existing) {
        return c.map((x) => (x.productId === p.id ? { ...x, quantity: x.quantity + 1 } : x));
      }
      return [...c, { productId: p.id, name: p.name, price: p.sellingPrice, quantity: 1 }];
    });
  };

  const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);

  const checkout = async () => {
    if (!cart.length) return;
    setLoading(true);
    setToast('');
    try {
      const result = await post('/api/sales', {
        customerName,
        paymentType,
        items: cart.map((i) => ({ productId: i.productId, quantity: i.quantity, price: i.price })),
      });
      setCart([]);
      setToast(`Sale complete: ${result.sale.id.slice(0, 8)}`);
      await downloadPdf(`/api/sales/${result.sale.id}/pdf`, `invoice-${result.sale.id.slice(0, 8)}.pdf`);
    } catch (e) {
      setToast(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (!posEnabled) {
    return (
      <AppShell>
        <p className="text-on-surface-variant">POS is disabled for this business. Enable it in Settings (Admin).</p>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <Toast message={toast} type={toast.includes('complete') ? 'success' : 'error'} onClose={() => setToast('')} />
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-3">
          <input
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 px-3 border border-outline-variant rounded-lg"
          />
          <div className="grid sm:grid-cols-2 gap-2 max-h-[60vh] overflow-y-auto">
            {products.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => addToCart(p)}
                disabled={p.quantity < 1}
                className="text-left p-3 border border-outline-variant rounded-lg hover:border-primary disabled:opacity-40"
              >
                <p className="font-medium text-sm">{p.name}</p>
                <p className="text-xs text-on-surface-variant">₹{p.sellingPrice} · Stock: {p.quantity}</p>
              </button>
            ))}
          </div>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 lg:sticky lg:top-4 h-fit">
          <h2 className="font-semibold mb-3">Cart</h2>
          <input
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="w-full h-9 px-2 border rounded mb-2 text-sm"
            placeholder="Customer"
          />
          <select value={paymentType} onChange={(e) => setPaymentType(e.target.value)} className="w-full h-9 px-2 border rounded mb-3 text-sm">
            {paymentTypes.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <ul className="space-y-2 mb-3 max-h-48 overflow-y-auto text-sm">
            {cart.map((i) => (
              <li key={i.productId} className="flex justify-between">
                <span>{i.name} x{i.quantity}</span>
                <span>₹{(i.price * i.quantity).toFixed(2)}</span>
              </li>
            ))}
          </ul>
          <p className="font-semibold mb-3">Total: ₹{total.toFixed(2)}</p>
          <button
            type="button"
            onClick={checkout}
            disabled={loading || !cart.length}
            className="w-full h-10 bg-primary text-on-primary rounded-lg font-medium disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Complete Sale'}
          </button>
        </div>
      </div>
    </AppShell>
  );
}

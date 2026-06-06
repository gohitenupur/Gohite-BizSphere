import { useEffect, useState } from 'react';
import AppShell from '../components/common/AppShell.jsx';
import Toast from '../components/common/Toast.jsx';
import { useApi } from '../hooks/useApi.js';
import { useConfig } from '../context/ConfigContext.jsx';
import { downloadPdf } from '../services/api.js';
import CustomFieldsForm from '../components/common/CustomFieldsForm.jsx';

export default function POSBilling() {
  const { get, post } = useApi();
  const { config } = useConfig();
  const paymentTypes = config?.allowed_payment_types || ['CASH', 'UPI', 'CARD', 'CREDIT'];
  const customSaleFields = config?.custom_sale_fields || [];
  const posEnabled = config?.enable_pos !== false;
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageMeta, setPageMeta] = useState({ page: 1, totalPages: 1 });
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState('Cash Customer');
  const [paymentType, setPaymentType] = useState('CASH');
  const [metadata, setMetadata] = useState({});
  const [toast, setToast] = useState('');
  const [loading, setLoading] = useState(false);

  const setMeta = (key, val) => {
    setMetadata((m) => ({
      ...m,
      [key]: val,
    }));
  };

  useEffect(() => {
    const q = new URLSearchParams({ page, pageSize: 20, search });
    get(`/api/products?${q}`).then((r) => {
      setProducts(r.data || []);
      setPageMeta(r.meta || { page: 1, totalPages: 1 });
    });
  }, [get, page, search]);

  const addToCart = (p) => {
    setCart((c) => {
      const existing = c.find((x) => x.productId === p.id);
      if (existing) {
        return c.map((x) => (x.productId === p.id ? { ...x, quantity: x.quantity + 1 } : x));
      }
      return [...c, { productId: p.id, name: p.name, price: p.sellingPrice, quantity: 1 }];
    });
  };

  const removeFromCart = (productId) => {
    setCart((c) => c.filter((x) => x.productId !== productId));
  };

  const updateCartQty = (productId, delta) => {
    setCart((c) =>
      c
        .map((x) => {
          if (x.productId === productId) {
            const newQty = x.quantity + delta;
            return newQty > 0 ? { ...x, quantity: newQty } : null;
          }
          return x;
        })
        .filter(Boolean)
    );
  };

  const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);

  const checkout = async () => {
    if (!cart.length) return;
    setLoading(true);
    setToast('');
    try {
      const filteredMeta = {};
      Object.entries(metadata).forEach(([k, v]) => {
        if (v !== undefined && v !== null && String(v).trim() !== '') {
          filteredMeta[k] = typeof v === 'boolean' ? v : String(v).trim();
        }
      });

      const result = await post('/api/sales', {
        customerName,
        paymentType,
        items: cart.map((i) => ({ productId: i.productId, quantity: i.quantity, price: i.price })),
        metadata: filteredMeta,
      });
      setCart([]);
      setMetadata({});
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
        <div className="max-w-md mx-auto mt-12 bg-surface-container-lowest p-6 border border-outline-variant rounded-xl shadow-sm text-center">
          <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-2">lock</span>
          <p className="text-sm text-on-surface-variant">
            POS is disabled for this business. Enable it in Settings (Admin).
          </p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <Toast
        message={toast}
        type={toast.includes('complete') ? 'success' : 'error'}
        onClose={() => setToast('')}
      />

      <div className="max-w-7xl mx-auto space-y-6 text-left">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-on-background font-headline tracking-tight">Point of Sale (POS)</h1>
          <p className="text-xs text-on-surface-variant mt-1">Create sales invoices and handle client billing registers.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Products Panel */}
          <div className="lg:col-span-2 space-y-4">
            {/* Search Input */}
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
                search
              </span>
              <input
                placeholder="Search products by name or SKU..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-10 pr-4 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary h-11 shadow-sm"
              />
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[64vh] overflow-y-auto pr-1">
              {products.length === 0 ? (
                <div className="col-span-2 text-center py-12 text-xs text-on-surface-variant bg-surface-container-lowest border border-outline-variant rounded-xl">
                  No products found.
                </div>
              ) : (
                products.map((p) => {
                  const isOutOfStock = p.quantity < 1;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => addToCart(p)}
                      disabled={isOutOfStock}
                      className="group flex flex-col justify-between text-left p-4 border border-outline-variant bg-surface-container-lowest rounded-xl hover:border-primary transition-all hover:shadow-md cursor-pointer disabled:opacity-40 disabled:hover:shadow-none disabled:cursor-not-allowed"
                    >
                      <div>
                        <div className="flex justify-between items-start gap-2">
                          <p className="font-bold text-sm text-on-surface leading-tight group-hover:text-primary transition-colors">
                            {p.name}
                          </p>
                          <span className="text-[10px] text-on-surface-variant border border-outline-variant/30 px-1.5 py-0.5 rounded bg-surface">
                            {p.sku}
                          </span>
                        </div>
                        <p className="text-xs text-on-surface-variant mt-2 font-medium">
                          {p.category?.name || 'General'}
                        </p>
                      </div>

                      <div className="flex justify-between items-end mt-4 pt-3 border-t border-outline-variant/20">
                        <span className="text-base font-bold text-primary">₹ {p.sellingPrice.toFixed(2)}</span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            isOutOfStock
                              ? 'bg-error-container/20 text-on-error-container'
                              : 'bg-primary-container/20 text-primary'
                          }`}
                        >
                          {isOutOfStock ? 'Out of Stock' : `Qty: ${p.quantity}`}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Pagination Controls */}
            {pageMeta.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 bg-surface-container-low border border-outline-variant rounded-xl text-xs font-semibold shadow-sm">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="px-3 py-1.5 border border-outline-variant bg-surface rounded hover:bg-surface-container transition-colors disabled:opacity-40 cursor-pointer"
                >
                  Previous
                </button>
                <span className="text-on-surface-variant">
                  Page {pageMeta.page} of {pageMeta.totalPages}
                </span>
                <button
                  type="button"
                  disabled={page >= pageMeta.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1.5 border border-outline-variant bg-surface rounded hover:bg-surface-container transition-colors disabled:opacity-40 cursor-pointer"
                >
                  Next
                </button>
              </div>
            )}
          </div>

          {/* Cart Sidebar Panel */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm lg:sticky lg:top-20 space-y-4">
            <h2 className="font-headline font-bold text-base text-on-surface pb-3 border-b border-outline-variant/30 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">shopping_cart</span>
              Checkout Cart
            </h2>

            {/* Customer & Payment Form */}
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-on-surface-variant">Customer Name</label>
                <input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full h-10 px-3 border border-outline-variant rounded-lg bg-surface focus:ring-2 focus:ring-primary outline-none text-xs font-semibold"
                  placeholder="Walk-in Customer"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-on-surface-variant">Payment Method</label>
                <select
                  value={paymentType}
                  onChange={(e) => setPaymentType(e.target.value)}
                  className="w-full h-10 px-2 border border-outline-variant rounded-lg bg-surface focus:ring-2 focus:ring-primary outline-none text-xs font-semibold"
                >
                  {paymentTypes.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              {customSaleFields.length > 0 && (
                <div className="pt-3 border-t border-outline-variant/20 space-y-2">
                  <p className="text-[10px] font-bold text-primary uppercase tracking-wider">Additional Details</p>
                  <CustomFieldsForm fields={customSaleFields} values={metadata} onChange={setMeta} />
                </div>
              )}
            </div>

            {/* Cart Items List */}
            <div className="space-y-2 max-h-[30vh] overflow-y-auto pr-1">
              {cart.length === 0 ? (
                <div className="text-center py-8 text-xs text-on-surface-variant">Cart is empty. Select items.</div>
              ) : (
                cart.map((i) => (
                  <div
                    key={i.productId}
                    className="flex justify-between items-center gap-2 p-2 border border-outline-variant/30 rounded-lg bg-surface-container-low/20"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-xs text-on-surface truncate">{i.name}</p>
                      <p className="text-[10px] text-on-surface-variant mt-0.5">₹ {i.price.toFixed(2)}</p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => updateCartQty(i.productId, -1)}
                        className="w-6 h-6 border border-outline-variant bg-surface rounded flex items-center justify-center hover:bg-surface-container text-xs cursor-pointer"
                      >
                        -
                      </button>
                      <span className="text-xs font-bold w-4 text-center">{i.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateCartQty(i.productId, 1)}
                        className="w-6 h-6 border border-outline-variant bg-surface rounded flex items-center justify-center hover:bg-surface-container text-xs cursor-pointer"
                      >
                        +
                      </button>
                      <button
                        type="button"
                        onClick={() => removeFromCart(i.productId)}
                        className="w-6 h-6 border border-transparent text-error hover:bg-error-container/20 rounded flex items-center justify-center cursor-pointer ml-1"
                      >
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Totals & Submit */}
            <div className="border-t border-outline-variant/30 pt-4 space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-on-surface-variant font-medium">Subtotal</span>
                <span className="font-bold text-on-surface">₹ {total.toFixed(2)}</span>
              </div>

              <div className="flex justify-between items-center text-base font-black border-t border-outline-variant/20 pt-2">
                <span>Total Due</span>
                <span className="text-primary">₹ {total.toFixed(2)}</span>
              </div>

              <button
                type="button"
                onClick={checkout}
                disabled={loading || !cart.length}
                className="w-full h-11 bg-primary text-on-primary rounded-lg text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex items-center justify-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">receipt_long</span>
                {loading ? 'Processing Billing...' : 'Complete & Print Invoice'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

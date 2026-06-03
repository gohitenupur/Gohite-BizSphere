const styles = {
  inStock: 'bg-green-100 text-green-800',
  lowStock: 'bg-amber-100 text-amber-800',
  expiring: 'bg-red-100 text-red-800',
  default: 'bg-surface-variant text-on-surface',
};

export default function StatusBadge({ status, label }) {
  const key = status?.toLowerCase?.().replace(/\s/g, '') || 'default';
  const cls = styles[key] || styles.default;
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {label || status}
    </span>
  );
}

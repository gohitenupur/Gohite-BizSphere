export default function Toast({ message, type = 'error', onClose }) {
  if (!message) return null;
  const bg = type === 'success' ? 'bg-green-600' : 'bg-error';
  return (
    <div className={`fixed bottom-4 right-4 z-50 px-4 py-3 rounded-lg text-white shadow-lg ${bg} flex items-center gap-2`}>
      <span>{message}</span>
      {onClose && (
        <button type="button" onClick={onClose} className="ml-2 opacity-80 hover:opacity-100">
          ×
        </button>
      )}
    </div>
  );
}

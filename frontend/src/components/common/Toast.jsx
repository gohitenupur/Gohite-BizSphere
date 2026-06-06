export default function Toast({ message, type, onClose }) {
  if (!message) return null;

  // Auto-detect type if not explicitly provided
  let resolvedType = type;
  if (!resolvedType) {
    const msg = message.toLowerCase();
    if (
      msg.includes('error') ||
      msg.includes('fail') ||
      msg.includes('require') ||
      msg.includes('exist') ||
      msg.includes('invalid') ||
      msg.includes('missing') ||
      msg.includes('denied')
    ) {
      resolvedType = 'error';
    } else if (
      msg.includes('success') ||
      msg.includes('save') ||
      msg.includes('complete') ||
      msg.includes('add') ||
      msg.includes('remove') ||
      msg.includes('create') ||
      msg.includes('update')
    ) {
      resolvedType = 'success';
    } else {
      resolvedType = 'info';
    }
  }

  let bg = 'bg-slate-800';
  let icon = 'info';

  if (resolvedType === 'success') {
    bg = 'bg-emerald-600';
    icon = 'check_circle';
  } else if (resolvedType === 'error') {
    bg = 'bg-rose-600';
    icon = 'error';
  } else if (resolvedType === 'warning') {
    bg = 'bg-amber-500';
    icon = 'warning';
  } else {
    // info
    bg = 'bg-sky-600';
    icon = 'info';
  }

  return (
    <div className={`fixed bottom-4 right-4 z-50 px-4 py-3 rounded-lg text-white shadow-lg ${bg} flex items-center gap-2 animate-fade-in`}>
      <span className="material-symbols-outlined text-[20px] shrink-0">{icon}</span>
      <span className="text-sm font-medium">{message}</span>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="ml-2 p-0.5 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
          aria-label="Close notification"
        >
          <span className="material-symbols-outlined text-[18px] block">close</span>
        </button>
      )}
    </div>
  );
}


import { useState } from 'react';
import ImagePreviewModal from './ImagePreviewModal.jsx';

export default function CustomFieldsForm({ fields = [], values = {}, onChange }) {
  const [previewSrc, setPreviewSrc] = useState('');
  const [previewTitle, setPreviewTitle] = useState('');

  if (!fields || !fields.length) return null;

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {fields.map((cf) => {
        const value = values[cf.key] ?? '';

        if (cf.type === 'toggle') {
          return (
            <div key={cf.key} className="flex items-center gap-2 h-10 pt-4">
              <input
                id={`custom-field-${cf.key}`}
                type="checkbox"
                checked={!!values[cf.key]}
                onChange={(e) => onChange(cf.key, e.target.checked)}
                className="rounded border-outline-variant text-primary focus:ring-primary h-4 w-4 bg-surface cursor-pointer"
              />
              <label htmlFor={`custom-field-${cf.key}`} className="text-xs text-on-surface font-semibold cursor-pointer select-none">
                {cf.label}
              </label>
            </div>
          );
        }

        if (cf.type === 'select') {
          return (
            <div key={cf.key} className="space-y-1">
              <label className="block text-[11px] font-semibold text-on-surface-variant">{cf.label}</label>
              <select
                value={value}
                onChange={(e) => onChange(cf.key, e.target.value)}
                className="h-10 w-full px-2 border border-outline-variant rounded-lg bg-surface focus:ring-2 focus:ring-primary focus:border-primary outline-none text-xs"
              >
                <option value="">Select Option</option>
                {cf.options?.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          );
        }

        if (cf.type === 'textarea') {
          return (
            <div key={cf.key} className="space-y-1 sm:col-span-2">
              <label className="block text-[11px] font-semibold text-on-surface-variant">{cf.label}</label>
              <textarea
                placeholder={`Enter ${cf.label.toLowerCase()}`}
                value={value}
                onChange={(e) => onChange(cf.key, e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-outline-variant rounded-lg bg-surface focus:ring-2 focus:ring-primary focus:border-primary outline-none text-xs"
              />
            </div>
          );
        }

        if (cf.type === 'date') {
          return (
            <div key={cf.key} className="space-y-1">
              <label className="block text-[11px] font-semibold text-on-surface-variant">{cf.label}</label>
              <input
                type="date"
                value={value}
                onChange={(e) => onChange(cf.key, e.target.value)}
                className="h-10 w-full px-3 border border-outline-variant rounded-lg bg-surface focus:ring-2 focus:ring-primary focus:border-primary outline-none text-xs"
              />
            </div>
          );
        }

        if (cf.type === 'multiselect') {
          const list = Array.isArray(value) ? value : [];
          return (
            <div key={cf.key} className="space-y-1">
              <label className="block text-[11px] font-semibold text-on-surface-variant">{cf.label}</label>
              <div className="space-y-2">
                <select
                  value=""
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val && !list.includes(val)) {
                      onChange(cf.key, [...list, val]);
                    }
                  }}
                  className="h-10 w-full px-2 border border-outline-variant rounded-lg bg-surface focus:ring-2 focus:ring-primary focus:border-primary outline-none text-xs"
                >
                  <option value="">Select Option(s)</option>
                  {cf.options?.map((opt) => (
                    <option key={opt} value={opt} disabled={list.includes(opt)}>
                      {opt}
                    </option>
                  ))}
                </select>
                <div className="flex flex-wrap gap-1">
                  {list.map((item, idx) => (
                    <span
                      key={item}
                      className="inline-flex items-center gap-1 text-[9px] bg-surface-container-high border border-outline-variant/30 text-on-surface-variant pl-2 pr-1 py-0.5 rounded-full"
                    >
                      {item}
                      <button
                        type="button"
                        onClick={() => onChange(cf.key, list.filter((_, i) => i !== idx))}
                        className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-outline-variant/30 text-on-surface-variant/70"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          );
        }

        if (cf.type === 'file') {
          const isPdf = typeof value === 'string' && value.startsWith('data:application/pdf');
          const isImage = typeof value === 'string' && value.startsWith('data:image/');
          return (
            <div key={cf.key} className="space-y-1 sm:col-span-2 border border-outline-variant/30 rounded-xl p-3 bg-surface-container-low/20">
              <label className="block text-[11px] font-semibold text-on-surface-variant mb-1">{cf.label}</label>
              <div className="flex items-center gap-3">
                {value ? (
                  <div className="flex items-center gap-3 bg-surface border border-outline-variant rounded-lg p-2 flex-1 min-w-0">
                    {isImage ? (
                      <img
                        src={value}
                        alt="Preview"
                        className="w-12 h-12 rounded object-cover shrink-0 border border-outline-variant/30 cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => {
                          setPreviewSrc(value);
                          setPreviewTitle(cf.label);
                        }}
                      />
                    ) : (
                      <div className="w-12 h-12 rounded bg-surface-container-high flex items-center justify-center border border-outline-variant/30 shrink-0 text-on-surface-variant/70">
                        <span className="material-symbols-outlined text-2xl">{isPdf ? 'picture_as_pdf' : 'draft'}</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-[10px] font-bold text-on-surface truncate">File Attachment Saved</p>
                      <button
                        type="button"
                        onClick={() => {
                          setPreviewSrc(value);
                          setPreviewTitle(cf.label);
                        }}
                        className="text-[9px] text-primary hover:underline font-semibold block mt-0.5 cursor-pointer bg-transparent border-none p-0"
                      >
                        Click to view file preview
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => onChange(cf.key, '')}
                      className="text-error hover:bg-error-container/20 rounded p-1"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                ) : (
                  <div className="relative flex items-center justify-center border-2 border-dashed border-outline-variant hover:border-primary/50 rounded-lg p-3 bg-surface-container-low transition-colors w-full text-center min-h-[60px] cursor-pointer">
                    <div className="flex items-center justify-center gap-2 text-on-surface-variant/60">
                      <span className="material-symbols-outlined text-[20px]">upload_file</span>
                      <span className="text-xs font-semibold">Upload Image or PDF</span>
                    </div>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            onChange(cf.key, reader.result);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                  </div>
                )}
              </div>
            </div>
          );
        }

        return (
          <div key={cf.key} className="space-y-1">
            <label className="block text-[11px] font-semibold text-on-surface-variant">{cf.label}</label>
            <input
              type={cf.type === 'number' ? 'number' : 'text'}
              placeholder={`Enter ${cf.label.toLowerCase()}`}
              value={value}
              onChange={(e) =>
                onChange(
                  cf.key,
                  cf.type === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value
                )
              }
              className="h-10 w-full px-3 border border-outline-variant rounded-lg bg-surface focus:ring-2 focus:ring-primary focus:border-primary outline-none text-xs"
            />
          </div>
        );
      })}
      </div>
      <ImagePreviewModal
        isOpen={!!previewSrc}
        onClose={() => setPreviewSrc('')}
        src={previewSrc}
        title={previewTitle}
      />
    </>
  );
}

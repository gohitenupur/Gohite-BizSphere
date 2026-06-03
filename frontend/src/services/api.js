const API_BASE = import.meta.env.VITE_API_URL || '';

export function getAuthHeaders() {
  const token = localStorage.getItem('token');
  const businessId = sessionStorage.getItem('businessId');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (businessId) headers['X-Business-ID'] = businessId;
  return headers;
}

export async function apiRequest(path, options = {}) {
  const headers = { ...getAuthHeaders(), ...options.headers };
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || 'Request failed');
    err.status = res.status;
    err.details = data.details;
    throw err;
  }
  return data;
}

export async function apiUpload(path, formData) {
  const token = localStorage.getItem('token');
  const businessId = sessionStorage.getItem('businessId');
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (businessId) headers['X-Business-ID'] = businessId;
  const res = await fetch(`${API_BASE}${path}`, { method: 'POST', headers, body: formData });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Upload failed');
  return data;
}

export async function downloadPdf(path, filename) {
  const headers = getAuthHeaders();
  delete headers['Content-Type'];
  const res = await fetch(`${API_BASE}${path}`, { headers });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Download failed');
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

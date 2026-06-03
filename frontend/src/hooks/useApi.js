import { useCallback } from 'react';
import { apiRequest, apiUpload } from '../services/api.js';

export function useApi() {
  const get = useCallback((path) => apiRequest(path), []);
  const post = useCallback((path, body) => apiRequest(path, { method: 'POST', body: JSON.stringify(body) }), []);
  const put = useCallback((path, body) => apiRequest(path, { method: 'PUT', body: JSON.stringify(body) }), []);
  const del = useCallback((path) => apiRequest(path, { method: 'DELETE' }), []);
  const upload = useCallback((path, formData) => apiUpload(path, formData), []);
  return { get, post, put, del, upload };
}

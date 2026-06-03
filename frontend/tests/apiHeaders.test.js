import { describe, it, expect, beforeEach } from 'vitest';
import { getAuthHeaders } from '../src/services/api.js';

describe('getAuthHeaders', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('includes token and business id when set', () => {
    localStorage.setItem('token', 'test-token');
    sessionStorage.setItem('businessId', 'biz-1');
    const h = getAuthHeaders();
    expect(h.Authorization).toBe('Bearer test-token');
    expect(h['X-Business-ID']).toBe('biz-1');
  });
});

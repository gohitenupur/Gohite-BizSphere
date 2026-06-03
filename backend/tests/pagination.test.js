import { paginatedResponse } from '../src/utils/pagination.js';

describe('pagination', () => {
  test('paginatedResponse computes totalPages', () => {
    const r = paginatedResponse([1, 2], 50, { page: 1, pageSize: 25 });
    expect(r.meta.totalPages).toBe(2);
    expect(r.data).toHaveLength(2);
  });

  test('paginatedResponse handles zero total', () => {
    const r = paginatedResponse([], 0, { page: 1, pageSize: 25 });
    expect(r.meta.totalPages).toBe(0);
  });
});

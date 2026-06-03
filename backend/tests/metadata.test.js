import { validateMetadata } from '@gohite/shared';

describe('metadata validation', () => {
  test('krishi valid metadata', () => {
    const r = validateMetadata('KRISHI', { batchNo: 'B1', expiryDate: '2027-01-01' });
    expect(r.success).toBe(true);
  });

  test('krishi invalid date', () => {
    const r = validateMetadata('KRISHI', { expiryDate: 'bad' });
    expect(r.success).toBe(false);
  });

  test('hardware valid metadata', () => {
    const r = validateMetadata('HARDWARE', { size: '2 inch', material: 'PVC' });
    expect(r.success).toBe(true);
  });
});

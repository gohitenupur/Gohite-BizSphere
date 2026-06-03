import * as XLSX from 'xlsx';
import { parseProductSpreadsheet } from '../src/utils/excelParser.js';

describe('excelParser', () => {
  test('parses rows from buffer', () => {
    const ws = XLSX.utils.json_to_sheet([
      { name: 'Pipe', sku: 'HW-001', category: 'Pipes', sellingPrice: 100, quantity: 10 },
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Products');
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    const rows = parseProductSpreadsheet(buffer);
    expect(rows[0].name).toBe('Pipe');
    expect(rows[0].sku).toBe('HW-001');
  });
});

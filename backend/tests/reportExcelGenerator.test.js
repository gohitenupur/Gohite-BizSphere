import { generateSalesReportExcel } from '../src/utils/reportExcelGenerator.js';
import XLSX from 'xlsx';

describe('reportExcelGenerator', () => {
  test('generateSalesReportExcel creates a valid workbook buffer', () => {
    const mockSales = [
      {
        createdAt: '2026-06-09T10:00:00.000Z',
        customerName: 'John Doe',
        paymentType: 'CASH',
        totalAmount: 118,
        gstAmount: 18,
      },
      {
        createdAt: '2026-06-09T11:00:00.000Z',
        customerName: 'Jane Smith',
        paymentType: 'CARD',
        totalAmount: 236,
        gstAmount: 36,
      },
    ];

    const buffer = generateSalesReportExcel(mockSales);
    expect(buffer).toBeInstanceOf(Buffer);

    // Read the buffer back using xlsx to verify structure
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    expect(workbook.SheetNames).toContain('Sales Report');

    const sheet = workbook.Sheets['Sales Report'];
    const data = XLSX.utils.sheet_to_json(sheet);

    expect(data).toHaveLength(2);
    expect(data[0]['Customer Name']).toBe('John Doe');
    expect(data[0]['Payment Type']).toBe('CASH');
    expect(data[0]['Subtotal (Excl. GST)']).toBe(100);
    expect(data[0]['GST Amount']).toBe(18);
    expect(data[0]['Invoice Amount (Gross)']).toBe(118);

    expect(data[1]['Customer Name']).toBe('Jane Smith');
    expect(data[1]['Payment Type']).toBe('CARD');
    expect(data[1]['Subtotal (Excl. GST)']).toBe(200);
    expect(data[1]['GST Amount']).toBe(36);
    expect(data[1]['Invoice Amount (Gross)']).toBe(236);
  });

  test('generateSalesReportExcel works with empty sales list', () => {
    const buffer = generateSalesReportExcel([]);
    expect(buffer).toBeInstanceOf(Buffer);

    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheet = workbook.Sheets['Sales Report'];
    const data = XLSX.utils.sheet_to_json(sheet);
    expect(data).toHaveLength(0);
  });
});

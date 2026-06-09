import XLSX from 'xlsx';

export function generateSalesReportExcel(sales) {
  const rows = sales.map((s) => ({
    'Transaction Date': new Date(s.createdAt).toLocaleString('en-IN'),
    'Customer Name': s.customerName,
    'Payment Type': s.paymentType,
    'Subtotal (Excl. GST)': Number((s.totalAmount - s.gstAmount).toFixed(2)),
    'GST Amount': Number(s.gstAmount.toFixed(2)),
    'Invoice Amount (Gross)': Number(s.totalAmount.toFixed(2)),
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Auto-fit column widths
  if (rows.length > 0) {
    const colWidths = Object.keys(rows[0]).map(key => {
      const maxLength = Math.max(
        key.length,
        ...rows.map(row => String(row[key] ?? '').length)
      );
      return { wch: maxLength + 3 };
    });
    worksheet['!cols'] = colWidths;
  }

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sales Report');

  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  return buffer;
}

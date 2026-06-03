import * as XLSX from 'xlsx';

export function parseProductSpreadsheet(buffer) {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
  return rows.map((row, index) => ({
    rowNumber: index + 2,
    name: String(row.name || row.Name || '').trim(),
    sku: String(row.sku || row.SKU || '').trim(),
    categoryName: String(row.category || row.Category || '').trim(),
    purchasePrice: parseFloat(row.purchasePrice ?? row.PurchasePrice ?? 0),
    sellingPrice: parseFloat(row.sellingPrice ?? row.SellingPrice ?? 0),
    quantity: parseInt(row.quantity ?? row.Quantity ?? 0, 10),
    unit: String(row.unit || row.Unit || 'Pieces').trim(),
    companyName: String(row.companyName || row.Company || row.Brand || '').trim(),
    gstPercentage: parseFloat(row.gstPercentage ?? row.GST ?? 18),
    metadata: parseMetadataFromRow(row),
  }));
}

function parseMetadataFromRow(row) {
  const meta = {};
  const keys = [
    'batchNo', 'expiryDate', 'manufacturer', 'composition', 'licenseNo',
    'size', 'brand', 'material', 'color', 'warranty',
  ];
  keys.forEach((k) => {
    if (row[k] !== undefined && row[k] !== '') meta[k] = String(row[k]);
  });
  return meta;
}

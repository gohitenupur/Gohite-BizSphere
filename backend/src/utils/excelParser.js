import * as XLSX from 'xlsx';

export function parseProductSpreadsheet(buffer, businessType, customFields = []) {
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
    metadata: parseMetadataFromRow(row, businessType, customFields),
  }));
}

function parseMetadataFromRow(row, businessType, customFields = []) {
  const meta = {};
  const standardKeys = businessType === 'KRISHI' 
    ? ['batchNo', 'expiryDate', 'manufacturer', 'composition', 'licenseNo', 'imageUrl']
    : ['size', 'brand', 'material', 'color', 'warranty', 'imageUrl'];

  const keys = [...standardKeys, ...customFields.map((f) => f.key)];

  keys.forEach((k) => {
    let val = row[k];
    if (val === undefined) {
      const capKey = k.charAt(0).toUpperCase() + k.slice(1);
      val = row[capKey];
    }
    
    if (val !== undefined && val !== null && String(val).trim() !== '') {
      const customField = customFields.find((f) => f.key === k);
      if (customField) {
        if (customField.type === 'toggle') {
          const strVal = String(val).trim().toLowerCase();
          meta[k] = ['true', 'yes', '1', 'y', 'checked', 'on'].includes(strVal) || val === true || val === 1;
        } else if (customField.type === 'number') {
          const num = parseFloat(val);
          meta[k] = isFinite(num) ? num : String(val).trim();
        } else {
          meta[k] = String(val).trim();
        }
      } else {
        if (k === 'expiryDate') {
          const parsedDate = parseDate(val);
          if (parsedDate) meta[k] = parsedDate;
        } else {
          meta[k] = String(val).trim();
        }
      }
    }
  });
  return meta;
}

function parseDate(val) {
  if (!val) return undefined;
  
  if (val instanceof Date) {
    return val.toISOString().split('T')[0];
  }
  
  const str = String(val).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }
  
  // Excel date serial number (e.g. 45000)
  if (/^\d+(\.\d+)?$/.test(str)) {
    const excelDate = parseFloat(str);
    const date = new Date((excelDate - 25569) * 86400 * 1000);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  }
  
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0];
  }
  
  return str;
}

import * as XLSX from 'xlsx';
import { config } from '../config/index.js';
import * as excelService from '../services/excelService.js';
import { getConfigParsed } from '../services/configService.js';

export async function upload(req, res) {
  const bulkEnabled = await getConfigParsed('enable_bulk_upload', req.business.id);
  if (!config.ENABLE_BULK_UPLOAD || bulkEnabled === false) {
    return res.status(403).json({ error: 'Bulk upload is disabled' });
  }
  if (!req.file?.buffer) {
    return res.status(400).json({ error: 'File required' });
  }
  const result = await excelService.bulkUploadProducts(req.business, req.user.id, req.file.buffer);
  return res.json(result);
}

export async function downloadTemplate(req, res) {
  try {
    const isKrishi = req.business.type === 'KRISHI';
    const customFields = await getConfigParsed('custom_metadata_fields', req.business.id) || [];
    
    // Define headers
    const headers = [
      'name',
      'sku',
      'category',
      'purchasePrice',
      'sellingPrice',
      'quantity',
      'unit',
      'companyName',
      'gstPercentage',
      ...(isKrishi 
        ? ['batchNo', 'expiryDate', 'manufacturer', 'composition', 'licenseNo', 'imageUrl']
        : ['size', 'brand', 'material', 'color', 'warranty', 'imageUrl']
      ),
      ...customFields.map((cf) => cf.key)
    ];

    // Create a sample row
    const sampleRow = isKrishi ? {
      name: 'Sample Seed A',
      sku: 'KR-SEED-001',
      category: 'Seeds',
      purchasePrice: 150.50,
      sellingPrice: 180.00,
      quantity: 50,
      unit: 'Bags',
      companyName: 'Gohite Agri',
      gstPercentage: 5,
      batchNo: 'B-9912A',
      expiryDate: '2027-12-31',
      manufacturer: 'Indo-Agro Corp',
      composition: 'Hybrid Corn Seed',
      licenseNo: 'LIC-AGR-4421',
      imageUrl: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=120&auto=format&fit=crop'
    } : {
      name: 'Brass Pipe Adapter',
      sku: 'HW-BRS-02',
      category: 'Pipes',
      purchasePrice: 45.00,
      sellingPrice: 60.00,
      quantity: 120,
      unit: 'Pieces',
      companyName: 'Apex Tools',
      gstPercentage: 18,
      size: '1/2 inch',
      brand: 'ApexFit',
      material: 'Brass',
      color: 'Gold',
      warranty: '1 Year',
      imageUrl: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=120&auto=format&fit=crop'
    };

    // Append custom field values based on type
    customFields.forEach((cf) => {
      if (cf.type === 'toggle') {
        sampleRow[cf.key] = true;
      } else if (cf.type === 'number') {
        sampleRow[cf.key] = 10;
      } else if (cf.type === 'select') {
        sampleRow[cf.key] = cf.options?.[0] || 'Sample';
      } else {
        sampleRow[cf.key] = cf.default || 'Sample';
      }
    });

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet([sampleRow], { header: headers });
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Products Template');
    
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=gohite_template_${req.business.type.toLowerCase()}.xlsx`);
    return res.send(buffer);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

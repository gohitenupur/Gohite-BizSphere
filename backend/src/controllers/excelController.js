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

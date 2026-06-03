import * as saleService from '../services/saleService.js';
import { generateInvoicePdf } from '../utils/pdfGenerator.js';
import { getConfigParsed } from '../services/configService.js';

export async function create(req, res) {
  const posEnabled = await getConfigParsed('enable_pos', req.business.id);
  if (posEnabled === false) {
    return res.status(403).json({ error: 'POS is disabled for this business' });
  }
  const result = await saleService.createSale(req.business, req.user.id, req.body);
  if (result.error) return res.status(result.status).json({ error: result.error });
  return res.status(201).json(result);
}

export async function list(req, res) {
  const result = await saleService.listSales(req.business, req.query);
  return res.json(result);
}

export async function pdf(req, res) {
  const result = await saleService.getSaleById(req.business, req.params.id);
  if (result.error) return res.status(result.status).json({ error: result.error });
  const footer = await getConfigParsed('invoice_footer_text', req.business.id);
  const displayName = await getConfigParsed('company_display_name', req.business.id);
  const buffer = await generateInvoicePdf(result.sale, result.sale.business, {
    footerText: footer,
    displayName: displayName || result.sale.business.name,
  });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=invoice-${req.params.id.slice(0, 8)}.pdf`);
  return res.send(buffer);
}

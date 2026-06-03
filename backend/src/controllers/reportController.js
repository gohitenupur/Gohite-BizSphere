import * as reportService from '../services/reportService.js';

export async function salesSummary(req, res) {
  const result = await reportService.salesSummary(req.business, req.query);
  return res.json(result);
}

export async function salesList(req, res) {
  const result = await reportService.listSalesForReport(req.business, req.query);
  return res.json(result);
}

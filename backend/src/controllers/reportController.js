import * as reportService from '../services/reportService.js';

export async function salesSummary(req, res) {
  const result = await reportService.salesSummary(req.business, req.query);
  return res.json(result);
}

export async function salesList(req, res) {
  const result = await reportService.listSalesForReport(req.business, req.query);
  return res.json(result);
}

import { generateSalesReportPdf } from '../utils/reportPdfGenerator.js';

export async function salesPdf(req, res) {
  try {
    const summary = await reportService.salesSummary(req.business, req.query);
    const sales = await reportService.getAllSalesForReport(req.business, req.query);
    const buffer = await generateSalesReportPdf(sales, req.business, summary);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=sales-report.pdf');
    return res.send(buffer);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

import { generateSalesReportExcel } from '../utils/reportExcelGenerator.js';

export async function salesExcel(req, res) {
  try {
    const sales = await reportService.getAllSalesForReport(req.business, req.query);
    const buffer = generateSalesReportExcel(sales);
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=sales-report.xlsx');
    return res.send(buffer);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}



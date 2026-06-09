import { Router } from 'express';
import * as reportController from '../controllers/reportController.js';
import { requireRoles } from '../middleware/rbacMiddleware.js';

const router = Router();

router.get('/sales-summary', requireRoles('ADMIN', 'MANAGER'), reportController.salesSummary);
router.get('/sales', requireRoles('ADMIN', 'MANAGER'), reportController.salesList);
router.get('/sales-pdf', requireRoles('ADMIN', 'MANAGER'), reportController.salesPdf);
router.get('/sales-excel', requireRoles('ADMIN', 'MANAGER'), reportController.salesExcel);

export default router;


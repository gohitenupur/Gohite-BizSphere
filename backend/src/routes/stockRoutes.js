import { Router } from 'express';
import * as productController from '../controllers/productController.js';
import { requireRoles } from '../middleware/rbacMiddleware.js';

const router = Router();

router.post('/adjust', requireRoles('ADMIN', 'MANAGER'), productController.adjustStock);

export default router;

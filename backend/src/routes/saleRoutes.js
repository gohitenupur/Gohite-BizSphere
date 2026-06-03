import { Router } from 'express';
import * as saleController from '../controllers/saleController.js';
import { requireRoles } from '../middleware/rbacMiddleware.js';

const router = Router();

router.get('/', saleController.list);
router.post('/', requireRoles('ADMIN', 'MANAGER', 'EMPLOYEE'), saleController.create);
router.get('/:id/pdf', saleController.pdf);

export default router;

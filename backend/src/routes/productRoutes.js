import { Router } from 'express';
import * as productController from '../controllers/productController.js';
import { requireRoles } from '../middleware/rbacMiddleware.js';

const router = Router();

router.get('/', productController.list);
router.get('/alerts/expiring', productController.expiring);
router.post('/', requireRoles('ADMIN', 'MANAGER'), productController.create);
router.put('/:id', requireRoles('ADMIN', 'MANAGER'), productController.update);
router.delete('/:id', requireRoles('ADMIN', 'MANAGER'), productController.remove);
export default router;

import { Router } from 'express';
import * as configController from '../controllers/configController.js';
import { requireRoles } from '../middleware/rbacMiddleware.js';

const router = Router();

router.get('/effective', configController.getEffective);
router.get('/definitions', requireRoles('ADMIN', 'MANAGER'), configController.getDefinitions);
router.get('/', requireRoles('ADMIN'), configController.list);
router.put('/', requireRoles('ADMIN'), configController.update);
router.put('/bulk', requireRoles('ADMIN'), configController.updateBulk);

export default router;

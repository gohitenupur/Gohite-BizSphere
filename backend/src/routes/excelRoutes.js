import { Router } from 'express';
import multer from 'multer';
import * as excelController from '../controllers/excelController.js';
import { requireRoles } from '../middleware/rbacMiddleware.js';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
const router = Router();

router.post('/upload', requireRoles('ADMIN', 'MANAGER'), upload.single('file'), excelController.upload);

export default router;

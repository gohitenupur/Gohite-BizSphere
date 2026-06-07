import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './src/config/index.js';
import { authMiddleware } from './src/middleware/authMiddleware.js';
import { tenantMiddleware } from './src/middleware/tenantMiddleware.js';
import authRoutes from './src/routes/authRoutes.js';
import productRoutes from './src/routes/productRoutes.js';
import saleRoutes from './src/routes/saleRoutes.js';
import excelRoutes from './src/routes/excelRoutes.js';
import reportRoutes from './src/routes/reportRoutes.js';
import stockRoutes from './src/routes/stockRoutes.js';
import categoryRoutes from './src/routes/categoryRoutes.js';
import configRoutes from './src/routes/configRoutes.js';
import superAdminRoutes from './src/routes/superAdminRoutes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendDistDir = path.resolve(__dirname, '../frontend/dist');
const frontendIndexFile = path.join(frontendDistDir, 'index.html');

const app = express();

app.use(cors({ origin: config.CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/super-admin', superAdminRoutes);

const tenantRouter = express.Router();
tenantRouter.use(authMiddleware);
tenantRouter.use(tenantMiddleware);
tenantRouter.use('/products', productRoutes);
tenantRouter.use('/categories', categoryRoutes);
tenantRouter.use('/stock', stockRoutes);
tenantRouter.use('/sales', saleRoutes);
tenantRouter.use('/excel', excelRoutes);
tenantRouter.use('/reports', reportRoutes);
tenantRouter.use('/config', configRoutes);

app.use('/api', tenantRouter);

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(frontendDistDir));

  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(frontendIndexFile);
  });
}

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(config.PORT, () => {
    console.log(`API listening on http://localhost:${config.PORT}`);
  });
}

export default app;

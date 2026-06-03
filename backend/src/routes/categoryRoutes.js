import { Router } from 'express';
import { prisma } from '../lib/prisma.js';

const router = Router();

router.get('/', async (req, res) => {
  const categories = await prisma.category.findMany({
    where: { businessId: req.businessId },
    orderBy: { name: 'asc' },
  });
  return res.json({ data: categories });
});

export default router;

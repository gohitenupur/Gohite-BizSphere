import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireRoles } from '../middleware/rbacMiddleware.js';

const router = Router();

router.get('/', async (req, res) => {
  const categories = await prisma.category.findMany({
    where: { businessId: req.businessId },
    orderBy: { name: 'asc' },
  });
  return res.json({ data: categories });
});

router.post('/', requireRoles('ADMIN', 'MANAGER'), async (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Category name is required' });
  }

  try {
    const existing = await prisma.category.findFirst({
      where: { businessId: req.businessId, name: name.trim() },
    });
    if (existing) {
      return res.status(400).json({ error: 'Category already exists' });
    }

    const category = await prisma.category.create({
      data: {
        businessId: req.businessId,
        name: name.trim(),
      },
    });
    return res.status(201).json({ data: category });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to create category' });
  }
});

router.put('/:id', requireRoles('ADMIN', 'MANAGER'), async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Category name is required' });
  }

  try {
    const category = await prisma.category.findFirst({
      where: { id, businessId: req.businessId },
    });
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const duplicate = await prisma.category.findFirst({
      where: {
        businessId: req.businessId,
        name: name.trim(),
        id: { not: id },
      },
    });
    if (duplicate) {
      return res.status(400).json({ error: 'Another category with this name already exists' });
    }

    const updated = await prisma.category.update({
      where: { id },
      data: { name: name.trim() },
    });
    return res.json({ data: updated });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to update category' });
  }
});

router.delete('/:id', requireRoles('ADMIN', 'MANAGER'), async (req, res) => {
  const { id } = req.params;

  try {
    const category = await prisma.category.findFirst({
      where: { id, businessId: req.businessId },
    });
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Check if any product is using this category
    const productCount = await prisma.product.count({
      where: { categoryId: id, deletedAt: null },
    });
    if (productCount > 0) {
      return res.status(400).json({
        error: `Cannot delete category: it is used by ${productCount} active product(s).`,
      });
    }

    await prisma.category.delete({
      where: { id },
    });
    return res.json({ message: 'Category deleted successfully' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to delete category' });
  }
});

export default router;

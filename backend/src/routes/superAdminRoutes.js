import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import bcrypt from 'bcryptjs';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { requireRoles } from '../middleware/rbacMiddleware.js';
import { superAdminLogin } from '../services/authService.js';

const router = Router();

// Public login endpoint for Super Admins
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }
  try {
    const result = await superAdminLogin(email, password);
    if (result.error) {
      return res.status(result.status || 400).json({ error: result.error });
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.use(authMiddleware, requireRoles('SUPER_ADMIN'));

// Get all users with their business role assignments
router.get('/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        createdAt: true,
        businesses: {
          select: {
            id: true,
            businessId: true,
            role: true,
          }
        }
      },
      orderBy: { name: 'asc' }
    });
    res.json({ data: users });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Register a new user with scoped business assignments
router.post('/users', async (req, res) => {
  const { email, password, name, role, assignments } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Name, email, and password required' });
  }
  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    
    const user = await prisma.user.create({
      data: {
        email,
        password: passwordHash,
        name,
        role: role || 'EMPLOYEE',
        businesses: {
          create: (assignments || []).map(a => ({
            businessId: a.businessId,
            role: a.role
          }))
        }
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true
      }
    });
    res.json({ data: user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update an existing user and their scoped business assignments
router.put('/users/:id', async (req, res) => {
  const { id } = req.params;
  const { email, password, name, role, status, assignments } = req.body;
  
  // Safeguard: Prevent modifying self privileges or status
  if (req.user.id === id && ((role && role !== 'SUPER_ADMIN') || (status && status !== 'ACTIVE'))) {
    return res.status(400).json({ error: 'Cannot modify your own super admin privileges or active status' });
  }

  try {
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'User not found' });
    }

    const dataUpdate = {
      name,
      email,
      role,
      status,
    };
    if (password) {
      dataUpdate.password = await bcrypt.hash(password, 10);
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id },
        data: dataUpdate
      }),
      prisma.userBusiness.deleteMany({ where: { userId: id } }),
      prisma.userBusiness.createMany({
        data: (assignments || []).map(a => ({
          userId: id,
          businessId: a.businessId,
          role: a.role
        }))
      })
    ]);

    const updatedUser = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true
      }
    });
    res.json({ data: updatedUser });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';
import { config } from '../config/index.js';
import { writeAuditLog } from './auditService.js';

export async function login(email, password, businessId) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.status !== 'ACTIVE') {
    return { error: 'Invalid credentials', status: 401 };
  }
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return { error: 'Invalid credentials', status: 401 };
  }

  // If businessId is provided, verify user has access to it (unless they are SUPER_ADMIN)
  if (businessId && user.role !== 'SUPER_ADMIN') {
    const hasAccess = await prisma.userBusiness.findFirst({
      where: { userId: user.id, businessId },
    });
    if (!hasAccess) {
      return { error: 'You do not have access to this business unit', status: 403 };
    }
  }

  const token = jwt.sign(
    { sub: user.id, role: user.role },
    config.JWT_SECRET,
    { expiresIn: config.JWT_EXPIRES_IN }
  );

  await writeAuditLog({
    userId: user.id,
    action: 'LOGIN',
    entity: 'User',
    entityId: user.id,
  });

  return {
    token,
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  };
}

export async function superAdminLogin(email, password) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.status !== 'ACTIVE' || user.role !== 'SUPER_ADMIN') {
    return { error: 'Invalid credentials or not a super admin', status: 401 };
  }
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return { error: 'Invalid credentials', status: 401 };
  }

  const token = jwt.sign(
    { sub: user.id, role: user.role },
    config.JWT_SECRET,
    { expiresIn: config.JWT_EXPIRES_IN }
  );

  await writeAuditLog({
    userId: user.id,
    action: 'LOGIN_SUPER_ADMIN',
    entity: 'User',
    entityId: user.id,
  });

  return {
    token,
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  };
}

export async function listBusinessesForUser(userId, role) {
  if (!userId || role === 'ADMIN' || role === 'SUPER_ADMIN') {
    return prisma.business.findMany({ where: { status: 'ACTIVE' }, orderBy: { name: 'asc' } });
  }
  const links = await prisma.userBusiness.findMany({
    where: { userId },
    include: { business: true },
  });
  return links.map((l) => l.business).filter((b) => b.status === 'ACTIVE');
}

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';
import { config } from '../config/index.js';
import { writeAuditLog } from './auditService.js';

export async function login(email, password) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.status !== 'ACTIVE') {
    return { error: 'Invalid credentials', status: 401 };
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
    action: 'LOGIN',
    entity: 'User',
    entityId: user.id,
  });

  return {
    token,
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  };
}

export async function listBusinessesForUser(userId, role) {
  if (role === 'ADMIN') {
    return prisma.business.findMany({ where: { status: 'ACTIVE' }, orderBy: { name: 'asc' } });
  }
  const links = await prisma.userBusiness.findMany({
    where: { userId },
    include: { business: true },
  });
  return links.map((l) => l.business).filter((b) => b.status === 'ACTIVE');
}

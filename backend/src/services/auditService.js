import { prisma } from '../lib/prisma.js';

export async function writeAuditLog({ userId, businessId, action, entity, entityId, payload }) {
  return prisma.auditLog.create({
    data: {
      userId: userId ?? null,
      businessId: businessId ?? null,
      action,
      entity: entity ?? null,
      entityId: entityId ?? null,
      payload: payload ?? undefined,
    },
  });
}

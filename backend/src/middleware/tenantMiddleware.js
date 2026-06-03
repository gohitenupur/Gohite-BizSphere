import { prisma } from '../lib/prisma.js';

export async function tenantMiddleware(req, res, next) {
  const businessId = req.headers['x-business-id'];
  if (!businessId) {
    return res.status(400).json({ error: 'X-Business-ID header is required' });
  }

  const business = await prisma.business.findFirst({
    where: { id: businessId, status: 'ACTIVE' },
  });
  if (!business) {
    return res.status(404).json({ error: 'Business not found' });
  }

  if (req.user.role !== 'ADMIN') {
    const access = await prisma.userBusiness.findUnique({
      where: {
        userId_businessId: { userId: req.user.id, businessId },
      },
    });
    if (!access) {
      return res.status(403).json({ error: 'No access to this business' });
    }
  }

  req.business = business;
  req.businessId = businessId;

  try {
    await prisma.$executeRawUnsafe(
      `SELECT set_config('app.business_id', $1, true)`,
      businessId
    );
  } catch (err) {
    console.warn('RLS session variable not set:', err.message);
  }

  next();
}

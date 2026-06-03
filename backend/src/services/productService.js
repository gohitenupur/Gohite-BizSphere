import { validateMetadata } from '@gohite/shared';
import { prisma } from '../lib/prisma.js';
import { parsePagination, paginatedResponse } from '../utils/pagination.js';
import { writeAuditLog } from './auditService.js';
import { getConfigNumber } from './configService.js';

export async function listProducts(business, query) {
  const { page, pageSize, sort, order, search, skip } = await parsePagination(query, business.id);
  const where = {
    businessId: business.id,
    deletedAt: null,
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { sku: { contains: search, mode: 'insensitive' } },
            { companyName: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const [total, data] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { [sort]: order },
      include: { category: { select: { id: true, name: true } } },
    }),
  ]);

  return paginatedResponse(data, total, { page, pageSize });
}

export async function createProduct(business, userId, body) {
  const metaResult = validateMetadata(business.type, body.metadata);
  if (!metaResult.success) {
    return { error: 'Invalid metadata', details: metaResult.error.issues, status: 400 };
  }

  const defaultGst = await getConfigNumber('default_gst_percentage', business.id, 18);
  const defaultMinStock = await getConfigNumber('default_min_stock', business.id, 5);

  const product = await prisma.product.create({
    data: {
      businessId: business.id,
      categoryId: body.categoryId,
      name: body.name,
      sku: body.sku,
      purchasePrice: body.purchasePrice,
      sellingPrice: body.sellingPrice,
      quantity: body.quantity ?? 0,
      minStock: body.minStock ?? defaultMinStock,
      unit: body.unit,
      companyName: body.companyName,
      gstPercentage: body.gstPercentage ?? defaultGst,
      metadata: metaResult.data ?? {},
    },
    include: { category: true },
  });

  await writeAuditLog({
    userId,
    businessId: business.id,
    action: 'PRODUCT_CREATE',
    entity: 'Product',
    entityId: product.id,
  });

  return { product };
}

export async function updateProduct(business, userId, id, body) {
  const existing = await prisma.product.findFirst({
    where: { id, businessId: business.id, deletedAt: null },
  });
  if (!existing) return { error: 'Product not found', status: 404 };

  let metadata = existing.metadata;
  if (body.metadata !== undefined) {
    const metaResult = validateMetadata(business.type, body.metadata);
    if (!metaResult.success) {
      return { error: 'Invalid metadata', details: metaResult.error.issues, status: 400 };
    }
    metadata = metaResult.data;
  }

  const product = await prisma.product.update({
    where: { id },
    data: {
      ...(body.categoryId && { categoryId: body.categoryId }),
      ...(body.name && { name: body.name }),
      ...(body.sku && { sku: body.sku }),
      ...(body.purchasePrice !== undefined && { purchasePrice: body.purchasePrice }),
      ...(body.sellingPrice !== undefined && { sellingPrice: body.sellingPrice }),
      ...(body.quantity !== undefined && { quantity: body.quantity }),
      ...(body.minStock !== undefined && { minStock: body.minStock }),
      ...(body.unit && { unit: body.unit }),
      ...(body.companyName && { companyName: body.companyName }),
      ...(body.gstPercentage !== undefined && { gstPercentage: body.gstPercentage }),
      metadata,
    },
    include: { category: true },
  });

  await writeAuditLog({
    userId,
    businessId: business.id,
    action: 'PRODUCT_UPDATE',
    entity: 'Product',
    entityId: product.id,
  });

  return { product };
}

export async function softDeleteProduct(business, userId, id) {
  const existing = await prisma.product.findFirst({
    where: { id, businessId: business.id, deletedAt: null },
  });
  if (!existing) return { error: 'Product not found', status: 404 };

  await prisma.product.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  await writeAuditLog({
    userId,
    businessId: business.id,
    action: 'PRODUCT_DELETE',
    entity: 'Product',
    entityId: id,
  });

  return { success: true };
}

export async function adjustStock(business, userId, { productId, type, quantity, reason }) {
  const product = await prisma.product.findFirst({
    where: { id: productId, businessId: business.id, deletedAt: null },
  });
  if (!product) return { error: 'Product not found', status: 404 };

  const delta = type === 'IN' ? quantity : -quantity;
  const newQty = product.quantity + delta;
  if (newQty < 0) return { error: 'Insufficient stock', status: 409 };

  const [updated] = await prisma.$transaction([
    prisma.product.update({
      where: { id: productId },
      data: { quantity: newQty },
    }),
    prisma.stockMovement.create({
      data: {
        businessId: business.id,
        productId,
        type,
        quantity,
        reason,
        createdBy: userId,
      },
    }),
  ]);

  await writeAuditLog({
    userId,
    businessId: business.id,
    action: 'STOCK_ADJUST',
    entity: 'Product',
    entityId: productId,
    payload: { type, quantity, reason, newQty: updated.quantity },
  });

  return { product: updated };
}

export async function getExpiringProducts(business, queryDays) {
  if (business.type !== 'KRISHI') {
    return { error: 'Expiry alerts only for Krishi business', status: 400 };
  }
  const days =
    queryDays ??
    (await getConfigNumber('expiry_alert_days', business.id, 30));

  const products = await prisma.product.findMany({
    where: {
      businessId: business.id,
      deletedAt: null,
    },
  });

  const now = new Date();
  const limit = new Date(now);
  limit.setDate(limit.getDate() + days);

  const expiring = products.filter((p) => {
    const exp = p.metadata?.expiryDate;
    if (!exp) return false;
    const d = new Date(exp);
    return d >= now && d <= limit;
  });

  return { data: expiring, meta: { days, count: expiring.length } };
}

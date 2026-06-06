import { prisma } from '../lib/prisma.js';
import { parsePagination, paginatedResponse } from '../utils/pagination.js';
import { writeAuditLog } from './auditService.js';

export async function createSale(business, userId, body) {
  const { customerName, mobileNo, paymentType, items, metadata } = body;
  if (!items?.length) return { error: 'Sale items required', status: 400 };

  try {
    const result = await prisma.$transaction(async (tx) => {
      let totalAmount = 0;
      let gstAmount = 0;
      const lineItems = [];

      for (const item of items) {
        const product = await tx.product.findFirst({
          where: { id: item.productId, businessId: business.id, deletedAt: null },
        });
        if (!product) throw Object.assign(new Error('Product not found'), { status: 404 });
        if (product.quantity < item.quantity) {
          throw Object.assign(new Error(`Insufficient stock for ${product.name}`), { status: 409 });
        }

        const price = item.price ?? product.sellingPrice;
        const lineTotal = price * item.quantity;
        const lineGst = (lineTotal * product.gstPercentage) / (100 + product.gstPercentage);
        totalAmount += lineTotal;
        gstAmount += lineGst;

        await tx.product.update({
          where: { id: product.id },
          data: { quantity: product.quantity - item.quantity },
        });

        await tx.stockMovement.create({
          data: {
            businessId: business.id,
            productId: product.id,
            type: 'OUT',
            quantity: item.quantity,
            reason: 'SALE',
            createdBy: userId,
          },
        });

        lineItems.push({ productId: product.id, quantity: item.quantity, price });
      }

      const sale = await tx.sale.create({
        data: {
          businessId: business.id,
          customerName: customerName || 'Cash Customer',
          mobileNo,
          totalAmount,
          gstAmount,
          paymentType: paymentType || 'CASH',
          metadata: metadata || {},
          saleItems: { create: lineItems },
        },
        include: { saleItems: { include: { product: true } } },
      });

      return sale;
    });

    await writeAuditLog({
      userId,
      businessId: business.id,
      action: 'SALE_CREATE',
      entity: 'Sale',
      entityId: result.id,
      payload: { totalAmount: result.totalAmount },
    });

    return { sale: result };
  } catch (err) {
    if (err.status) return { error: err.message, status: err.status };
    throw err;
  }
}

export async function listSales(business, query) {
  const { page, pageSize, sort, order, skip } = await parsePagination(query, business.id);
  const where = { businessId: business.id };

  const [total, data] = await Promise.all([
    prisma.sale.count({ where }),
    prisma.sale.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { [sort]: order },
      include: {
        saleItems: { include: { product: { select: { id: true, name: true, sku: true } } } },
      },
    }),
  ]);

  return paginatedResponse(data, total, { page, pageSize });
}

export async function getSaleById(business, id) {
  const sale = await prisma.sale.findFirst({
    where: { id, businessId: business.id },
    include: {
      saleItems: { include: { product: true } },
      business: true,
    },
  });
  if (!sale) return { error: 'Sale not found', status: 404 };
  return { sale };
}

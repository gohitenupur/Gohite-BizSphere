import { prisma } from '../lib/prisma.js';
import { parsePagination, paginatedResponse } from '../utils/pagination.js';

export async function salesSummary(business, { from, to }) {
  const where = {
    businessId: business.id,
    ...(from || to
      ? {
          createdAt: {
            ...(from && { gte: new Date(from) }),
            ...(to && { lte: new Date(to) }),
          },
        }
      : {}),
  };

  const sales = await prisma.sale.findMany({ where });
  const totalSales = sales.length;
  const totalAmount = sales.reduce((s, x) => s + x.totalAmount, 0);
  const totalGst = sales.reduce((s, x) => s + x.gstAmount, 0);

  const byPayment = {};
  sales.forEach((s) => {
    byPayment[s.paymentType] = (byPayment[s.paymentType] || 0) + s.totalAmount;
  });

  return {
    totalSales,
    totalAmount,
    totalGst,
    byPayment,
  };
}

export async function listSalesForReport(business, query) {
  const { page, pageSize, sort, order, skip } = await parsePagination(query, business.id);
  const where = { businessId: business.id };

  const [total, data] = await Promise.all([
    prisma.sale.count({ where }),
    prisma.sale.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { [sort]: order },
    }),
  ]);

  return paginatedResponse(data, total, { page, pageSize });
}

import { jest } from '@jest/globals';
import request from 'supertest';
import app from '../server.js';
import { prisma } from '../src/lib/prisma.js';
import jwt from 'jsonwebtoken';
import { config } from '../src/config/index.js';

jest.mock('../src/lib/prisma.js', () => ({
  prisma: {
    user: {
      findUnique: () => {},
    },
    business: {
      findFirst: () => {},
    },
    userBusiness: {
      findUnique: () => {},
    },
    sale: {
      findMany: () => {},
      count: () => {},
    },
    $executeRawUnsafe: () => {},
  },
}));

describe('Report Routes Integration', () => {
  beforeEach(() => {
    prisma.user.findUnique = jest.fn();
    prisma.business.findFirst = jest.fn();
    prisma.userBusiness.findUnique = jest.fn();
    prisma.sale.findMany = jest.fn();
    prisma.$executeRawUnsafe = jest.fn();
  });

  test('GET /api/reports/sales-excel returns XLSX file buffer', async () => {
    // 1. Sign a real JWT token using the configured secret
    const token = jwt.sign({ sub: 'user-1' }, config.JWT_SECRET);

    // 2. Mock user lookup in authMiddleware
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'admin@gohite.com',
      role: 'ADMIN',
      status: 'ACTIVE',
    });

    // 3. Mock business lookup in tenantMiddleware
    prisma.business.findFirst.mockResolvedValue({
      id: 'biz-1',
      status: 'ACTIVE',
    });

    // 4. Mock user-business permission check
    prisma.userBusiness.findUnique.mockResolvedValue({
      userId: 'user-1',
      businessId: 'biz-1',
      role: 'ADMIN',
    });

    // 5. Mock $executeRawUnsafe
    prisma.$executeRawUnsafe.mockResolvedValue([]);

    // 6. Mock sales data for reportService.getAllSalesForReport
    prisma.sale.findMany.mockResolvedValue([
      {
        id: 'sale-1',
        createdAt: '2026-06-09T10:00:00.000Z',
        customerName: 'John Doe',
        paymentType: 'CASH',
        totalAmount: 118,
        gstAmount: 18,
      },
    ]);

    const res = await request(app)
      .get('/api/reports/sales-excel')
      .set('Authorization', `Bearer ${token}`)
      .set('x-business-id', 'biz-1')
      .buffer(true)
      .parse((res, cb) => {
        const data = [];
        res.on('data', (chunk) => data.push(chunk));
        res.on('end', () => cb(null, Buffer.concat(data)));
      });

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    expect(res.headers['content-disposition']).toBe('attachment; filename=sales-report.xlsx');
    expect(res.body).toBeInstanceOf(Buffer);
  });

  test('GET /api/reports/sales-excel applies from and to date filters', async () => {
    const token = jwt.sign({ sub: 'user-1' }, config.JWT_SECRET);

    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'admin@gohite.com',
      role: 'ADMIN',
      status: 'ACTIVE',
    });

    prisma.business.findFirst.mockResolvedValue({
      id: 'biz-1',
      status: 'ACTIVE',
    });

    prisma.userBusiness.findUnique.mockResolvedValue({
      userId: 'user-1',
      businessId: 'biz-1',
      role: 'ADMIN',
    });

    prisma.$executeRawUnsafe.mockResolvedValue([]);
    prisma.sale.findMany.mockResolvedValue([]);

    const fromDateStr = '2026-06-01T00:00:00.000Z';
    const toDateStr = '2026-06-07T23:59:59.999Z';

    const res = await request(app)
      .get(`/api/reports/sales-excel?from=${fromDateStr}&to=${toDateStr}`)
      .set('Authorization', `Bearer ${token}`)
      .set('x-business-id', 'biz-1')
      .buffer(true)
      .parse((res, cb) => {
        const data = [];
        res.on('data', (chunk) => data.push(chunk));
        res.on('end', () => cb(null, Buffer.concat(data)));
      });

    expect(res.status).toBe(200);
    expect(prisma.sale.findMany).toHaveBeenCalledWith({
      where: {
        businessId: 'biz-1',
        createdAt: {
          gte: new Date(fromDateStr),
          lte: new Date(toDateStr),
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  });
});

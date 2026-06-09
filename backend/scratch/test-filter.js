import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  const allSales = await prisma.sale.findMany({
    orderBy: { createdAt: 'desc' }
  });
  console.log('Total sales in DB:', allSales.length);
  if (allSales.length > 0) {
    console.log('First sale createdAt:', allSales[0].createdAt);
    console.log('Last sale createdAt:', allSales[allSales.length - 1].createdAt);
  }

  // Test filter
  const from = new Date('2026-06-08T00:00:00.000Z');
  const to = new Date('2026-06-09T23:59:59.999Z');

  const filteredSales = await prisma.sale.findMany({
    where: {
      createdAt: {
        gte: from,
        lte: to
      }
    }
  });
  console.log('Filtered sales (June 8 to June 9):', filteredSales.length);

  // Test another filter that should return 0
  const emptyFrom = new Date('2026-06-01T00:00:00.000Z');
  const emptyTo = new Date('2026-06-02T23:59:59.999Z');
  const emptySales = await prisma.sale.findMany({
    where: {
      createdAt: {
        gte: emptyFrom,
        lte: emptyTo
      }
    }
  });
  console.log('Filtered sales (June 1 to June 2):', emptySales.length);

  await prisma.$disconnect();
}

run();

import { validateMetadata } from '@gohite/shared';
import { prisma } from '../lib/prisma.js';
import { parseProductSpreadsheet } from '../utils/excelParser.js';
import { writeAuditLog } from './auditService.js';

const BATCH_SIZE = 100;

export async function bulkUploadProducts(business, userId, buffer) {
  const rows = parseProductSpreadsheet(buffer);
  const errors = [];
  let successCount = 0;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    await prisma.$transaction(async (tx) => {
      for (const row of batch) {
        if (!row.name || !row.sku) {
          errors.push({ row: row.rowNumber, error: 'name and sku required' });
          continue;
        }
        const metaResult = validateMetadata(business.type, row.metadata);
        if (!metaResult.success) {
          errors.push({ row: row.rowNumber, error: 'invalid metadata' });
          continue;
        }

        let category = await tx.category.findFirst({
          where: { businessId: business.id, name: row.categoryName || 'General' },
        });
        if (!category) {
          category = await tx.category.create({
            data: { businessId: business.id, name: row.categoryName || 'General' },
          });
        }

        await tx.product.upsert({
          where: { businessId_sku: { businessId: business.id, sku: row.sku } },
          create: {
            businessId: business.id,
            categoryId: category.id,
            name: row.name,
            sku: row.sku,
            purchasePrice: row.purchasePrice,
            sellingPrice: row.sellingPrice,
            quantity: row.quantity,
            unit: row.unit,
            companyName: row.companyName || 'Unknown',
            gstPercentage: row.gstPercentage,
            metadata: metaResult.data ?? {},
          },
          update: {
            name: row.name,
            purchasePrice: row.purchasePrice,
            sellingPrice: row.sellingPrice,
            quantity: row.quantity,
            metadata: metaResult.data ?? {},
          },
        });
        successCount += 1;
      }
    });
  }

  await writeAuditLog({
    userId,
    businessId: business.id,
    action: 'BULK_UPLOAD',
    entity: 'Product',
    payload: { successCount, errorCount: errors.length },
  });

  return { successCount, errors };
}

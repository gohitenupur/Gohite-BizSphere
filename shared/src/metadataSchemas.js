import { z } from 'zod';
import { BusinessType } from './constants.js';

export const krishiMetadataSchema = z
  .object({
    batchNo: z.string().optional(),
    expiryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    manufacturer: z.string().optional(),
    composition: z.string().optional(),
    licenseNo: z.string().optional(),
  })
  .partial()
  .passthrough();

export const hardwareMetadataSchema = z
  .object({
    size: z.string().optional(),
    brand: z.string().optional(),
    material: z.string().optional(),
    color: z.string().optional(),
    warranty: z.string().optional(),
  })
  .partial()
  .passthrough();

export function validateMetadata(businessType, metadata) {
  const data = metadata ?? {};
  if (businessType === BusinessType.KRISHI) {
    return krishiMetadataSchema.safeParse(data);
  }
  if (businessType === BusinessType.HARDWARE) {
    return hardwareMetadataSchema.safeParse(data);
  }
  return { success: false, error: { issues: [{ message: 'Unknown business type' }] } };
}

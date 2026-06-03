import {
  CONFIG_KEYS,
  CONFIG_KEY_LIST,
  parseConfigValue,
  validateConfigValue,
} from '@gohite/shared';
import { prisma } from '../lib/prisma.js';
import { config as envConfig } from '../config/index.js';

async function readRow(key, businessId) {
  if (businessId) {
    const biz = await prisma.systemConfig.findFirst({ where: { key, businessId } });
    if (biz) return biz.value;
  }
  const global = await prisma.systemConfig.findFirst({ where: { key, businessId: null } });
  if (global) return global.value;
  const def = CONFIG_KEYS[key];
  return def?.default ?? null;
}

export async function getConfig(key, businessId = null) {
  return readRow(key, businessId);
}

export async function getConfigNumber(key, businessId, fallback) {
  const val = await readRow(key, businessId);
  if (val === null || val === '') return fallback;
  const n = Number(val);
  return Number.isFinite(n) ? n : fallback;
}

export async function getConfigParsed(key, businessId = null) {
  const raw = await readRow(key, businessId);
  return parseConfigValue(key, raw);
}

export async function getEffectiveConfig(businessId, businessType) {
  const result = {};
  for (const key of CONFIG_KEY_LIST) {
    const def = CONFIG_KEYS[key];
    if (def.businessTypes && !def.businessTypes.includes(businessType)) continue;
    const raw = await readRow(key, businessId);
    result[key] = parseConfigValue(key, raw ?? def.default);
  }
  result._env = {
    enableBulkUpload: envConfig.ENABLE_BULK_UPLOAD,
  };
  return result;
}

export async function listConfigs(businessId = null) {
  const where = businessId ? { OR: [{ businessId }, { businessId: null }] } : {};
  const rows = await prisma.systemConfig.findMany({ where, orderBy: { key: 'asc' } });
  return rows;
}

export async function getConfigDefinitions(businessType) {
  return CONFIG_KEY_LIST.filter((key) => {
    const def = CONFIG_KEYS[key];
    if (!def.businessTypes) return true;
    return businessType ? def.businessTypes.includes(businessType) : true;
  }).map((key) => ({
    key,
    ...CONFIG_KEYS[key],
    currentValue: null,
  }));
}

export async function setConfig(key, value, businessId = null, userId) {
  const validation = validateConfigValue(key, value);
  if (!validation.valid) return { error: validation.error, status: 400 };

  const def = CONFIG_KEYS[key];
  if (def.scope === 'global' && businessId) {
    return { error: 'This setting is global only', status: 400 };
  }

  const row = await prisma.systemConfig.upsert({
    where: { key_businessId: { key, businessId: businessId ?? null } },
    create: { key, value: validation.serialized, businessId: businessId ?? null },
    update: { value: validation.serialized },
  });

  const { writeAuditLog } = await import('./auditService.js');
  await writeAuditLog({
    userId,
    businessId,
    action: 'CONFIG_UPDATE',
    entity: 'SystemConfig',
    entityId: row.id,
    payload: { key, value: validation.serialized },
  });

  return { config: row };
}

export async function getPaginationLimits(businessId) {
  const defaultPageSize = await getConfigNumber('default_page_size', businessId, envConfig.DEFAULT_PAGE_SIZE);
  const maxPageSize = await getConfigNumber('max_page_size', businessId, envConfig.MAX_PAGE_SIZE);
  return { defaultPageSize, maxPageSize };
}

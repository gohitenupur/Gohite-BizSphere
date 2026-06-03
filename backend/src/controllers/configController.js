import * as configService from '../services/configService.js';
import { CONFIG_KEYS } from '@gohite/shared';

export async function getDefinitions(req, res) {
  const defs = await configService.getConfigDefinitions(req.business.type);
  const effective = await configService.getEffectiveConfig(req.business.id, req.business.type);
  const withValues = defs.map((d) => ({
    ...d,
    currentValue: effective[d.key],
  }));
  return res.json({ data: withValues, effective });
}

export async function list(req, res) {
  const rows = await configService.listConfigs(req.business.id);
  return res.json({ data: rows });
}

export async function getEffective(req, res) {
  const effective = await configService.getEffectiveConfig(req.business.id, req.business.type);
  return res.json({ data: effective });
}

export async function update(req, res) {
  const { key, value } = req.body;
  if (!key || !CONFIG_KEYS[key]) {
    return res.status(400).json({ error: 'Invalid config key' });
  }
  const scope = CONFIG_KEYS[key].scope;
  const businessId = scope === 'global' ? null : req.business.id;
  const result = await configService.setConfig(key, value, businessId, req.user.id);
  if (result.error) return res.status(result.status).json({ error: result.error });
  return res.json(result);
}

export async function updateBulk(req, res) {
  const { settings } = req.body;
  if (!Array.isArray(settings)) {
    return res.status(400).json({ error: 'settings array required' });
  }
  const updated = [];
  const errors = [];
  for (const { key, value } of settings) {
    const scope = CONFIG_KEYS[key]?.scope;
    const businessId = scope === 'global' ? null : req.business.id;
    const result = await configService.setConfig(key, value, businessId, req.user.id);
    if (result.error) errors.push({ key, error: result.error });
    else updated.push(result.config);
  }
  return res.json({ updated, errors });
}

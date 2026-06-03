import { validateConfigValue, parseConfigValue, CONFIG_KEYS } from '@gohite/shared';

describe('configRegistry', () => {
  test('validates GST percentage', () => {
    const r = validateConfigValue('default_gst_percentage', '18');
    expect(r.valid).toBe(true);
    expect(r.serialized).toBe('18');
  });

  test('rejects invalid GST', () => {
    const r = validateConfigValue('default_gst_percentage', 'abc');
    expect(r.valid).toBe(false);
  });

  test('parses allowed_units json', () => {
    const units = parseConfigValue('allowed_units', CONFIG_KEYS.allowed_units.default);
    expect(Array.isArray(units)).toBe(true);
    expect(units).toContain('KG');
  });

  test('parses boolean config', () => {
    expect(parseConfigValue('enable_pos', 'true')).toBe(true);
    expect(parseConfigValue('enable_pos', 'false')).toBe(false);
  });
});

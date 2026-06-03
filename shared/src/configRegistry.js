/**
 * Central registry of all configurable keys (SSOT for admin UI + validation).
 * Values stored in SystemConfig table (global: businessId=null, or per-business).
 */
export const CONFIG_KEYS = {
  default_gst_percentage: {
    type: 'number',
    default: '18',
    scope: 'business',
    label: 'Default GST %',
    description: 'Applied when creating products without explicit GST',
  },
  expiry_alert_days: {
    type: 'number',
    default: '30',
    scope: 'business',
    label: 'Expiry alert window (days)',
    description: 'Krishi: products expiring within this many days',
    businessTypes: ['KRISHI'],
  },
  default_page_size: {
    type: 'number',
    default: '25',
    scope: 'global',
    label: 'Default page size',
    description: 'List pagination default',
  },
  max_page_size: {
    type: 'number',
    default: '100',
    scope: 'global',
    label: 'Maximum page size',
    description: 'Upper cap for list requests',
  },
  default_min_stock: {
    type: 'number',
    default: '5',
    scope: 'business',
    label: 'Default minimum stock',
    description: 'Low-stock threshold for new products',
  },
  allowed_units: {
    type: 'json',
    default: '["KG","Bags","Liters","Pieces","Boxes","Meters"]',
    scope: 'business',
    label: 'Allowed units',
    description: 'JSON array of unit options in inventory forms',
  },
  allowed_payment_types: {
    type: 'json',
    default: '["CASH","UPI","CARD","CREDIT"]',
    scope: 'business',
    label: 'Payment types',
    description: 'JSON array for POS checkout',
  },
  enable_bulk_upload: {
    type: 'boolean',
    default: 'true',
    scope: 'global',
    label: 'Enable bulk upload',
    description: 'Feature flag for Excel import',
  },
  enable_pos: {
    type: 'boolean',
    default: 'true',
    scope: 'business',
    label: 'Enable POS',
    description: 'Allow sales checkout for this business',
  },
  company_display_name: {
    type: 'string',
    default: '',
    scope: 'business',
    label: 'Display name on invoices',
    description: 'Overrides business.name on PDF if set',
  },
  invoice_footer_text: {
    type: 'string',
    default: 'Thank you for your business',
    scope: 'business',
    label: 'Invoice footer',
    description: 'Printed at bottom of PDF invoices',
  },
};

export const CONFIG_KEY_LIST = Object.keys(CONFIG_KEYS);

export function parseConfigValue(key, raw) {
  const def = CONFIG_KEYS[key];
  if (!def || raw === null || raw === undefined) return null;
  if (def.type === 'number') return Number(raw);
  if (def.type === 'boolean') return raw === 'true' || raw === true;
  if (def.type === 'json') {
    try {
      return JSON.parse(raw);
    } catch {
      return JSON.parse(def.default);
    }
  }
  return String(raw);
}

export function validateConfigValue(key, value) {
  const def = CONFIG_KEYS[key];
  if (!def) return { valid: false, error: 'Unknown config key' };
  const str = typeof value === 'string' ? value : JSON.stringify(value);
  if (def.type === 'number') {
    const n = Number(str);
    if (!Number.isFinite(n) || n < 0) return { valid: false, error: 'Must be a non-negative number' };
    return { valid: true, serialized: String(n) };
  }
  if (def.type === 'boolean') {
    if (!['true', 'false'].includes(str.toLowerCase())) {
      return { valid: false, error: 'Must be true or false' };
    }
    return { valid: true, serialized: str.toLowerCase() };
  }
  if (def.type === 'json') {
    try {
      JSON.parse(str);
      return { valid: true, serialized: str };
    } catch {
      return { valid: false, error: 'Invalid JSON' };
    }
  }
  return { valid: true, serialized: str };
}

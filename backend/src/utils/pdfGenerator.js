import PDFDocument from 'pdfkit';
import { generateHardwareInvoice } from './invoiceTemplates/hardwareInvoice.js';
import { generateKrishiInvoice } from './invoiceTemplates/krishiInvoice.js';

/**
 * Generate professional PDF invoice based on business type
 * @param {Object} sale - Sale record with items, customer info, amounts
 * @param {Object} business - Business record with name, GST, contact info, type
 * @param {Object} options - Additional options (displayName, footerText, logoPath, customFields)
 * @returns {Promise<Buffer>} PDF buffer
 */
export function generateInvoicePdf(sale, business, options = {}) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      margin: 0,
      size: 'A4',
      bufferPages: true,
    });

    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    try {
      // Determine business type and use appropriate template
      const businessType = business.type || business.businessType || options.businessType || 'HARDWARE';

      if (businessType.toUpperCase() === 'KRISHI') {
        generateKrishiInvoice(doc, sale, business, options);
      } else {
        generateHardwareInvoice(doc, sale, business, options);
      }

      doc.end();
    } catch (error) {
      doc.end();
      reject(error);
    }
  });
}

/**
 * Generate invoice for hardware business
 */
export function generateHardwareInvoicePdf(sale, business, options = {}) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      margin: 0,
      size: 'A4',
      bufferPages: true,
    });

    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    try {
      generateHardwareInvoice(doc, sale, business, options);
      doc.end();
    } catch (error) {
      doc.end();
      reject(error);
    }
  });
}

/**
 * Generate invoice for Krishi (agricultural) business
 */
export function generateKrishiInvoicePdf(sale, business, options = {}) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      margin: 0,
      size: 'A4',
      bufferPages: true,
    });

    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    try {
      generateKrishiInvoice(doc, sale, business, options);
      doc.end();
    } catch (error) {
      doc.end();
      reject(error);
    }
  });
}

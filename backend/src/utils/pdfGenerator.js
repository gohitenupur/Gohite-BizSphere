import PDFDocument from 'pdfkit';

export function generateInvoicePdf(sale, business, options = {}) {
  const displayName = options.displayName || business.name;
  const footerText = options.footerText || 'Thank you for your business';

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(18).text(displayName, { align: 'center' });
    if (business.address) doc.fontSize(10).text(business.address, { align: 'center' });
    if (business.gstNo) doc.text(`GST: ${business.gstNo}`, { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Invoice #${sale.id.slice(0, 8).toUpperCase()}`);
    doc.text(`Date: ${new Date(sale.createdAt).toLocaleString()}`);
    doc.text(`Customer: ${sale.customerName}`);
    if (sale.mobileNo) doc.text(`Mobile: ${sale.mobileNo}`);

    if (options.customFields?.length && sale.metadata) {
      options.customFields.forEach((cf) => {
        const val = sale.metadata[cf.key];
        if (val !== undefined && val !== null && String(val).trim() !== '') {
          let displayVal = '';
          if (cf.type === 'toggle') {
            displayVal = val ? 'Yes' : 'No';
          } else if (cf.type === 'multiselect') {
            displayVal = Array.isArray(val) ? val.join(', ') : String(val);
          } else if (cf.type === 'file' && typeof val === 'string' && val.startsWith('data:')) {
            displayVal = val.startsWith('data:image/') ? '[Image Attached]' : '[Document Attached]';
          } else {
            displayVal = String(val);
          }
          doc.text(`${cf.label}: ${displayVal}`);
        }
      });
    }
    doc.moveDown();

    doc.fontSize(10);
    sale.saleItems.forEach((item) => {
      doc.text(
        `${item.product.name} x ${item.quantity} @ ${item.price.toFixed(2)} = ${(item.quantity * item.price).toFixed(2)}`
      );
    });

    doc.moveDown();
    doc.fontSize(12).text(`GST: ${sale.gstAmount.toFixed(2)}`);
    doc.text(`Total: ${sale.totalAmount.toFixed(2)}`, { bold: true });
    doc.text(`Payment: ${sale.paymentType}`);
    doc.moveDown(2);
    doc.fontSize(9).text(footerText, { align: 'center' });
    doc.end();
  });
}

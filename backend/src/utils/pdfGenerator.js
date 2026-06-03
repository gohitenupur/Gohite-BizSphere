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

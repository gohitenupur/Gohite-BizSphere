import PDFDocument from 'pdfkit';

function drawRupee(doc, x, y, size, color) {
  doc.save();
  if (color) {
    if (Array.isArray(color)) {
      doc.strokeColor(...color);
    } else {
      doc.strokeColor(color);
    }
  }
  doc.lineWidth(size * 0.08).lineCap('round').lineJoin('round');

  const w = size * 0.55;
  const h = size;

  doc.moveTo(x, y + h * 0.15)
     .lineTo(x + w, y + h * 0.15)
     .stroke();

  doc.moveTo(x + w * 0.05, y + h * 0.38)
     .lineTo(x + w * 0.9, y + h * 0.38)
     .stroke();

  doc.moveTo(x + w * 0.2, y + h * 0.15)
     .lineTo(x + w * 0.2, y + h * 0.38)
     .bezierCurveTo(x + w * 0.75, y + h * 0.38, x + w * 0.75, y + h * 0.65, x + w * 0.2, y + h * 0.65)
     .stroke();

  doc.moveTo(x + w * 0.3, y + h * 0.65)
     .lineTo(x + w * 0.85, y + h * 0.95)
     .stroke();

  doc.restore();
}

function amt(doc, text, x, y, opts = {}, bold = false) {
  doc.font(bold ? 'Helvetica-Bold' : 'Helvetica');
  const size = doc._fontSize || 8.5;
  
  if (text.startsWith('₹') || text.startsWith('\u20b9')) {
    const valText = text.slice(1).trim();
    const color = doc._fillColor || '#1d1b20';
    
    const rupeeWidth = size * 0.58;
    const gap = size * 0.08;
    const totalWidth = rupeeWidth + gap + doc.widthOfString(valText);
    
    let startX = x;
    if (opts.align === 'right' && opts.width) {
      startX = x + (opts.width - totalWidth);
    } else if (opts.align === 'center' && opts.width) {
      startX = x + (opts.width - totalWidth) / 2;
    }
    
    drawRupee(doc, startX, y + size * 0.02, size, color);
    
    const textX = startX + rupeeWidth + gap;
    const textOpts = { ...opts, lineBreak: false };
    delete textOpts.align;
    delete textOpts.width;
    doc.text(valText, textX, y, textOpts);
  } else {
    doc.text(text, x, y, opts);
  }
}

export function generateSalesReportPdf(sales, business, summary) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      margin: 40,
      size: 'A4',
      bufferPages: true,
    });

    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    try {
      const isKrishi = (business.type || business.businessType || 'HARDWARE').toUpperCase() === 'KRISHI';
      const themeColor = isKrishi ? '#2E7D32' : '#4f378a';
      const zebraBg = isKrishi ? '#f0f7f0' : '#f8f2fa';
      
      const margin = 40;
      const pageWidth = doc.page.width;
      const pageHeight = doc.page.height;
      const contentWidth = pageWidth - 2 * margin; // 515.28

      // Title & Date
      doc.fillColor('#1d1b20').font('Helvetica-Bold').fontSize(18);
      doc.text('Sales Register Journal', margin, margin);
      doc.font('Helvetica').fontSize(9).fillColor('#494551');
      doc.text(`Generated on: ${new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}`, margin, margin + 22);

      // Business Info (Right aligned)
      doc.font('Helvetica-Bold').fontSize(11).fillColor('#1d1b20');
      doc.text(business.name, margin, margin, { align: 'right', width: contentWidth });
      doc.font('Helvetica').fontSize(8.5).fillColor('#494551');
      doc.text(business.address || '', margin, margin + 14, { align: 'right', width: contentWidth });
      if (business.gstNo) {
        doc.text(`GSTIN: ${business.gstNo}`, margin, margin + 25, { align: 'right', width: contentWidth });
      }

      // Decorative Top Divider
      doc.moveTo(margin, margin + 38)
         .lineTo(pageWidth - margin, margin + 38)
         .strokeColor(themeColor).lineWidth(2).stroke();

      // Summary Bento Blocks
      const boxW = (contentWidth - 20) / 3;
      const boxH = 46;
      let boxY = margin + 50;

      // 1. Total Invoices
      doc.fillColor('#f9fafb').roundedRect(margin, boxY, boxW, boxH, 6).fill();
      doc.strokeColor('#e5e7eb').lineWidth(0.5).roundedRect(margin, boxY, boxW, boxH, 6).stroke();
      doc.fillColor('#494551').font('Helvetica-Bold').fontSize(7.5).text('TOTAL SALES INVOICES', margin + 10, boxY + 8);
      doc.fillColor('#1d1b20').font('Helvetica-Bold').fontSize(14).text(String(summary.totalSales), margin + 10, boxY + 20);

      // 2. Total Revenue
      const box2X = margin + boxW + 10;
      doc.fillColor('#f9fafb').roundedRect(box2X, boxY, boxW, boxH, 6).fill();
      doc.strokeColor('#e5e7eb').lineWidth(0.5).roundedRect(box2X, boxY, boxW, boxH, 6).stroke();
      doc.fillColor('#494551').font('Helvetica-Bold').fontSize(7.5).text('TOTAL REVENUE (GROSS)', box2X + 10, boxY + 8);
      doc.fillColor(themeColor).fontSize(14);
      amt(doc, `₹${summary.totalAmount.toFixed(2)}`, box2X + 10, boxY + 18, {}, true);

      // 3. GST Collected
      const box3X = margin + (boxW * 2) + 20;
      doc.fillColor('#f9fafb').roundedRect(box3X, boxY, boxW, boxH, 6).fill();
      doc.strokeColor('#e5e7eb').lineWidth(0.5).roundedRect(box3X, boxY, boxW, boxH, 6).stroke();
      doc.fillColor('#494551').font('Helvetica-Bold').fontSize(7.5).text('GST COLLECTED', box3X + 10, boxY + 8);
      doc.fillColor('#1d1b20').fontSize(14);
      amt(doc, `₹${summary.totalGst.toFixed(2)}`, box3X + 10, boxY + 18, {}, true);

      // Table Headers
      let tableY = boxY + 65;
      const colWidths = [120, 190, 85, 120.28];
      const colAligns = ['left', 'left', 'center', 'right'];
      const headers = ['TRANSACTION DATE', 'CUSTOMER NAME', 'PAYMENT', 'AMOUNT'];

      doc.fillColor(themeColor).rect(margin, tableY, contentWidth, 22).fill();
      doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(8);
      let colX = margin;
      headers.forEach((h, idx) => {
        doc.text(h, colX + (idx === 0 ? 8 : 0), tableY + 7, {
          width: colWidths[idx] - (idx === 0 ? 8 : 0),
          align: colAligns[idx]
        });
        colX += colWidths[idx];
      });

      tableY += 22;
      const rowH = 22;

      // Table Body
      sales.forEach((s, idx) => {
        // Page Overflow handling
        if (tableY + rowH > pageHeight - margin - 30) {
          doc.addPage();
          tableY = margin + 10;
          doc.fillColor(themeColor).rect(margin, tableY, contentWidth, 22).fill();
          doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(8);
          let pColX = margin;
          headers.forEach((h, hIdx) => {
            doc.text(h, pColX + (hIdx === 0 ? 8 : 0), tableY + 7, {
              width: colWidths[hIdx] - (hIdx === 0 ? 8 : 0),
              align: colAligns[hIdx]
            });
            pColX += colWidths[hIdx];
          });
          tableY += 22;
        }

        // Zebra background
        if (idx % 2 === 1) {
          doc.fillColor(zebraBg).rect(margin, tableY, contentWidth, rowH).fill();
        }
        // Bottom row border
        doc.moveTo(margin, tableY + rowH).lineTo(pageWidth - margin, tableY + rowH).strokeColor('#e5e7eb').lineWidth(0.5).stroke();

        let cx = margin;
        
        // Transaction Date
        doc.fillColor('#494551').font('Helvetica').fontSize(8);
        const dateStr = new Date(s.createdAt).toLocaleString('en-IN');
        doc.text(dateStr, cx + 8, tableY + 7, { width: colWidths[0] - 8 });
        cx += colWidths[0];

        // Customer Name
        doc.fillColor('#1d1b20').font('Helvetica-Bold').fontSize(8.5);
        doc.text(s.customerName, cx, tableY + 7, { width: colWidths[1] });
        cx += colWidths[1];

        // Payment Mode
        doc.fillColor('#494551').font('Helvetica').fontSize(8);
        doc.text(s.paymentType, cx, tableY + 7, { width: colWidths[2], align: 'center' });
        cx += colWidths[2];

        // Amount
        doc.fillColor(themeColor).font('Helvetica-Bold').fontSize(8.5);
        amt(doc, `₹${s.totalAmount.toFixed(2)}`, cx, tableY + 7, { width: colWidths[3], align: 'right' }, true);

        tableY += rowH;
      });

      // Pagination Footer (dynamic page numbers)
      const range = doc.bufferedPageRange();
      for (let i = range.start; i < range.start + range.count; i++) {
        doc.switchToPage(i);
        doc.page.margins.bottom = 0; // disable bottom margin wrapping
        doc.save();
        doc.moveTo(margin, pageHeight - 35).lineTo(pageWidth - margin, pageHeight - 35).strokeColor('#e5e7eb').lineWidth(0.5).stroke();
        doc.fillColor('#494551').font('Helvetica').fontSize(8);
        doc.text(`Page ${i + 1} of ${range.count}`, margin, pageHeight - 25, { align: 'center', width: contentWidth });
        doc.restore();
      }

      doc.end();
    } catch (err) {
      doc.end();
      reject(err);
    }
  });
}

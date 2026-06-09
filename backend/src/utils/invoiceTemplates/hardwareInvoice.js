/**
 * Hardware Hub Invoice Template
 * Matches theme/invoice_pdf mockups:
 *  - Logo stacked above company name (left)
 *  - Faded INVOICE watermark top-right
 *  - BILL TO / SHIPPING TO two-column with drawn vector icons + dividers
 *  - Purple table header, zebra rows
 *  - Payment details block with dynamic drawn payment mode icon
 *  - Three dashes footer ornament + segmented purple bottom bar
 *  - Dynamically drawn Rupee (₹) vector symbols to guarantee cross-platform support without font bugs
 */

export function generateHardwareInvoice(doc, sale, business, options = {}) {
  const displayName = options.displayName || business.name;
  const footerText = options.footerText || 'Thank you for your business';
  const margin = 40;
  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;
  const contentWidth = pageWidth - 2 * margin; // 515.28

  // Set colors
  const primaryColor = '#4f378a'; // Professional corporate purple
  const textColor = '#1d1b20';
  const textVariantColor = '#494551';
  const borderLight = '#cbc4d2';
  const zebraBg = '#f8f2fa'; // Very light purple tint
  const WHITE = '#ffffff';

  // Reset page position
  doc.x = margin;
  doc.y = margin;

  // ── Vector Icon Drawing Helpers ────────────────────────────────────────
  function drawPersonIcon(doc, x, y, color) {
    doc.save();
    doc.fillColor(color);
    doc.circle(x + 4.5, y + 3, 2.5).fill();
    doc.roundedRect(x + 1, y + 6.5, 7, 4.5, 1.5).fill();
    doc.restore();
  }

  // Truck icon
  function drawTruckIcon(doc, x, y, color) {
    doc.save();
    doc.fillColor(color);
    doc.rect(x, y + 1.5, 8.5, 5).fill();
    doc.rect(x + 8.5, y + 3, 3.5, 3.5).fill();
    doc.circle(x + 2, y + 7.5, 1.2).fill();
    doc.circle(x + 8.5, y + 7.5, 1.2).fill();
    doc.restore();
  }

  // Payment mode icon
  function drawPaymentIcon(doc, x, y, color, type) {
    doc.save();
    const mode = String(type).toUpperCase();
    if (mode === 'CASH') {
      doc.strokeColor(color).lineWidth(0.8);
      doc.roundedRect(x + 2, y, 14, 8, 1.5).stroke();
      doc.fillColor(WHITE).roundedRect(x, y + 2, 14, 8, 1.5).fill();
      doc.strokeColor(color).roundedRect(x, y + 2, 14, 8, 1.5).stroke();
      doc.fillColor(color).circle(x + 7, y + 6, 1.5).fill();
    } else if (mode === 'CARD') {
      doc.fillColor(color).roundedRect(x, y + 1, 16, 10, 2).fill();
      doc.fillColor(WHITE).rect(x, y + 3.5, 16, 2.5).fill();
    } else if (mode === 'UPI') {
      doc.strokeColor(color).lineWidth(1);
      doc.roundedRect(x + 2, y, 11, 12, 1.5).stroke();
      doc.fillColor(color).circle(x + 7.5, y + 10, 0.8).fill();
      doc.fillColor(color).rect(x + 4, y + 2, 7, 6).fill();
    } else {
      doc.strokeColor(color).lineWidth(0.8);
      doc.roundedRect(x, y + 1, 15, 10, 1.5).stroke();
      doc.fillColor(color).circle(x + 7.5, y + 6, 2).fill();
    }
    doc.restore();
  }

  // Draw Rupee vector paths
  function drawRupee(doc, x, y, size, color) {
    doc.save();
    
    // Safely set stroke color supporting both string and raw PDFKit color arrays
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

    // Top bar
    doc.moveTo(x, y + h * 0.15)
       .lineTo(x + w, y + h * 0.15)
       .stroke();

    // Middle bar
    doc.moveTo(x + w * 0.05, y + h * 0.38)
       .lineTo(x + w * 0.9, y + h * 0.38)
       .stroke();

    // Stem + Loop
    doc.moveTo(x + w * 0.2, y + h * 0.15)
       .lineTo(x + w * 0.2, y + h * 0.38)
       .bezierCurveTo(x + w * 0.75, y + h * 0.38, x + w * 0.75, y + h * 0.65, x + w * 0.2, y + h * 0.65)
       .stroke();

    // Diagonal slash
    doc.moveTo(x + w * 0.3, y + h * 0.65)
       .lineTo(x + w * 0.85, y + h * 0.95)
       .stroke();

    doc.restore();
  }

  // Helper — always render currency using vector drawn Rupee (₹) symbol
  function drawAmount(text, x, y, opts = {}, bold = false) {
    doc.font(bold ? 'Helvetica-Bold' : 'Helvetica');
    const size = doc._fontSize || 8.5;
    
    if (text.startsWith('₹') || text.startsWith('\u20b9')) {
      const valText = text.slice(1).trim();
      const color = doc._fillColor || textColor || '#1d1b20';
      
      const rupeeWidth = size * 0.58;
      const gap = size * 0.08;
      const totalWidth = rupeeWidth + gap + doc.widthOfString(valText);
      
      let startX = x;
      if (opts.align === 'right' && opts.width) {
        startX = x + (opts.width - totalWidth);
      } else if (opts.align === 'center' && opts.width) {
        startX = x + (opts.width - totalWidth) / 2;
      }
      
      // Draw Rupee vector paths using the active fill/stroke color
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

  // ===== BACKGROUND WATERMARK =====
  doc.save();
  doc.fillColor(primaryColor).opacity(0.015);
  doc.fontSize(110).font('Helvetica-Bold');
  doc.text('HARDWARE', 0, 320, { align: 'center', width: pageWidth });
  doc.restore();

  // ===== HEADER SECTION =====
  // Company Logo Badge / Uploaded Logo
  let logoDrawn = false;
  if (options.logoPath) {
    try {
      doc.image(options.logoPath, margin, margin, { width: 55, height: 55 });
      logoDrawn = true;
    } catch (e) {
      // Image load failed, fallback to badge
    }
  }
  
  if (!logoDrawn) {
    // Beautiful default purple logo badge
    doc.save();
    doc.fillColor(primaryColor).roundedRect(margin, margin, 50, 50, 10).fill();
    doc.fillColor('#ffffff').fontSize(26).font('Helvetica-Bold');
    doc.text('H', margin, margin + 10, { width: 50, align: 'center' });
    doc.restore();
  }

  // Company Name and Info
  doc.save();
  doc.fillColor(textColor).font('Helvetica-Bold').fontSize(18);
  doc.text(displayName, margin + 65, margin, { width: contentWidth - 200 });

  doc.fillColor(textVariantColor).font('Helvetica').fontSize(9);
  doc.text(business.address || 'Industrial Area, Phase 1', margin + 65, margin + 22);
  doc.text(`Phone: ${business.phone || business.mobile || '+91 99999 88888'}`, margin + 65, margin + 34);
  doc.restore();

  // Right Side Header (Invoice metadata)
  doc.save();
  // Faded "INVOICE" watermark text in top right
  doc.fillColor('#ede6ff').font('Helvetica-Bold').fontSize(38);
  doc.text('INVOICE', pageWidth - margin - 180, margin - 10, { width: 180, align: 'right' });

  // Metadata labels & values
  const metaX = pageWidth - margin - 180;
  doc.fillColor(textColor).font('Helvetica').fontSize(8);
  
  doc.text('INVOICE NUMBER', metaX, margin + 24, { width: 180, align: 'right' });
  doc.font('Helvetica-Bold').fontSize(9).text(`#${sale.id.slice(0, 8).toUpperCase()}`, metaX, margin + 33, { width: 180, align: 'right' });

  doc.font('Helvetica').fontSize(8).text('DATE', metaX, margin + 46, { width: 180, align: 'right' });
  doc.font('Helvetica-Bold').fontSize(8).text(new Date(sale.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }), metaX, margin + 55, { width: 180, align: 'right' });

  if (business.gstNo) {
    doc.font('Helvetica').fontSize(8).text('GST NUMBER', metaX, margin + 68, { width: 180, align: 'right' });
    doc.font('Helvetica-Bold').fontSize(8).text(business.gstNo, metaX, margin + 77, { width: 180, align: 'right' });
  }
  doc.restore();

  // Solid purple horizontal divider
  doc.moveTo(margin, margin + 95)
     .lineTo(pageWidth - margin, margin + 95)
     .strokeColor(primaryColor)
     .lineWidth(3.5)
     .stroke();

  // ===== BILLING & SHIPPING DETAILS GRID =====
  let detailsY = margin + 110;
  
  // Left Column: Bill To
  doc.save();
  drawPersonIcon(doc, margin, detailsY + 1, primaryColor);
  doc.fillColor(textVariantColor).font('Helvetica-Bold').fontSize(8.5).text('BILL TO', margin + 14, detailsY + 1);
  
  // Draw under-border for Section Header
  doc.moveTo(margin, detailsY + 13).lineTo(margin + 180, detailsY + 13).strokeColor(borderLight).lineWidth(0.5).stroke();

  let customerY = detailsY + 20;
  doc.fillColor(textColor).font('Helvetica-Bold').fontSize(11).text(sale.customerName || 'Walk-in Customer', margin, customerY);
  customerY += 14;

  doc.font('Helvetica').fontSize(9).fillColor(textVariantColor);
  if (sale.mobileNo) {
    doc.text(`Mobile: ${sale.mobileNo}`, margin, customerY);
    customerY += 12;
  }
  
  // Render Dynamic Custom Fields (like Delivery Address, GSTIN) inside Customer block
  if (options.customFields && sale.metadata) {
    options.customFields.forEach(cf => {
      const val = sale.metadata[cf.key];
      if (val !== undefined && val !== null && String(val).trim() !== '') {
        let displayVal = String(val).trim();
        if (cf.type === 'toggle') displayVal = val ? 'Yes' : 'No';
        
        doc.text(`${cf.label}: ${displayVal}`, margin, customerY);
        customerY += 12;
      }
    });
  }
  doc.restore();

  // Right Column: Shipping To & Payment Status
  const rightColX = pageWidth - margin - 220; // width 220
  doc.save();
  drawTruckIcon(doc, rightColX, detailsY + 1, primaryColor);
  doc.fillColor(textVariantColor).font('Helvetica-Bold').fontSize(8.5).text('SHIPPING TO', rightColX + 17, detailsY + 1);
  
  doc.moveTo(rightColX, detailsY + 13).lineTo(pageWidth - margin, detailsY + 13).strokeColor(borderLight).lineWidth(0.5).stroke();

  let shippingY = detailsY + 20;
  doc.fillColor(textColor).font('Helvetica-Bold').fontSize(10).text('Standard Delivery', rightColX, shippingY);
  shippingY += 13;
  doc.fillColor(textVariantColor).font('Helvetica-Oblique').fontSize(8.5).text('Same as Billing Address', rightColX, shippingY);

  // Status Badge Box
  const statusBoxY = shippingY + 15;
  doc.fillColor('#fbfaff')
     .roundedRect(rightColX, statusBoxY, 220, 36, 6)
     .fill();
  doc.strokeColor('#e6e1f5')
     .lineWidth(1)
     .roundedRect(rightColX, statusBoxY, 220, 36, 6)
     .stroke();

  doc.fillColor(textVariantColor).font('Helvetica-Bold').fontSize(7.5).text('STATUS', rightColX + 10, statusBoxY + 7);
  
  // Paid Pill Badge inside box
  const isPaid = (sale.paymentStatus || 'Completed').toUpperCase() === 'COMPLETED';
  const badgeBgColor = isPaid ? '#ede6ff' : '#fff3e0';
  const badgeTextColor = isPaid ? primaryColor : '#ef6c00';
  const badgeLabel = isPaid ? 'PAID & DELIVERED' : (sale.paymentStatus || 'CREDIT').toUpperCase();

  doc.fillColor(badgeBgColor).roundedRect(rightColX + 10, statusBoxY + 16, 110, 13, 6.5).fill();
  doc.fillColor(badgeTextColor).font('Helvetica-Bold').fontSize(7.5).text(badgeLabel, rightColX + 10, statusBoxY + 19, { width: 110, align: 'center' });
  doc.restore();

  // Calculate maximum Y of customer & status columns to place the table below them
  let tableTop = Math.max(customerY, statusBoxY + 45) + 10;

  // ===== PRODUCTS TABLE =====
  // Columns: SKU (60), Item Description (150), Category (85), Qty (35), Unit (40), Rate (65), Amount (80.28)
  const colWidths = [60, 150, 85, 35, 40, 65, 80.28];
  const colAlignments = ['left', 'left', 'left', 'center', 'center', 'right', 'right'];

  // Table header background
  doc.fillColor(primaryColor).rect(margin, tableTop, contentWidth, 24).fill();
  
  doc.fillColor('#ffffff').fontSize(8.5).font('Helvetica-Bold');
  const headers = ['SKU', 'ITEM DESCRIPTION', 'CATEGORY', 'QTY', 'UNIT', 'RATE', 'AMOUNT'];
  let colX = margin;
  headers.forEach((header, idx) => {
    doc.text(header, colX + (idx === 0 ? 6 : 0), tableTop + 7, {
      width: colWidths[idx] - (idx === 0 ? 6 : 0),
      align: colAlignments[idx]
    });
    colX += colWidths[idx];
  });

  // Table rows
  let tableY = tableTop + 24;
  const rowHeight = 26;

  sale.saleItems.forEach((item, idx) => {
    // Graceful page overflow handling
    if (tableY + rowHeight > pageHeight - 160) {
      // Draw border under table on current page
      doc.moveTo(margin, tableY).lineTo(pageWidth - margin, tableY).strokeColor(primaryColor).lineWidth(1).stroke();
      doc.addPage();
      
      // Draw watermark on new page
      doc.save();
      doc.fillColor(primaryColor).opacity(0.015).fontSize(110).font('Helvetica-Bold').text('HARDWARE', 0, 320, { align: 'center', width: pageWidth });
      doc.restore();

      // Redraw table header
      tableY = margin + 20;
      doc.fillColor(primaryColor).rect(margin, tableY, contentWidth, 24).fill();
      doc.fillColor('#ffffff').fontSize(8.5).font('Helvetica-Bold');
      let pageColX = margin;
      headers.forEach((h, hIdx) => {
        doc.text(h, pageColX + (hIdx === 0 ? 6 : 0), tableY + 7, {
          width: colWidths[hIdx] - (hIdx === 0 ? 6 : 0),
          align: colAlignments[hIdx]
        });
        pageColX += colWidths[hIdx];
      });
      tableY += 24;
    }

    const itemAmount = (item.quantity * item.price).toFixed(2);
    const sku = item.product.sku || `SKU-${idx + 1}`;
    const category = item.product.category?.name || item.product.category || 'General';

    // Alternate row backgrounds (zebra striping)
    if (idx % 2 === 0) {
      doc.fillColor(zebraBg).rect(margin, tableY, contentWidth, rowHeight).fill();
    }
    
    // Draw row bottom light border line
    doc.moveTo(margin, tableY + rowHeight).lineTo(pageWidth - margin, tableY + rowHeight).strokeColor('#e5e7eb').lineWidth(0.5).stroke();

    doc.fillColor(textColor).font('Helvetica-Bold').fontSize(8.5);
    
    let cellX = margin;
    
    // SKU
    doc.font('Helvetica').fontSize(8).text(sku, cellX + 6, tableY + 8, { width: colWidths[0] - 6, align: 'left' });
    cellX += colWidths[0];

    // Item Description
    doc.font('Helvetica-Bold').fontSize(8.5).text(item.product.name, cellX, tableY + 8, { width: colWidths[1], align: 'left' });
    cellX += colWidths[1];

    // Category
    doc.font('Helvetica').fontSize(8.5).text(category, cellX, tableY + 8, { width: colWidths[2], align: 'left' });
    cellX += colWidths[2];

    // Qty
    doc.text(item.quantity.toString(), cellX, tableY + 8, { width: colWidths[3], align: 'center' });
    cellX += colWidths[3];

    // Unit
    doc.text(item.unit || 'pcs', cellX, tableY + 8, { width: colWidths[4], align: 'center' });
    cellX += colWidths[4];

    // Rate
    drawAmount(`₹${item.price.toFixed(2)}`, cellX, tableY + 8, { width: colWidths[5], align: 'right' });
    cellX += colWidths[5];

    // Total Amount
    drawAmount(`₹${itemAmount}`, cellX, tableY + 8, { width: colWidths[6], align: 'right' }, true);

    tableY += rowHeight;
  });

  // Draw final border under table
  doc.moveTo(margin, tableY).lineTo(pageWidth - margin, tableY).strokeColor(primaryColor).lineWidth(1).stroke();

  // ===== PAYMENT DETAILS & TOTALS GRID =====
  let summaryY = tableY + 15;

  // Left Side: Payment details
  doc.save();
  doc.fillColor(textColor).font('Helvetica-Bold').fontSize(9).text('PAYMENT DETAILS', margin, summaryY);
  
  const icX = margin, icY = summaryY + 14;
  drawPaymentIcon(doc, icX, icY, primaryColor, sale.paymentType || 'CASH');
  doc.fillColor(textColor).font('Helvetica-Bold').fontSize(9)
     .text(`Mode: ${(sale.paymentType || 'CASH').toUpperCase()}`, margin + 22, icY + 1);

  // Terms and conditions
  let termsY = summaryY + 35;
  doc.fillColor(textVariantColor).font('Helvetica-Bold').fontSize(7.5).text('Terms & Conditions:', margin, termsY);
  doc.font('Helvetica').fontSize(6.5).text('Goods once sold will not be taken back. This is a computer generated invoice and does not require a physical signature.', margin, termsY + 10, { width: 230 });
  doc.restore();

  // Right Side: Summary Totals
  const totalsX = pageWidth - margin - 200; // width 200
  doc.save();
  doc.font('Helvetica').fontSize(9).fillColor(textVariantColor);
  
  // Subtotal (GST excluded)
  const subtotal = sale.totalAmount - sale.gstAmount;
  doc.font('Helvetica').fontSize(9).fillColor(textVariantColor).text('Subtotal', totalsX, summaryY);
  drawAmount(`₹${subtotal.toFixed(2)}`, totalsX + 100, summaryY, { width: 100, align: 'right' });
  summaryY += 14;

  // Total GST
  doc.font('Helvetica').fontSize(9).fillColor(textVariantColor).text('Total GST', totalsX, summaryY);
  drawAmount(`₹${sale.gstAmount.toFixed(2)}`, totalsX + 100, summaryY, { width: 100, align: 'right' });
  summaryY += 13;

  // CGST & SGST (split equally)
  const halfGst = sale.gstAmount / 2;
  doc.font('Helvetica-Oblique').fontSize(8).fillColor(textVariantColor);
  doc.text('CGST (9%)', totalsX + 10, summaryY);
  drawAmount(`₹${halfGst.toFixed(2)}`, totalsX + 100, summaryY, { width: 100, align: 'right' });
  summaryY += 11;

  doc.font('Helvetica-Oblique').fontSize(8).fillColor(textVariantColor);
  doc.text('SGST (9%)', totalsX + 10, summaryY);
  drawAmount(`₹${halfGst.toFixed(2)}`, totalsX + 100, summaryY, { width: 100, align: 'right' });
  summaryY += 16;

  // Grand Total in colored block
  doc.fillColor(primaryColor).roundedRect(totalsX, summaryY, 200, 26, 4).fill();
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(10).text('GRAND TOTAL', totalsX + 10, summaryY + 8);
  drawAmount(`₹${sale.totalAmount.toFixed(2)}`, totalsX + 100, summaryY + 7, { width: 90, align: 'right' }, true);
  doc.restore();

  // ===== FOOTER NOTES SECTION =====
  const footerBaseY = pageHeight - margin - 56;
  doc.save();

  // Light separator
  doc.moveTo(margin, footerBaseY)
     .lineTo(pageWidth - margin, footerBaseY)
     .strokeColor(borderLight).lineWidth(0.5).stroke();

  // Three decorative dashes (centered)
  const cX  = pageWidth / 2;
  const dashW = 28, dashH = 3, dashGap = 10;
  const d1X = cX - dashW - dashGap / 2 - dashW / 2;
  const d2X = cX - dashW / 2;
  const d3X = cX + dashGap / 2 + dashW / 2;
  doc.fillColor(primaryColor).opacity(0.3).rect(d1X, footerBaseY + 10, dashW, dashH).fill();
  doc.fillColor(primaryColor).opacity(0.7).rect(d2X, footerBaseY + 10, dashW, dashH).fill();
  doc.fillColor(primaryColor).opacity(0.3).rect(d3X, footerBaseY + 10, dashW, dashH).fill();
  doc.opacity(1); // restore

  // "Thank you for your business" — italic bold purple, centered
  doc.fillColor(primaryColor).font('Helvetica-BoldOblique').fontSize(14)
     .text(footerText, margin, footerBaseY + 20, { align: 'center', width: contentWidth });

  // Contact line — centered gray
  doc.fillColor(textVariantColor).font('Helvetica').fontSize(8)
     .text('For any inquiries, please contact support@gohitehardware.in • Durability • Precision • Support',
           margin, footerBaseY + 37, { align: 'center', width: contentWidth });

  // Segmented purple bottom bar (3 sections with lighter middle)
  const barY = pageHeight - 14;
  const third = pageWidth / 3;
  doc.fillColor(primaryColor).opacity(0.92).rect(0,      barY, third,   14).fill();
  doc.fillColor(primaryColor).opacity(1.00).rect(third,  barY, third,   14).fill();
  doc.fillColor(primaryColor).opacity(0.92).rect(third*2, barY, third,  14).fill();
  doc.opacity(1);

  doc.restore();
}

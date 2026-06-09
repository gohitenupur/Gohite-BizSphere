/**
 * Krishi Seva Kendra Invoice Template
 * Matches theme/invoice_pdf/screen.png reference exactly:
 *  - Logo stacked above company name (left)
 *  - Faded INVOICE watermark top-right
 *  - BILL TO / SHIPPING TO two-column with drawn vector icons + dividers
 *  - Green table header, zebra rows
 *  - Payment details block with dynamic drawn payment mode icon
 *  - Three dashes footer ornament + segmented green bottom bar
 *  - Dynamically drawn Rupee (₹) vector symbols to guarantee cross-platform support without font bugs
 */

export function generateKrishiInvoice(doc, sale, business, options = {}) {
  const displayName  = options.displayName || business.name;
  const footerText   = options.footerText  || 'Thank you for your business';
  const margin       = 40;
  const pageWidth    = doc.page.width;   // 595.28 (A4)
  const pageHeight   = doc.page.height;  // 841.89 (A4)
  const contentWidth = pageWidth - 2 * margin;

  // ── Brand colors (matches screen.png / code.html) ──────────────────────
  const GREEN        = '#2E7D32';   // agri-green — header bar, table, grand-total
  const GREEN_LIGHT  = '#c8e6c9';   // watermark / status badge bg
  const GREEN_FAINT  = '#f0f7f0';   // zebra even row
  const TEXT         = '#1d1b20';   // on-surface
  const TEXT_VAR     = '#494551';   // on-surface-variant
  const OUTLINE      = '#cbc4d2';   // border-light
  const WHITE        = '#ffffff';

  // ── Vector Icon Drawing Helpers ────────────────────────────────────────
  function drawPersonIcon(doc, x, y, color) {
    doc.save();
    doc.fillColor(color);
    doc.circle(x + 4.5, y + 3, 2.5).fill();
    doc.roundedRect(x + 1, y + 6.5, 7, 4.5, 1.5).fill();
    doc.restore();
  }

  function drawTruckIcon(doc, x, y, color) {
    doc.save();
    doc.fillColor(color);
    doc.rect(x, y + 1.5, 8.5, 5).fill();
    doc.rect(x + 8.5, y + 3, 3.5, 3.5).fill();
    doc.circle(x + 2, y + 7.5, 1.2).fill();
    doc.circle(x + 8.5, y + 7.5, 1.2).fill();
    doc.restore();
  }

  function drawPaymentIcon(doc, x, y, color, type) {
    doc.save();
    const mode = String(type).toUpperCase();
    if (mode === 'CASH') {
      // Cash stack icon (payments look)
      doc.strokeColor(color).lineWidth(0.8);
      doc.roundedRect(x + 2, y, 14, 8, 1.5).stroke();
      doc.fillColor(WHITE).roundedRect(x, y + 2, 14, 8, 1.5).fill();
      doc.strokeColor(color).roundedRect(x, y + 2, 14, 8, 1.5).stroke();
      doc.fillColor(color).circle(x + 7, y + 6, 1.5).fill();
    } else if (mode === 'CARD') {
      // Credit card icon
      doc.fillColor(color).roundedRect(x, y + 1, 16, 10, 2).fill();
      doc.fillColor(WHITE).rect(x, y + 3.5, 16, 2.5).fill();
    } else if (mode === 'UPI') {
      // UPI Mobile scan icon
      doc.strokeColor(color).lineWidth(1);
      doc.roundedRect(x + 2, y, 11, 12, 1.5).stroke();
      doc.fillColor(color).circle(x + 7.5, y + 10, 0.8).fill();
      doc.fillColor(color).rect(x + 4, y + 2, 7, 6).fill();
    } else {
      // Wallet/generic payments icon
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
  function amt(text, x, y, opts = {}, bold = false) {
    doc.font(bold ? 'Helvetica-Bold' : 'Helvetica');
    const size = doc._fontSize || 8.5;
    
    if (text.startsWith('₹') || text.startsWith('\u20b9')) {
      const valText = text.slice(1).trim();
      const color = doc._fillColor || TEXT || '#1d1b20';
      
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

  // ════════════════════════════════════════════════════════════════
  //  HEADER  (matches screen.png layout: logo stacked over name)
  // ════════════════════════════════════════════════════════════════
  const LOGO_SIZE = 55;
  let logoY = margin;

  // Logo — image or fallback green badge
  let logoDrawn = false;
  if (options.logoPath) {
    try {
      doc.image(options.logoPath, margin, logoY, { fit: [LOGO_SIZE, LOGO_SIZE] });
      logoDrawn = true;
    } catch (_) {}
  }
  if (!logoDrawn) {
    doc.save()
       .fillColor(GREEN)
       .roundedRect(margin, logoY, LOGO_SIZE, LOGO_SIZE, 10)
       .fill()
       .fillColor(WHITE)
       .font('Helvetica-Bold')
       .fontSize(26)
       .text('G', margin, logoY + 10, { width: LOGO_SIZE, align: 'center' })
       .restore();
  }

  // Company name + address — stacked BELOW logo
  const nameY = logoY + LOGO_SIZE + 8;
  doc.save()
     .fillColor(TEXT).font('Helvetica-Bold').fontSize(14)
     .text(displayName, margin, nameY, { width: contentWidth - 200 })
     .fillColor(TEXT_VAR).font('Helvetica').fontSize(9)
     .text(business.address || 'Main Road, Village Center', margin, nameY + 18)
     .text(`Phone: ${business.phone || business.mobile || '+91 98765 43210'}`, margin, nameY + 30)
     .restore();

  // ── Right meta block ────────────────────────────────────────────
  const metaW = 190;
  const metaX = pageWidth - margin - metaW;

  doc.save();
  // Faded "INVOICE" watermark
  doc.fillColor(GREEN_LIGHT).font('Helvetica-Bold').fontSize(34)
     .text('INVOICE', metaX, margin - 4, { width: metaW, align: 'right' });

  // INVOICE NUMBER
  doc.fillColor(TEXT_VAR).font('Helvetica').fontSize(7)
     .text('INVOICE NUMBER', metaX, margin + 30, { width: metaW, align: 'right' });
  doc.fillColor(TEXT).font('Helvetica-Bold').fontSize(10)
     .text(`#${sale.id.slice(0, 8).toUpperCase()}`, metaX, margin + 39, { width: metaW, align: 'right' });

  // DATE
  const saleDate = new Date(sale.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
  doc.fillColor(TEXT_VAR).font('Helvetica').fontSize(7)
     .text('DATE', metaX, margin + 54, { width: metaW, align: 'right' });
  doc.fillColor(TEXT).font('Helvetica-Bold').fontSize(9)
     .text(saleDate, metaX, margin + 63, { width: metaW, align: 'right' });

  // GST NUMBER
  if (business.gstNo) {
    doc.fillColor(TEXT_VAR).font('Helvetica').fontSize(7)
       .text('GST NUMBER', metaX, margin + 78, { width: metaW, align: 'right' });
    doc.fillColor(TEXT).font('Helvetica-Bold').fontSize(9)
       .text(business.gstNo, metaX, margin + 87, { width: metaW, align: 'right' });
  }
  doc.restore();

  // ── 4px green header divider ────────────────────────────────────
  const headerBottom = Math.max(nameY + 46, margin + 102);
  doc.save()
     .moveTo(margin, headerBottom)
     .lineTo(pageWidth - margin, headerBottom)
     .strokeColor(GREEN).lineWidth(3.5).stroke()
     .restore();

  // ════════════════════════════════════════════════════════════════
  //  BILLING & SHIPPING SECTION
  // ════════════════════════════════════════════════════════════════
  const billingY  = headerBottom + 18;
  const colHalf   = contentWidth / 2;
  const rightCol  = margin + colHalf + 16;

  // ── BILL TO (left) ──────────────────────────────────────────────
  doc.save();
  drawPersonIcon(doc, margin, billingY + 1, GREEN);
  doc.fillColor(TEXT_VAR).font('Helvetica-Bold').fontSize(8.5)
     .text('BILL TO', margin + 14, billingY + 1);

  // underline
  doc.moveTo(margin, billingY + 13)
     .lineTo(margin + colHalf - 12, billingY + 13)
     .strokeColor(OUTLINE).lineWidth(0.5).stroke();

  let custY = billingY + 20;
  doc.fillColor(TEXT).font('Helvetica-Bold').fontSize(11)
     .text(sale.customerName || 'Cash Customer', margin, custY);
  custY += 14;

  doc.font('Helvetica').fontSize(9).fillColor(TEXT_VAR);

  if (options.customFields && sale.metadata) {
    options.customFields.forEach(cf => {
      const val = sale.metadata[cf.key];
      if (val !== undefined && val !== null && String(val).trim() !== '') {
        let dv = String(val).trim();
        if (cf.type === 'toggle') dv = val ? 'Yes' : 'No';
        doc.text(`${cf.label}: ${dv}`, margin, custY);
        custY += 12;
      }
    });
  }
  if (sale.mobileNo)   { doc.text(`Mobile: ${sale.mobileNo}`, margin, custY);         custY += 12; }
  if (business.gstNo)  { doc.text(`GSTIN: ${business.gstNo}`, margin, custY, { characterSpacing: 0.3 }); custY += 12; }
  doc.restore();

  // ── SHIPPING TO (right) ─────────────────────────────────────────
  doc.save();
  drawTruckIcon(doc, rightCol, billingY + 1, GREEN);
  doc.fillColor(TEXT_VAR).font('Helvetica-Bold').fontSize(8.5)
     .text('SHIPPING TO', rightCol + 17, billingY + 1);

  doc.moveTo(rightCol, billingY + 13)
     .lineTo(pageWidth - margin, billingY + 13)
     .strokeColor(OUTLINE).lineWidth(0.5).stroke();

  let shipY = billingY + 20;
  doc.fillColor(TEXT).font('Helvetica-Bold').fontSize(10)
     .text('Standard Delivery', rightCol, shipY);
  shipY += 13;
  doc.fillColor(TEXT_VAR).font('Helvetica-Oblique').fontSize(9)
     .text('Same as Billing Address', rightCol, shipY);

  // Status box
  const stBoxY = shipY + 14;
  const stBoxW = colHalf - 16;
  doc.fillColor('#f9fafb')
     .roundedRect(rightCol, stBoxY, stBoxW, 34, 6).fill();
  doc.strokeColor('#dce8dd').lineWidth(1)
     .roundedRect(rightCol, stBoxY, stBoxW, 34, 6).stroke();

  doc.fillColor(TEXT_VAR).font('Helvetica-Bold').fontSize(7)
     .text('STATUS', rightCol + 10, stBoxY + 8);

  // Paid pill
  const isPaid      = (sale.paymentStatus || 'Completed').toUpperCase() === 'COMPLETED';
  const pillBg      = isPaid ? '#c8e6c9' : '#fff3e0';
  const pillTxt     = isPaid ? GREEN : '#e65100';
  const pillLabel   = isPaid ? 'PAID & DELIVERED' : (sale.paymentStatus || 'PENDING').toUpperCase();

  doc.fillColor(pillBg).roundedRect(rightCol + 10, stBoxY + 17, 110, 12, 6).fill();
  doc.fillColor(pillTxt).font('Helvetica-Bold').fontSize(7.5)
     .text(pillLabel, rightCol + 10, stBoxY + 20, { width: 110, align: 'center' });
  doc.restore();

  // ════════════════════════════════════════════════════════════════
  //  PRODUCTS TABLE
  // ════════════════════════════════════════════════════════════════
  const COL  = [215, 40, 90, 65, contentWidth - 215 - 40 - 90 - 65];
  const ALIGN = ['left', 'center', 'right', 'center', 'right'];
  const HDRS  = ['ITEM DESCRIPTION', 'QTY', 'UNIT PRICE', 'GST %', 'TOTAL'];

  let tableTop = Math.max(custY, stBoxY + 44) + 14;

  // Header bar
  doc.fillColor(GREEN).rect(margin, tableTop, contentWidth, 24).fill();
  doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(8.5);
  let hX = margin;
  HDRS.forEach((h, i) => {
    doc.text(h, hX + (i === 0 ? 8 : 0), tableTop + 7, {
      width: COL[i] - (i === 0 ? 8 : 0), align: ALIGN[i]
    });
    hX += COL[i];
  });

  let tableY   = tableTop + 24;
  const ROW_H  = 26;

  sale.saleItems.forEach((item, idx) => {
    // Page overflow
    if (tableY + ROW_H > pageHeight - 160) {
      doc.moveTo(margin, tableY).lineTo(pageWidth - margin, tableY)
         .strokeColor(GREEN).lineWidth(1).stroke();
      doc.addPage();
      tableY = margin + 20;
      doc.fillColor(GREEN).rect(margin, tableY, contentWidth, 24).fill();
      doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(8.5);
      let phX = margin;
      HDRS.forEach((h, i) => {
        doc.text(h, phX + (i === 0 ? 8 : 0), tableY + 7, {
          width: COL[i] - (i === 0 ? 8 : 0), align: ALIGN[i]
        });
        phX += COL[i];
      });
      tableY += 24;
    }

    const itemTotal = (item.quantity * item.price).toFixed(2);
    const gstRate   = item.product?.gstPercentage ?? 18;

    // Zebra stripe (even rows = faint green)
    if (idx % 2 !== 0) {
      doc.fillColor(GREEN_FAINT).rect(margin, tableY, contentWidth, ROW_H).fill();
    }
    // Row bottom border
    doc.moveTo(margin, tableY + ROW_H)
       .lineTo(pageWidth - margin, tableY + ROW_H)
       .strokeColor('#e5e7eb').lineWidth(0.4).stroke();

    let cellX = margin;

    // Product name (bold, red if expiring soon)
    let pName = item.product?.name || 'Item';
    let expiring = false;
    if (item.product?.expiryDate) {
      const daysLeft = Math.ceil((new Date(item.product.expiryDate) - new Date()) / 86400000);
      if (daysLeft < 30) {
        expiring = true;
        pName += ` (Expiring: ${new Date(item.product.expiryDate).toLocaleDateString('en-IN')})`;
      }
    }
    doc.fillColor(expiring ? '#ba1a1a' : TEXT).font('Helvetica-Bold').fontSize(8.5)
       .text(pName, cellX + 8, tableY + 8, { width: COL[0] - 8, align: 'left' });
    cellX += COL[0];

    // Qty
    doc.fillColor(TEXT_VAR).font('Helvetica').fontSize(8.5)
       .text(String(item.quantity), cellX, tableY + 8, { width: COL[1], align: 'center' });
    cellX += COL[1];

    // Unit Price
    doc.fillColor(TEXT).font('Helvetica').fontSize(8.5);
    amt(`₹${item.price.toFixed(2)}`, cellX, tableY + 8, { width: COL[2], align: 'right' });
    cellX += COL[2];

    // GST %
    doc.fillColor(TEXT_VAR).font('Helvetica').fontSize(8.5)
       .text(`${gstRate}%`, cellX, tableY + 8, { width: COL[3], align: 'center' });
    cellX += COL[3];

    // Total
    doc.fillColor(TEXT);
    amt(`₹${itemTotal}`, cellX, tableY + 8, { width: COL[4], align: 'right' }, true);

    tableY += ROW_H;
  });

  // Bottom table border (green)
  doc.moveTo(margin, tableY).lineTo(pageWidth - margin, tableY)
     .strokeColor(GREEN).lineWidth(1).stroke();

  // ════════════════════════════════════════════════════════════════
  //  SUMMARY  —  Payment (left)  |  Totals (right)
  // ════════════════════════════════════════════════════════════════
  let sumY = tableY + 18;

  // ── LEFT: Payment Details ───────────────────────────────────────
  doc.save();
  doc.fillColor(TEXT).font('Helvetica-Bold').fontSize(8.5)
     .text('PAYMENT DETAILS', margin, sumY);

  const icX = margin, icY = sumY + 14;
  drawPaymentIcon(doc, icX, icY, GREEN, sale.paymentType || 'CASH');
  doc.fillColor(TEXT).font('Helvetica-Bold').fontSize(9)
     .text(`Mode: ${(sale.paymentType || 'CASH').toUpperCase()}`, margin + 22, icY + 1);

  // Terms
  const termsY = sumY + 33;
  doc.fillColor(TEXT).font('Helvetica-Bold').fontSize(7.5)
     .text('Terms & Conditions:', margin, termsY);
  doc.fillColor(TEXT_VAR).font('Helvetica').fontSize(6.5)
     .text(
       'Goods once sold will not be taken back. This is a computer generated invoice and does not require a physical signature.',
       margin, termsY + 10, { width: 220 }
     );
  doc.restore();

  // ── RIGHT: Totals ───────────────────────────────────────────────
  const totW  = 200;
  const totX  = pageWidth - margin - totW;
  doc.save();

  const subtotal = sale.totalAmount - sale.gstAmount;
  const halfGst  = sale.gstAmount / 2;
  let   tY       = sumY;

  // Subtotal
  doc.fillColor(TEXT_VAR).font('Helvetica').fontSize(9)
     .text('Subtotal', totX, tY);
  amt(`₹${subtotal.toFixed(2)}`, totX + 100, tY, { width: 100, align: 'right' });
  tY += 14;

  // Total GST
  doc.fillColor(TEXT_VAR).font('Helvetica').fontSize(9)
     .text('Total GST', totX, tY);
  amt(`₹${sale.gstAmount.toFixed(2)}`, totX + 100, tY, { width: 100, align: 'right' });
  tY += 12;

  // CGST
  doc.fillColor(TEXT_VAR).font('Helvetica-Oblique').fontSize(8)
     .text('CGST (9%)', totX + 10, tY);
  amt(`₹${halfGst.toFixed(2)}`, totX + 100, tY, { width: 100, align: 'right' });
  tY += 11;

  // SGST
  doc.fillColor(TEXT_VAR).font('Helvetica-Oblique').fontSize(8)
     .text('SGST (9%)', totX + 10, tY);
  amt(`₹${halfGst.toFixed(2)}`, totX + 100, tY, { width: 100, align: 'right' });
  tY += 16;

  // Grand Total pill
  doc.fillColor(GREEN).roundedRect(totX, tY, totW, 26, 5).fill();
  doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(10)
     .text('GRAND TOTAL', totX + 10, tY + 8);
  amt(`₹${sale.totalAmount.toFixed(2)}`, totX + 100, tY + 7, { width: 90, align: 'right' }, true);
  doc.restore();

  // ════════════════════════════════════════════════════════════════
  //  FOOTER  (matches screen.png: dashes → thank you → contact → green strip)
  // ════════════════════════════════════════════════════════════════
  const footY = pageHeight - margin - 56;
  doc.save();

  // Light separator
  doc.moveTo(margin, footY)
     .lineTo(pageWidth - margin, footY)
     .strokeColor(OUTLINE).lineWidth(0.5).stroke();

  // Three decorative dashes (centered)
  const cX  = pageWidth / 2;
  const dashW = 28, dashH = 3, dashGap = 10;
  const d1X = cX - dashW - dashGap / 2 - dashW / 2;
  const d2X = cX - dashW / 2;
  const d3X = cX + dashGap / 2 + dashW / 2;
  doc.fillColor(GREEN).opacity(0.3).rect(d1X, footY + 10, dashW, dashH).fill();
  doc.fillColor(GREEN).opacity(0.7).rect(d2X, footY + 10, dashW, dashH).fill();
  doc.fillColor(GREEN).opacity(0.3).rect(d3X, footY + 10, dashW, dashH).fill();
  doc.opacity(1); // restore

  // "Thank you for your business" — italic bold green, centered
  doc.fillColor(GREEN).font('Helvetica-BoldOblique').fontSize(14)
     .text(footerText, margin, footY + 20, { align: 'center', width: contentWidth });

  // Contact line — centered gray
  doc.fillColor(TEXT_VAR).font('Helvetica').fontSize(8)
     .text('For any inquiries, please contact gohite@krishiseva.in',
           margin, footY + 37, { align: 'center', width: contentWidth });

  // Segmented green bottom bar (3 sections with lighter middle)
  const barY = pageHeight - 14;
  const third = pageWidth / 3;
  doc.fillColor(GREEN).opacity(0.92).rect(0,      barY, third,   14).fill();
  doc.fillColor(GREEN).opacity(1.00).rect(third,  barY, third,   14).fill();
  doc.fillColor(GREEN).opacity(0.92).rect(third*2, barY, third,  14).fill();
  doc.opacity(1);

  doc.restore();
}

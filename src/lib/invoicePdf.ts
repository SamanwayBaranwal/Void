/**
 * Native, vector A4 invoice PDF — drawn with precise coordinates (not a DOM
 * screenshot), so alignment is pixel-perfect, text is crisp vector, the
 * background is pure black, and it looks identical on every device.
 */

export interface InvoicePdfData {
  invoiceNumber: string;
  createdAt: string;
  dueDate?: string | null;
  status: string;
  from: { name: string; sub?: string | null; wallet?: string | null; email?: string | null; site?: string | null };
  to:   { name: string; company?: string | null; wallet?: string | null; email?: string | null };
  item: { title: string; description?: string | null };
  amount: number; // USD
  notes?: string | null;
  payment: { network: string; method: string; wallet?: string | null; paidOn?: string | null; txHash?: string | null };
  qrDataUrl?: string | null;
}

const C = {
  white: [245, 245, 245] as [number, number, number],
  grey:  [120, 128, 140] as [number, number, number],
  dim:   [80, 88, 100] as [number, number, number],
  faint: [55, 60, 70] as [number, number, number],
  green: [110,231,183] as [number, number, number],
  line:  [38, 40, 46] as [number, number, number],
  card:  [8, 9, 11] as [number, number, number],
};

const money = (n: number) =>
  '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const shortAddr = (a?: string | null) => (a && a.length > 14 ? `${a.slice(0, 6)}…${a.slice(-4)}` : a || '');

export async function generateInvoicePdf(data: InvoicePdfData): Promise<void> {
  const { default: jsPDF } = await import('jspdf');
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const W = 210, H = 297;
  const M = 16;                 // page margin
  const right = W - M;          // right edge of content
  const colMid = W / 2 + 2;     // start of the TO / right column

  // ── helpers ───────────────────────────────────────────────
  const text = (
    s: string, x: number, y: number,
    o: { size?: number; color?: [number, number, number]; font?: 'courier' | 'helvetica'; style?: 'normal' | 'bold'; align?: 'left' | 'center' | 'right'; ls?: number } = {},
  ) => {
    pdf.setFont(o.font || 'courier', o.style || 'normal');
    pdf.setFontSize(o.size || 9);
    pdf.setTextColor(...(o.color || C.white));
    pdf.text(s, x, y, { align: o.align || 'left', charSpace: o.ls || 0 });
  };
  const hline = (x1: number, y: number, x2: number, color = C.line, w = 0.3, dashed = false) => {
    pdf.setDrawColor(...color); pdf.setLineWidth(w);
    if (dashed) pdf.setLineDashPattern([0.8, 0.8], 0); else pdf.setLineDashPattern([], 0);
    pdf.line(x1, y, x2, y);
    pdf.setLineDashPattern([], 0);
  };
  const dots = (x: number, y: number, cell = 1.5, gap = 0.7, color = C.white) => {
    pdf.setFillColor(...color);
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++)
      pdf.rect(x + c * (cell + gap), y + r * (cell + gap), cell, cell, 'F');
  };

  // ── page background (pure black) ──────────────────────────
  pdf.setFillColor(0, 0, 0);
  pdf.rect(0, 0, W, H, 'F');

  // corner brackets
  pdf.setDrawColor(...C.white); pdf.setLineWidth(0.5);
  const b = 6, off = 8;
  const bracket = (x: number, y: number, dx: number, dy: number) => {
    pdf.line(x, y, x + dx * b, y); pdf.line(x, y, x, y + dy * b);
  };
  bracket(off, off, 1, 1); bracket(W - off, off, -1, 1);
  bracket(off, H - off, 1, -1); bracket(W - off, H - off, -1, -1);

  // ── header: logo (left) + meta (right) ───────────────────
  let y = 24;
  dots(M, y - 4, 1.6, 0.8);
  text('VOID', M + 8.5, y, { size: 17, style: 'bold', ls: 0.6 });

  const metaRow = (label: string, value: string, ry: number, vColor = C.white) => {
    text(label, right, ry, { size: 6.5, color: C.grey, align: 'right', ls: 0.4 });
    text(value, right, ry + 4, { size: 9, color: vColor, align: 'right' });
  };
  metaRow('INVOICE DATE', data.createdAt, 18);
  if (data.dueDate) metaRow('DUE DATE', data.dueDate, 28);
  metaRow('STATUS', data.status.toUpperCase(),
    38, data.status === 'paid' ? C.green : data.status === 'overdue' ? [255, 90, 90] : [251, 191, 36]);

  // ── invoice number + paid badge ──────────────────────────
  y = 58;
  text('INVOICE', M, y, { size: 8, color: C.grey, ls: 0.8 });
  text(`#${data.invoiceNumber}`, M, y + 10, { size: 22, style: 'bold' });
  if (data.status === 'paid') {
    const bx = M, by = y + 14, bw = 52, bh = 7;
    pdf.setFillColor(2, 26, 20); pdf.setDrawColor(0, 90, 65); pdf.setLineWidth(0.3);
    pdf.roundedRect(bx, by, bw, bh, 1.5, 1.5, 'FD');
    pdf.setFillColor(...C.green); pdf.circle(bx + 4, by + bh / 2, 0.9, 'F');
    text('PAYMENT CONFIRMED', bx + 7, by + 4.7, { size: 7, color: C.green, ls: 0.5 });
  }

  // ── FROM / TO ─────────────────────────────────────────────
  y = 92;
  const party = (x: number, label: string, p: { name: string; sub?: string | null; wallet?: string | null; email?: string | null; site?: string | null }, isDots: boolean) => {
    text(label, x, y, { size: 7, color: C.grey, ls: 0.8 });
    // avatar circle
    pdf.setDrawColor(...C.line); pdf.setLineWidth(0.3);
    pdf.circle(x + 4, y + 11, 4.5, 'S');
    if (isDots) dots(x + 1.7, y + 8.7, 1.1, 0.5); else {
      // simple user glyph
      pdf.setFillColor(...C.white);
      pdf.circle(x + 4, y + 9.6, 1.1, 'F');
      pdf.roundedRect(x + 1.6, y + 11.4, 4.8, 2.6, 1.3, 1.3, 'F');
    }
    const tx = x + 11.5;
    text(p.name, tx, y + 8, { size: 12, style: 'bold' });
    let ly = y + 12.5;
    if (p.wallet) { text(shortAddr(p.wallet), tx, ly, { size: 8.5, color: C.grey }); ly += 4; }
    if (p.email)  { text(p.email, tx, ly, { size: 8.5, color: C.dim }); ly += 4; }
    if (p.site)   { text(p.site, tx, ly, { size: 8.5, color: C.dim }); ly += 4; }
    if (p.sub && !p.site) text(p.sub, tx, ly, { size: 8.5, color: C.dim });
  };
  party(M, 'FROM', data.from, true);
  party(colMid, 'TO', { name: data.to.name, sub: data.to.company, wallet: data.to.wallet, email: data.to.email }, false);

  // ── line items ────────────────────────────────────────────
  y = 128;
  const cItem = M, cDesc = M + 46, cAmt = right;
  text('ITEM', cItem, y, { size: 7, color: C.grey, ls: 0.6 });
  text('DESCRIPTION', cDesc, y, { size: 7, color: C.grey, ls: 0.6 });
  text('AMOUNT', cAmt, y, { size: 7, color: C.grey, ls: 0.6, align: 'right' });
  hline(M, y + 3, right);
  y += 9;
  text(`01. ${data.item.title}`, cItem, y, { size: 10, style: 'bold' });
  const desc = pdf.splitTextToSize(data.item.description || '—', cAmt - cDesc - 24);
  text(desc, cDesc, y, { size: 9, color: C.grey });
  text(money(data.amount), cAmt, y, { size: 10, align: 'right' });
  hline(M, y + 6, right);

  // ── notes (left) + totals (right) ─────────────────────────
  y = 158;
  text('NOTES', M, y, { size: 7, color: C.grey, ls: 0.6 });
  const notes = pdf.splitTextToSize(data.notes || 'Thank you for your business! This invoice was generated on-chain and is verified by VOID.', 78);
  text(notes, M, y + 6, { size: 8.5, color: C.grey });

  text('TOTAL DUE', colMid, y, { size: 7, color: C.grey, ls: 0.6 });
  text(money(data.amount), colMid, y + 12, { size: 24, style: 'bold' });
  let ty = y + 22;
  const totalRow = (label: string, value: string, bold = false) => {
    text(label, colMid, ty, { size: 9, color: bold ? C.white : C.grey, style: bold ? 'bold' : 'normal' });
    text(value, right, ty, { size: 9, color: bold ? C.white : C.grey, style: bold ? 'bold' : 'normal', align: 'right' });
    ty += 6;
  };
  totalRow('Subtotal', money(data.amount));
  totalRow('Tax (0%)', money(0));
  hline(colMid, ty - 2.5, right);
  ty += 1;
  totalRow('Total', money(data.amount), true);

  // ── payment details (left) + QR (right) ───────────────────
  y = 222;
  hline(M, y - 6, right, C.line, 0.3, true);
  text('PAYMENT DETAILS', M, y, { size: 7, color: C.grey, ls: 0.6 });
  let py = y + 7;
  const detail = (k: string, v: string) => {
    text(k, M, py, { size: 8.5, color: C.dim });
    text(v, M + 42, py, { size: 8.5, color: C.white });
    py += 6;
  };
  detail('Network', data.payment.network);
  detail('Payment Method', data.payment.method);
  if (data.payment.wallet) detail('Wallet Address', shortAddr(data.payment.wallet));
  if (data.payment.paidOn) detail('Paid On', data.payment.paidOn);
  if (data.payment.txHash) detail('Transaction', shortAddr(data.payment.txHash));

  // QR card
  const qx = colMid, qy = y - 2, qcardW = right - colMid, qcardH = 36;
  pdf.setDrawColor(...C.line); pdf.setLineWidth(0.3);
  pdf.roundedRect(qx, qy, qcardW, qcardH, 2, 2, 'S');
  if (data.qrDataUrl) {
    pdf.setFillColor(255, 255, 255);
    pdf.roundedRect(qx + 4, qy + 4, 28, 28, 1, 1, 'F');
    try { pdf.addImage(data.qrDataUrl, 'PNG', qx + 5.5, qy + 5.5, 25, 25); } catch { /* ignore */ }
  }
  text('Scan to verify', qx + 36, qy + 11, { size: 8.5, style: 'bold' });
  const qrNote = pdf.splitTextToSize('Verify this invoice and payment on the blockchain.', qcardW - 38);
  text(qrNote, qx + 36, qy + 16, { size: 7.5, color: C.dim });

  // ── footer ────────────────────────────────────────────────
  dots(W / 2 - 8, H - 21, 1.1, 0.5, C.grey);
  text('Powered by VOID', W / 2 + 1, H - 18, { size: 8, color: C.grey, ls: 0.4 });

  pdf.save(`invoice-${data.invoiceNumber || 'void'}.pdf`);
}

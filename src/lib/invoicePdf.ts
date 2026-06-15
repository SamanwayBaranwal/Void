/**
 * Render an invoice DOM element to a clean black A4 PDF and download it.
 * No print dialog, no margin/background toggles — works the same for every user.
 */
export async function downloadInvoicePdf(el: HTMLElement, filename: string): Promise<void> {
  const [{ default: jsPDF }, html2canvasMod] = await Promise.all([
    import('jspdf'),
    import('html2canvas'),
  ]);
  const html2canvas = (html2canvasMod as any).default || html2canvasMod;

  // Temporarily drop the faint card border/radius so the PDF has no white edge
  const prevBorder = el.style.border;
  const prevRadius = el.style.borderRadius;
  el.style.border = 'none';
  el.style.borderRadius = '0';

  let canvas: HTMLCanvasElement;
  try {
    canvas = await html2canvas(el, {
      backgroundColor: '#000000',
      scale: 3,            // high-res capture → crisp text
      useCORS: true,
      logging: false,
    });
  } finally {
    el.style.border = prevBorder;
    el.style.borderRadius = prevRadius;
  }

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = pdf.internal.pageSize.getWidth();   // 210
  const pageH = pdf.internal.pageSize.getHeight();  // 297

  // Pure-black page background
  pdf.setFillColor(0, 0, 0);
  pdf.rect(0, 0, pageW, pageH, 'F');

  // Contain the capture within the page (keeps aspect, single page)
  const imgRatio = canvas.width / canvas.height;
  const pageRatio = pageW / pageH;
  let w: number, h: number;
  if (imgRatio > pageRatio) { w = pageW; h = pageW / imgRatio; }
  else { h = pageH; w = pageH * imgRatio; }
  const x = (pageW - w) / 2;
  const y = (pageH - h) / 2;

  pdf.addImage(canvas.toDataURL('image/png'), 'PNG', x, y, w, h, undefined, 'FAST');
  pdf.save(filename);
}

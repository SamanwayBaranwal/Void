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

  // Snapshot inline styles we override, so we can restore them after capture
  const saved = {
    border: el.style.border,
    borderRadius: el.style.borderRadius,
    width: el.style.width,
    maxWidth: el.style.maxWidth,
    padding: el.style.padding,
  };
  // Render at a fixed, clean invoice width + consistent padding so the PDF
  // is always well-aligned (not cramped to a narrow screen / mobile column)
  el.style.border = 'none';
  el.style.borderRadius = '0';
  el.style.width = '800px';
  el.style.maxWidth = '800px';
  el.style.padding = '56px';

  let canvas: HTMLCanvasElement;
  try {
    canvas = await html2canvas(el, {
      backgroundColor: '#000000',
      scale: 3,            // high-res capture → crisp text
      useCORS: true,
      logging: false,
      windowWidth: 900,
    });
  } finally {
    el.style.border = saved.border;
    el.style.borderRadius = saved.borderRadius;
    el.style.width = saved.width;
    el.style.maxWidth = saved.maxWidth;
    el.style.padding = saved.padding;
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

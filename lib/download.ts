import type { SkinAnalysis } from "./types";

/** Trigger a browser download of a data URL (e.g. a generated PNG). */
export function downloadDataUrl(dataUrl: string, filename: string): void {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = src;
  });
}

/** Draw an image cover-cropped (centered) into a destination rectangle. */
function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  dx: number,
  dy: number,
  dw: number,
  dh: number,
): void {
  const scale = Math.max(dw / img.width, dh / img.height);
  const sw = dw / scale;
  const sh = dh / scale;
  const sx = (img.width - sw) / 2;
  const sy = (img.height - sh) / 2;
  ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
}

function drawPill(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  bg: string,
  fg: string,
): void {
  ctx.font = "600 34px Helvetica, Arial, sans-serif";
  const padX = 26;
  const h = 64;
  const w = ctx.measureText(text).width + padX * 2;
  const r = h / 2;
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = fg;
  ctx.textBaseline = "middle";
  ctx.fillText(text, x + padX, y + h / 2 + 2);
}

/**
 * Stitch the REAL (untouched) before selfie and the generated after into one
 * labelled side-by-side PNG, so the downloadable / PDF artifact is a genuine
 * before/after rather than a re-rendered collage. Returns a PNG data URL.
 */
export async function composeBeforeAfter(
  before: string,
  after: string,
): Promise<string> {
  const PANEL = 1024;
  const W = PANEL * 2;
  const H = PANEL;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return after;

  const [b, a] = await Promise.all([loadImage(before), loadImage(after)]);
  drawCover(ctx, b, 0, 0, PANEL, H);
  drawCover(ctx, a, PANEL, 0, PANEL, H);

  // Divider between the two panels.
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(PANEL - 3, 0, 6, H);

  drawPill(ctx, "BEFORE", 32, 32, "rgba(255,255,255,0.85)", "#3a3324");
  drawPill(ctx, "AFTER", PANEL + 32, 32, "#c9a227", "#ffffff");

  return canvas.toDataURL("image/png");
}

/**
 * Build and download a branded PDF of the full analysis. jsPDF is imported
 * dynamically so it stays out of the initial bundle.
 */
export async function downloadAnalysisPdf(opts: {
  analysis: SkinAnalysis;
  before: string;
  after: string | null;
  map: string | null;
}): Promise<void> {
  const { analysis, before, after, map } = opts;
  // Build the labelled side-by-side before/after (real selfie + generated after).
  const beforeAfter = after ? await composeBeforeAfter(before, after) : null;
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 40;
  const cw = pageW - margin * 2;
  let y = margin;

  const ensure = (h: number) => {
    if (y + h > pageH - margin) {
      doc.addPage();
      y = margin;
    }
  };
  const heading = (text: string, size = 13) => {
    ensure(size + 8);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(size);
    doc.setTextColor(33, 29, 22);
    doc.text(text, margin, y);
    y += size + 4;
  };
  const body = (text: string, size = 11, color: [number, number, number] = [60, 55, 45]) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(size);
    doc.setTextColor(...color);
    const lines = doc.splitTextToSize(text, cw) as string[];
    ensure(lines.length * (size + 3));
    doc.text(lines, margin, y);
    y += lines.length * (size + 3) + 8;
  };

  // Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(33, 29, 22);
  doc.text("HARLEY STREET AESTHETICS", margin, y);
  y += 16;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(180, 140, 45);
  doc.text("Skin Analysis · The Skin Studio", margin, y);
  y += 16;
  doc.setDrawColor(201, 162, 39);
  doc.line(margin, y, pageW - margin, y);
  y += 22;

  heading("Your Skin Consultation", 18);
  body(analysis.summary);

  // Scores
  heading("Skin scores");
  analysis.categories.forEach((c) => {
    ensure(34);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(60, 55, 45);
    doc.text(c.label, margin, y);
    doc.text(`${c.score}/100`, pageW - margin - 44, y);
    const barY = y + 4;
    doc.setFillColor(235, 230, 210);
    doc.rect(margin, barY, cw, 5, "F");
    doc.setFillColor(201, 162, 39);
    doc.rect(margin, barY, (cw * Math.max(0, Math.min(100, c.score))) / 100, 5, "F");
    y += 18;
    doc.setFontSize(9);
    doc.setTextColor(120, 110, 90);
    const note = doc.splitTextToSize(c.note, cw) as string[];
    ensure(note.length * 11);
    doc.text(note, margin, y);
    y += note.length * 11 + 8;
  });
  y += 4;

  // Before/after — labelled side-by-side composite (2:1).
  if (beforeAfter) {
    heading("Before & After — your Veluria preview");
    const h = cw * 0.5;
    ensure(h + 4);
    doc.addImage(beforeAfter, "PNG", margin, y, cw, h);
    y += h + 16;
  }

  // Assessment map (square)
  if (map) {
    heading("Your assessment map");
    const size = Math.min(cw, 340);
    ensure(size + 4);
    doc.addImage(map, "PNG", margin, y, size, size);
    y += size + 16;
  }

  heading("How Veluria could help");
  body(analysis.veluriaRecommendation);

  ensure(30);
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.setTextColor(140, 130, 110);
  const dis = doc.splitTextToSize(analysis.disclaimer, cw) as string[];
  ensure(dis.length * 10);
  doc.text(dis, margin, y);

  doc.save("Harley-Street-Aesthetics-Skin-Analysis.pdf");
}

import { calculateBoldBoundary } from './bionicAlgorithm.js';
import { pdfjsLib } from './pdfRenderer.js';

const CJK_FONT = "'Noto Sans SC', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif";
const SERIF_FONT = "'Times New Roman', 'Noto Serif', Georgia, serif";
const SANS_FONT = "'Helvetica Neue', 'Noto Sans', Arial, sans-serif";

function isCJKStr(s) {
  for (let i = 0; i < s.length; i++) {
    const c = s.codePointAt(i);
    if ((c >= 0x4e00 && c <= 0x9fff) || (c >= 0x3400 && c <= 0x4dbf)) return true;
  }
  return false;
}

function pickFont(fontFamily, text) {
  if (isCJKStr(text)) return CJK_FONT;
  if (fontFamily && fontFamily.toLowerCase().includes('serif')) return SERIF_FONT;
  return SANS_FONT;
}

function sampleBg(ctx, x, y) {
  try {
    const px = Math.max(0, Math.floor(x));
    const py = Math.max(0, Math.floor(y));
    const pixel = ctx.getImageData(px, py, 1, 1).data;
    return `rgb(${pixel[0]},${pixel[1]},${pixel[2]})`;
  } catch {
    return '#ffffff';
  }
}

export function applyBionicToCanvas(canvas, textContent, viewport, ratio = 0.45) {
  const ctx = canvas.getContext('2d');
  const { items, styles } = textContent;
  if (!items || items.length === 0) return;

  const vpTransform = viewport.transform;
  const scale = viewport.scale;

  const prepared = [];

  for (const item of items) {
    if (!item.str || item.str.trim() === '') continue;

    const tx = pdfjsLib.Util.transform(vpTransform, item.transform);
    const x = tx[4];
    const y = tx[5];

    // Font size: use the larger of horizontal/vertical scale
    const fontSize = Math.max(
      Math.hypot(tx[0], tx[1]),
      Math.hypot(tx[2], tx[3]),
    );

    const style = styles?.[item.fontName];
    const fontFamily = pickFont(style?.fontFamily, item.str);
    const segments = calculateBoldBoundary(item.str, ratio);

    // Measure the total rendered width of our bionic text
    ctx.font = `normal ${fontSize}px ${fontFamily}`;
    let renderedWidth = 0;
    for (const seg of segments) {
      const w = seg.bold ? 'bold' : 'normal';
      ctx.font = `${w} ${fontSize}px ${fontFamily}`;
      renderedWidth += ctx.measureText(seg.text).width;
    }

    // Original width in canvas pixels
    const originalWidth = item.width ? item.width * scale : renderedWidth;

    prepared.push({
      x, y, fontSize, fontFamily, segments, originalWidth, renderedWidth,
    });
  }

  // Pass 1: erase all original text
  ctx.fillStyle = '#ffffff';
  for (const p of prepared) {
    const pad = 2;
    ctx.fillRect(
      p.x - pad,
      p.y - p.fontSize * 1.15,
      p.originalWidth + pad * 2,
      p.fontSize * 1.4,
    );
  }

  // Pass 2: render bionic text, scaled to fit original width
  for (const p of prepared) {
    const scaleX = p.renderedWidth > 0 ? p.originalWidth / p.renderedWidth : 1;

    ctx.save();
    ctx.textBaseline = 'alphabetic';

    if (Math.abs(scaleX - 1) > 0.01) {
      ctx.translate(p.x, 0);
      ctx.scale(scaleX, 1);
      ctx.translate(-p.x, 0);
    }

    let currentX = p.x;
    for (const seg of p.segments) {
      const weight = seg.bold ? 'bold' : 'normal';
      ctx.font = `${weight} ${p.fontSize}px ${p.fontFamily}`;
      ctx.fillStyle = '#000000';
      ctx.fillText(seg.text, currentX, p.y);
      currentX += ctx.measureText(seg.text).width;
    }

    ctx.restore();
  }
}

import { jsPDF } from 'jspdf';

export async function exportPagesToPDF(canvases, pageWidths, pageHeights, onProgress) {
  if (canvases.length === 0) return;

  const firstW = pageWidths[0];
  const firstH = pageHeights[0];
  const ptToMM = 0.352778;

  const pdf = new jsPDF({
    orientation: firstW > firstH ? 'landscape' : 'portrait',
    unit: 'mm',
    format: [firstW * ptToMM, firstH * ptToMM],
  });

  for (let i = 0; i < canvases.length; i++) {
    if (i > 0) {
      const w = pageWidths[i];
      const h = pageHeights[i];
      pdf.addPage([w * ptToMM, h * ptToMM], w > h ? 'landscape' : 'portrait');
    }

    const canvas = canvases[i];
    const imgData = canvas.toDataURL('image/jpeg', 0.92);
    const wMM = pageWidths[i] * ptToMM;
    const hMM = pageHeights[i] * ptToMM;
    pdf.addImage(imgData, 'JPEG', 0, 0, wMM, hMM);

    if (onProgress) onProgress(i + 1, canvases.length);
  }

  pdf.save('bionic-reading.pdf');
}

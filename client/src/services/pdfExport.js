import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export async function exportPagesToPDF(canvases, pageWidths, pageHeights, textContents, viewports, onProgress) {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  for (let i = 0; i < canvases.length; i++) {
    const w = pageWidths[i];
    const h = pageHeights[i];
    const page = pdfDoc.addPage([w, h]);

    // Draw the bionic canvas as page image
    const blob = await new Promise((resolve) => canvases[i].toBlob(resolve, 'image/jpeg', 0.92));
    const imgBytes = await blob.arrayBuffer();
    const img = await pdfDoc.embedJpg(imgBytes);
    page.drawImage(img, { x: 0, y: 0, width: w, height: h });

    // Overlay invisible text layer for selection/copy
    const textContent = textContents[i];
    const vp = viewports[i];
    if (textContent?.items) {
      const vpTransform = vp.transform;
      for (const item of textContent.items) {
        if (!item.str || item.str.trim() === '') continue;

        const tx = [
          vpTransform[0] * item.transform[0] + vpTransform[2] * item.transform[1],
          vpTransform[1] * item.transform[0] + vpTransform[3] * item.transform[1],
          vpTransform[0] * item.transform[2] + vpTransform[2] * item.transform[3],
          vpTransform[1] * item.transform[2] + vpTransform[3] * item.transform[3],
          vpTransform[0] * item.transform[4] + vpTransform[2] * item.transform[5] + vpTransform[4],
          vpTransform[1] * item.transform[4] + vpTransform[3] * item.transform[5] + vpTransform[5],
        ];

        const fontSize = Math.max(1, Math.hypot(tx[2], tx[3]) || Math.hypot(tx[0], tx[1]));
        const canvasX = tx[4];
        const canvasY = tx[5];

        // Convert canvas coords to PDF coords (flip Y)
        const pdfX = canvasX / vp.scale;
        const pdfY = h - canvasY / vp.scale;

        try {
          page.drawText(item.str, {
            x: pdfX,
            y: pdfY,
            size: fontSize / vp.scale,
            font,
            color: rgb(1, 1, 1), // white = invisible on white bg
            opacity: 0, // fully transparent
          });
        } catch {
          // Skip characters not in Helvetica (e.g. CJK)
        }
      }
    }

    if (onProgress) onProgress(i + 1, canvases.length);
  }

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'bionic-reading.pdf';
  a.click();
  URL.revokeObjectURL(url);
}

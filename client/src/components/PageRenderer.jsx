import React, { useRef, useEffect, useState } from 'react';
import { applyBionicToCanvas } from '../services/bionicEngine.js';
import { pdfjsLib } from '../services/pdfRenderer.js';

export default function PageRenderer({ page, scale, boldRatio }) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const textLayerRef = useRef(null);
  const [rendered, setRendered] = useState(false);
  const renderKeyRef = useRef(0);

  useEffect(() => {
    if (!page) return;
    let cancelled = false;
    const key = ++renderKeyRef.current;

    const render = async () => {
      const viewport = page.getViewport({ scale });
      const canvas = canvasRef.current;
      if (!canvas) return;

      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d');

      await page.render({ canvasContext: ctx, viewport }).promise;
      if (cancelled || renderKeyRef.current !== key) return;

      const textContent = await page.getTextContent();
      if (cancelled || renderKeyRef.current !== key) return;

      applyBionicToCanvas(canvas, textContent, viewport, boldRatio);

      if (textLayerRef.current) {
        textLayerRef.current.innerHTML = '';
        const textLayer = new pdfjsLib.TextLayer({
          textContentSource: textContent,
          container: textLayerRef.current,
          viewport,
        });
        await textLayer.render();
      }

      setRendered(true);
    };

    setRendered(false);
    render();

    return () => { cancelled = true; };
  }, [page, scale, boldRatio]);

  const viewport = page?.getViewport({ scale });

  return (
    <div
      className="page-wrapper"
      ref={containerRef}
      style={{
        width: viewport?.width,
        height: viewport?.height,
        opacity: rendered ? 1 : 0.3,
        transition: 'opacity 0.2s',
      }}
    >
      <canvas ref={canvasRef} />
      <div className="text-layer" ref={textLayerRef} />
    </div>
  );
}

import React, { useState, useCallback, useRef } from 'react';
import Upload from './components/Upload.jsx';
import Toolbar from './components/Toolbar.jsx';
import PDFViewer from './components/PDFViewer.jsx';
import { loadDocument } from './services/pdfRenderer.js';
import { exportPagesToPDF } from './services/pdfExport.js';
import { applyBionicToCanvas } from './services/bionicEngine.js';

export default function App() {
  const [loaded, setLoaded] = useState(false);
  const [filename, setFilename] = useState('');
  const [pages, setPages] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.5);
  const [boldRatio, setBoldRatio] = useState(0.45);
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(null);
  const docRef = useRef(null);

  const handleFileReady = useCallback(async (file) => {
    setFilename(file.name);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const doc = await loadDocument({ data: arrayBuffer });
      docRef.current = doc;
      const loadedPages = [];
      for (let i = 1; i <= doc.numPages; i++) {
        loadedPages.push(await doc.getPage(i));
      }
      setPages(loadedPages);
      setCurrentPage(1);
      setLoaded(true);
    } catch (err) {
      alert('Failed to load PDF: ' + err.message);
    }
  }, []);

  const handleDownload = useCallback(async () => {
    if (!docRef.current || exporting) return;
    setExporting(true);
    setExportProgress({ current: 0, total: pages.length });

    try {
      const exportScale = 2.0;
      const canvases = [];
      const widths = [];
      const heights = [];

      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        const viewport = page.getViewport({ scale: exportScale });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');

        await page.render({ canvasContext: ctx, viewport }).promise;
        const textContent = await page.getTextContent();
        applyBionicToCanvas(canvas, textContent, viewport, boldRatio);

        canvases.push(canvas);

        const baseViewport = page.getViewport({ scale: 1.0 });
        widths.push(baseViewport.width);
        heights.push(baseViewport.height);

        setExportProgress({ current: i + 1, total: pages.length });
      }

      await exportPagesToPDF(canvases, widths, heights, (current, total) => {
        setExportProgress({ current, total });
      });
    } catch (err) {
      alert('Export failed: ' + err.message);
    } finally {
      setExporting(false);
      setExportProgress(null);
    }
  }, [pages, boldRatio, exporting]);

  const handleBack = useCallback(() => {
    setLoaded(false);
    setPages([]);
    setFilename('');
    docRef.current = null;
  }, []);

  if (!loaded) {
    return <Upload onFileReady={handleFileReady} />;
  }

  return (
    <div className="app-container">
      <Toolbar
        filename={filename}
        currentPage={currentPage}
        totalPages={pages.length}
        scale={scale}
        boldRatio={boldRatio}
        exporting={exporting}
        onPrev={() => setCurrentPage((p) => Math.max(1, p - 1))}
        onNext={() => setCurrentPage((p) => Math.min(pages.length, p + 1))}
        onZoomIn={() => setScale((s) => Math.min(3.0, s + 0.25))}
        onZoomOut={() => setScale((s) => Math.max(0.5, s - 0.25))}
        onBoldRatioChange={setBoldRatio}
        onDownload={handleDownload}
        onBack={handleBack}
      />
      <PDFViewer
        pages={pages}
        scale={scale}
        boldRatio={boldRatio}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
      />
      {exportProgress && (
        <div className="loading-overlay">
          <div className="loading-box">
            <h3>Exporting PDF...</h3>
            <p>{exportProgress.current} / {exportProgress.total} pages</p>
            <div className="progress-bar">
              <div
                className="fill"
                style={{ width: `${(exportProgress.current / exportProgress.total) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

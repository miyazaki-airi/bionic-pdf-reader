import React, { useRef, useCallback } from 'react';
import PageRenderer from './PageRenderer.jsx';

export default function PDFViewer({ pages, scale, boldRatio, currentPage, onPageChange }) {
  const containerRef = useRef(null);

  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const pageEls = container.querySelectorAll('.page-wrapper');
    const scrollTop = container.scrollTop + container.clientHeight / 3;
    for (let i = 0; i < pageEls.length; i++) {
      if (pageEls[i].offsetTop + pageEls[i].offsetHeight > scrollTop) {
        if (i + 1 !== currentPage) onPageChange(i + 1);
        break;
      }
    }
  }, [currentPage, onPageChange]);

  return (
    <div className="viewer-container" ref={containerRef} onScroll={handleScroll}>
      <div className="viewer-scroll">
        {pages.map((page, i) => (
          <PageRenderer
            key={`page-${i}`}
            page={page}
            scale={scale}
            boldRatio={boldRatio}
          />
        ))}
      </div>
    </div>
  );
}

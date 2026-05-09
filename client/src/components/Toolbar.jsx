import React from 'react';

export default function Toolbar({
  filename,
  currentPage,
  totalPages,
  scale,
  boldRatio,
  exporting,
  onPrev,
  onNext,
  onZoomIn,
  onZoomOut,
  onBoldRatioChange,
  onDownload,
  onBack,
}) {
  return (
    <div className="toolbar">
      <button onClick={onBack}>Back</button>
      <span className="filename">{filename}</span>

      <button onClick={onPrev} disabled={currentPage <= 1}>Prev</button>
      <span className="page-info">{currentPage} / {totalPages}</span>
      <button onClick={onNext} disabled={currentPage >= totalPages}>Next</button>

      <button onClick={onZoomOut}>-</button>
      <span className="page-info">{Math.round(scale * 100)}%</span>
      <button onClick={onZoomIn}>+</button>

      <label>
        Bold
        <input
          type="range"
          min="0.25"
          max="0.65"
          step="0.05"
          value={boldRatio}
          onChange={(e) => onBoldRatioChange(parseFloat(e.target.value))}
        />
        <span className="bold-value">{Math.round(boldRatio * 100)}%</span>
      </label>

      <span className="spacer" />

      <button className="primary" onClick={onDownload} disabled={exporting}>
        {exporting ? 'Exporting...' : 'Download PDF'}
      </button>
    </div>
  );
}

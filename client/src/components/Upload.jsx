import React, { useRef, useState } from 'react';

export default function Upload({ onUpload, uploading }) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = async (file) => {
    if (!file || file.type !== 'application/pdf') {
      alert('Please upload a PDF file');
      return;
    }
    const formData = new FormData();
    formData.append('pdf', file);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.fileId) onUpload(data.fileId, data.filename);
      else alert('Upload failed: ' + (data.error || 'Unknown error'));
    } catch (err) {
      alert('Upload failed: ' + err.message);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  };

  return (
    <div className="upload-container">
      <div
        className={`upload-box ${dragOver ? 'drag-over' : ''}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <h2>{uploading ? 'Uploading...' : 'Upload PDF'}</h2>
        <p>{uploading ? 'Please wait...' : 'Drag & drop a PDF here, or click to browse'}</p>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,application/pdf"
          onChange={(e) => e.target.files[0] && handleFile(e.target.files[0])}
        />
      </div>
    </div>
  );
}

import * as pdfjsLib from 'pdfjs-dist';

let initialized = false;

export async function initPDFJS() {
  if (!initialized) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
    initialized = true;
  }
  return pdfjsLib;
}

export async function loadDocument(url) {
  await initPDFJS();
  const loadingTask = pdfjsLib.getDocument(url);
  return loadingTask.promise;
}

export { pdfjsLib };

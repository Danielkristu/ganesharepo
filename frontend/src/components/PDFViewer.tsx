"use client";

import { useState, useRef } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { ZoomIn, ZoomOut, Loader2, RotateCw } from "lucide-react";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Set up worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFViewerProps {
  url: string;
}

export function CustomPDFViewer({ url }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [scale, setScale] = useState(1.0);
  const [rotation, setRotation] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
  }

  const changeScale = (delta: number) => {
    setScale(prev => Math.min(Math.max(0.5, prev + delta), 2.5));
  };

  return (
    <div className="flex flex-col h-full bg-zinc-900 overflow-hidden relative">

      {/* Floating Toolbar */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 px-4 py-2 bg-zinc-900/85 backdrop-blur-md rounded-full border border-zinc-700 shadow-2xl">

        {/* Zoom controls */}
        <div className="flex items-center gap-1 border-r border-zinc-700 pr-3">
          <button
            onClick={() => changeScale(-0.15)}
            className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            title="Zoom out"
          >
            <ZoomOut size={18} />
          </button>
          <span className="text-xs font-medium text-white min-w-[40px] text-center">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={() => changeScale(0.15)}
            className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            title="Zoom in"
          >
            <ZoomIn size={18} />
          </button>
        </div>

        {/* Rotate */}
        <button
          onClick={() => setRotation(r => (r + 90) % 360)}
          className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          title="Rotate"
        >
          <RotateCw size={18} />
        </button>

        {/* Page count */}
        {numPages && (
          <>
            <div className="w-px h-4 bg-zinc-700" />
            <span className="text-xs text-zinc-400 font-medium pr-1">
              {numPages} {numPages === 1 ? "page" : "pages"}
            </span>
          </>
        )}
      </div>

      {/* Scrollable PDF area — all pages stacked */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto overflow-x-auto flex flex-col items-center gap-4 py-8 px-4 bg-zinc-900"
      >
        <Document
          file={url}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={
            <div className="flex flex-col items-center gap-4 mt-20">
              <Loader2 className="animate-spin text-white" size={32} />
              <p className="text-zinc-400 text-sm">Rendering PDF…</p>
            </div>
          }
          error={
            <div className="text-red-400 text-sm mt-20">
              Failed to load PDF. Please try downloading it.
            </div>
          }
        >
          {numPages &&
            Array.from({ length: numPages }, (_, i) => (
              <div
                key={`page_${i + 1}`}
                className="shadow-2xl border border-zinc-800 rounded-sm overflow-hidden"
              >
                <Page
                  pageNumber={i + 1}
                  scale={scale}
                  rotate={rotation}
                  renderAnnotationLayer={true}
                  renderTextLayer={true}
                />
              </div>
            ))}
        </Document>
        {/* Bottom padding so toolbar doesn't overlap last page */}
        <div className="h-16 shrink-0" />
      </div>
    </div>
  );
}

'use client';

import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { useState } from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Loader2, ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from 'lucide-react';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

interface PdfViewerProps {
  file: File | null;
  fileUrl: string | null;
  isLoading: boolean;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onExtract: () => void;
}

export function PdfViewer({ file, fileUrl, isLoading, onFileChange, onExtract }: PdfViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }): void {
    setNumPages(numPages);
    setPageNumber(1);
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-2 border-b flex items-center justify-between gap-2">
        <Input type="file" accept="application/pdf" onChange={onFileChange} className="max-w-xs" />
        <Button onClick={onExtract} disabled={!file || isLoading}>
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Extract with AI
        </Button>
      </div>

      {fileUrl && (
        <>
        <div className="p-2 border-b flex items-center justify-center gap-4 bg-secondary">
          <Button variant="ghost" size="icon" onClick={() => setScale(s => s > 0.5 ? s - 0.1 : s)}><ZoomOut /></Button>
          <span>{(scale * 100).toFixed(0)}%</span>
          <Button variant="ghost" size="icon" onClick={() => setScale(s => s < 2.0 ? s + 0.1 : s)}><ZoomIn /></Button>
          <div className="w-px h-6 bg-border mx-2"></div>
          <Button variant="ghost" size="icon" onClick={() => setPageNumber(p => p > 1 ? p - 1 : p)} disabled={pageNumber <= 1}><ChevronLeft /></Button>
          <span>Page {pageNumber} of {numPages}</span>
          <Button variant="ghost" size="icon" onClick={() => setPageNumber(p => p < numPages ? p + 1 : p)} disabled={pageNumber >= numPages}><ChevronRight /></Button>
        </div>
        <div className="flex-1 overflow-auto bg-secondary/40 p-4">
            <Document file={fileUrl} onLoadSuccess={onDocumentLoadSuccess}>
                <Page pageNumber={pageNumber} scale={scale} />
            </Document>
        </div>
        </>
      )}

      {!fileUrl && (
        <div className="flex-1 flex items-center justify-center bg-secondary/40">
          <p className="text-muted-foreground">Upload a PDF to begin</p>
        </div>
      )}
    </div>
  );
}
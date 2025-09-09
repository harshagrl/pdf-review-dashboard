'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { PdfViewer } from './pdf-viewer';
import { InvoiceForm } from './invoice-form';
import api from '@/lib/api';
import { Invoice } from '@repo/types';
import { isAxiosError } from 'axios';

export function DashboardClient() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [invoiceData, setInvoiceData] = useState<Invoice | null>(null);
  const [uploadInfo, setUploadInfo] = useState<{ fileId: string; fileName: string; } | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      setFileUrl(URL.createObjectURL(file));
      setInvoiceData(null); // Reset form
      setUploadInfo(null);
    } else {
      toast.error('Please select a valid PDF file.');
    }
  };

  const handleUploadAndExtract = async () => {
    if (!selectedFile) {
      toast.error('Please select a file first.');
      return;
    }
    setIsLoading(true);
    toast.info('Uploading file...');
    try {
      // Step 1: Upload
      const formData = new FormData();
      formData.append('file', selectedFile);
      const uploadRes = await api.post('/upload', formData);
      const { fileId, fileName } = uploadRes.data;
      setUploadInfo({ fileId, fileName });
      toast.success('File uploaded! Starting data extraction...');
      
      // Step 2: Extract
      const extractRes = await api.post('/extract', { fileId, model: 'gemini' });
      setInvoiceData(extractRes.data);
      toast.success('Data extracted successfully!');

    } catch (error) {
  let errorMessage = 'An unexpected error occurred.';
  if (isAxiosError(error)) {
    // If it's an axios error, we can safely access its properties
    errorMessage = error.response?.data?.error || error.message;
  } else if (error instanceof Error) {
    // Handle generic JavaScript errors
    errorMessage = error.message;
  }
  toast.error(`Operation failed: ${errorMessage}`);
  console.error(error); // You can still log the original error
} finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-4 h-[calc(100vh-57px)]">
      <div className="p-4 border-r">
        <PdfViewer
          file={selectedFile}
          fileUrl={fileUrl}
          onFileChange={handleFileChange}
          onExtract={handleUploadAndExtract}
          isLoading={isLoading}
        />
      </div>
      <div className="p-4 overflow-y-auto">
        <InvoiceForm 
            initialData={invoiceData} 
            setInvoiceData={setInvoiceData} 
        />
      </div>
    </div>
  );
}
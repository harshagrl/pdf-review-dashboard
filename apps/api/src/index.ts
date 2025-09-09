import express, { Express } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import { put } from '@vercel/blob';
import pdf from 'pdf-parse';
import { GoogleGenerativeAI } from '@google/generative-ai';
import connectDB from './config/db';
import Invoice from './models/invoice.model';

dotenv.config();
connectDB();

const app: Express  = express();
const port = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());
const upload = multer({ storage: multer.memoryStorage() });

// AI Setup
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// ---- API Routes ----

// 1. Upload PDF
app.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }
  const { originalname, buffer } = req.file;
  try {
    const { url } = await put(originalname, buffer, { access: 'public' });
    const fileId = url; // Using the Vercel Blob URL as the unique ID
    res.status(200).json({ fileId, fileName: originalname });
  } catch (error) {
    console.error('Error uploading to Vercel Blob:', error);
    res.status(500).json({ error: 'Failed to upload file.' });
  }
});

// 2. Extract Data
app.post('/extract', async (req, res) => {
  const { fileId, model: modelChoice } = req.body;
  if (!fileId) {
    return res.status(400).json({ error: 'fileId is required.' });
  }

  try {
    // Fetch file from Vercel Blob
    const response = await fetch(fileId);
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Parse PDF text
    const data = await pdf(buffer);
    const textContent = data.text;
    
    // AI Extraction
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    const prompt = `
      You are an expert data extractor. Your task is to extract information from the following invoice text and return it as a JSON object.
      Do not include any introductory text, just the JSON object.
      The JSON object must follow this exact structure:
      {
        "vendor": { "name": "", "address": "", "taxId": "" },
        "invoice": {
          "number": "", "date": "", "currency": "", "subtotal": 0, "taxPercent": 0, "total": 0, "poNumber": "", "poDate": "",
          "lineItems": [{ "description": "", "unitPrice": 0, "quantity": 0, "total": 0 }]
        }
      }
      If a value is not found, leave the string empty or the number as 0. Ensure all numbers are parsed correctly, without currency symbols.
      
      Here is the invoice text:
      ---
      ${textContent}
      ---
    `;

    const result = await model.generateContent(prompt);
    const aiResponse = await result.response;
    let jsonString = aiResponse.text();

    // Clean the response to get only the JSON
    jsonString = jsonString.replace(/```json\n/g, '').replace(/\n```/g, '');
    const extractedData = JSON.parse(jsonString);

    // Create a new invoice record in DB
    const newInvoice = new Invoice({
      fileId,
      fileName: fileId.split('/').pop(),
      ...extractedData
    });
    await newInvoice.save();

    res.status(201).json(newInvoice);

  } catch (error: any) {
    console.error('Error during extraction:', error);
    res.status(500).json({ error: `Extraction failed: ${error.message}` });
  }
});

// 3. Get all invoices (with search)
app.get('/invoices', async (req, res) => {
    try {
        const query = req.query.q as string;
        let filter = {};
        if (query) {
            filter = {
                $or: [
                    { 'vendor.name': { $regex: query, $options: 'i' } },
                    { 'invoice.number': { $regex: query, $options: 'i' } },
                ],
            };
        }
        const invoices = await Invoice.find(filter).sort({ createdAt: -1 });
        res.status(200).json(invoices);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch invoices.' });
    }
});

// 4. Get invoice by ID
app.get('/invoices/:id', async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id);
        if (!invoice) {
            return res.status(404).json({ error: 'Invoice not found.' });
        }
        res.status(200).json(invoice);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch invoice.' });
    }
});

// 5. Update invoice by ID
app.put('/invoices/:id', async (req, res) => {
    try {
        const updatedInvoice = await Invoice.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedInvoice) {
            return res.status(404).json({ error: 'Invoice not found.' });
        }
        res.status(200).json(updatedInvoice);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update invoice.' });
    }
});

// 6. Delete invoice by ID
app.delete('/invoices/:id', async (req, res) => {
    try {
        const deletedInvoice = await Invoice.findByIdAndDelete(req.params.id);
        if (!deletedInvoice) {
            return res.status(404).json({ error: 'Invoice not found.' });
        }
        res.status(200).json({ message: 'Invoice deleted successfully.' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete invoice.' });
    }
});

app.listen(port, () => {
  console.log(`API server listening on port ${port}`);
});

// Export the app for Vercel
export default app;
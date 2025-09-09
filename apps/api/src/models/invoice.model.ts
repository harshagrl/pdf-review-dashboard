import mongoose, { Schema, Document } from 'mongoose';
import { Invoice as InvoiceType } from '@repo/types';

const LineItemSchema = new Schema({
  description: { type: String, required: true },
  unitPrice: { type: Number, required: true },
  quantity: { type: Number, required: true },
  total: { type: Number, required: true },
}, { _id: false });

const InvoiceSchema: Schema = new Schema({
  fileId: { type: String, required: true, unique: true },
  fileName: { type: String, required: true },
  vendor: {
    name: { type: String, required: true },
    address: String,
    taxId: String,
  },
  invoice: {
    number: { type: String, required: true },
    date: { type: String, required: true },
    currency: String,
    subtotal: Number,
    taxPercent: Number,
    total: Number,
    poNumber: String,
    poDate: String,
    lineItems: [LineItemSchema],
  },
}, { timestamps: true });

export default mongoose.model<InvoiceType & Document>('Invoice', InvoiceSchema);
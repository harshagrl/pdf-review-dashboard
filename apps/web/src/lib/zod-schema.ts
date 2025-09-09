import { z } from "zod";

const lineItemSchema = z.object({
  description: z.string().min(1, "Description is required"),
  unitPrice: z.coerce.number().min(0, "Unit price must be positive"),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
  total: z.coerce.number().min(0, "Total must be positive"),
});

export const invoiceSchema = z.object({
  vendor: z.object({
    name: z.string().min(1, "Vendor name is required"),
    address: z.string().optional(),
    taxId: z.string().optional(),
  }),
  invoice: z.object({
    number: z.string().min(1, "Invoice number is required"),
    date: z.string().min(1, "Invoice date is required"),
    currency: z.string().optional(),
    subtotal: z.coerce.number().optional(),
    taxPercent: z.coerce.number().optional(),
    total: z.coerce.number().optional(),
    poNumber: z.string().optional(),
    poDate: z.string().optional(),
    lineItems: z.array(lineItemSchema),
  }),
});
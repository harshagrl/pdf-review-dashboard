'use client';
import { useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { invoiceSchema } from '@/lib/zod-schema';
import { Invoice } from '@repo/types';
import api from '@/lib/api';
import { PlusCircle, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

type InvoiceFormData = z.infer<typeof invoiceSchema>;

interface InvoiceFormProps {
  initialData: Invoice | null;
  setInvoiceData: (data: Invoice | null) => void;
}

export function InvoiceForm({ initialData, setInvoiceData }: InvoiceFormProps) {
  const router = useRouter();
  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: initialData ? { vendor: initialData.vendor, invoice: initialData.invoice } : undefined,
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "invoice.lineItems",
  });

  useEffect(() => {
    if (initialData) {
      form.reset({ vendor: initialData.vendor, invoice: initialData.invoice });
    } else {
      form.reset({ vendor: { name: '' }, invoice: { number: '', date: '', lineItems: [] } });
    }
  }, [initialData, form]);

  const onSubmit = async (data: InvoiceFormData) => {
    if (!initialData) return;
    try {
      const updatedData = { ...initialData, ...data };
      await api.put(`/invoices/${initialData._id}`, updatedData);
      toast.success('Invoice updated successfully!');
      router.push('/invoices');
    } catch (error) {
      toast.error('Failed to update invoice.');
    }
  };

  const handleDelete = async () => {
    if (!initialData) return;
    try {
      await api.delete(`/invoices/${initialData._id}`);
      toast.success('Invoice deleted successfully.');
      setInvoiceData(null);
      // Ideally you would also clear the PDF viewer state here via a callback
    } catch (error) {
      toast.error('Failed to delete invoice.');
    }
  };

  if (!initialData) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Extracted data will appear here.</p>
      </div>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Vendor</CardTitle></CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          <div><Label>Name</Label><Input {...form.register('vendor.name')} /></div>
          <div><Label>Address</Label><Input {...form.register('vendor.address')} /></div>
          <div><Label>Tax ID</Label><Input {...form.register('vendor.taxId')} /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Invoice Details</CardTitle></CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          <div><Label>Number</Label><Input {...form.register('invoice.number')} /></div>
          <div><Label>Date</Label><Input type="date" {...form.register('invoice.date')} /></div>
          <div><Label>Currency</Label><Input {...form.register('invoice.currency')} /></div>
          <div><Label>Subtotal</Label><Input type="number" {...form.register('invoice.subtotal')} /></div>
          <div><Label>Tax %</Label><Input type="number" {...form.register('invoice.taxPercent')} /></div>
          <div><Label>Total</Label><Input type="number" {...form.register('invoice.total')} /></div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Line Items</CardTitle>
            <Button type="button" size="sm" variant="ghost" onClick={() => append({ description: '', quantity: 1, unitPrice: 0, total: 0 })}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Item
            </Button>
        </CardHeader>
        <CardContent className="space-y-4">
            {fields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-[1fr,100px,100px,100px,auto] gap-2 items-center">
                    <div><Label className="sr-only">Desc</Label><Input placeholder="Description" {...form.register(`invoice.lineItems.${index}.description`)} /></div>
                    <div><Label className="sr-only">Qty</Label><Input type="number" placeholder="Qty" {...form.register(`invoice.lineItems.${index}.quantity`)} /></div>
                    <div><Label className="sr-only">Price</Label><Input type="number" placeholder="Price" {...form.register(`invoice.lineItems.${index}.unitPrice`)} /></div>
                    <div><Label className="sr-only">Total</Label><Input type="number" placeholder="Total" {...form.register(`invoice.lineItems.${index}.total`)} /></div>
                    <Button type="button" size="icon" variant="destructive" onClick={() => remove(index)}><Trash2 className="h-4 w-4" /></Button>
                </div>
            ))}
        </CardContent>
      </Card>
      
      <div className="flex justify-end gap-2">
        <Button type="button" variant="destructive" onClick={handleDelete}>Delete</Button>
        <Button type="submit">Save Changes</Button>
      </div>
    </form>
  );
}
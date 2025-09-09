'use client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Invoice } from '@repo/types';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useDebouncedCallback } from 'use-debounce';
import { Input } from './ui/input';


export function InvoicesTable({ invoices }: { invoices: Invoice[] }) {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const { replace } = useRouter();

    const handleSearch = useDebouncedCallback((term: string) => {
        const params = new URLSearchParams(searchParams);
        if (term) {
            params.set('query', term);
        } else {
            params.delete('query');
        }
        replace(`${pathname}?${params.toString()}`);
    }, 300);

  return (
    <div className="space-y-4">
        <Input 
            placeholder="Search by vendor or invoice #"
            onChange={(e) => handleSearch(e.target.value)}
            defaultValue={searchParams.get('query')?.toString()}
            className="max-w-sm"
        />
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vendor</TableHead>
              <TableHead>Invoice #</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((invoice) => (
              <TableRow key={invoice._id}>
                <TableCell className="font-medium">{invoice.vendor.name}</TableCell>
                <TableCell>{invoice.invoice.number}</TableCell>
                <TableCell>{new Date(invoice.invoice.date).toLocaleDateString()}</TableCell>
                <TableCell className="text-right">{invoice.invoice.total}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
    </div>
  );
}
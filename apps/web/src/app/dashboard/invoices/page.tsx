import { InvoicesTable } from "@/components/invoices-table";
import api from "@/lib/api";
import { Invoice } from "@repo/types";

async function getInvoices(searchQuery: string = ''): Promise<Invoice[]> {
  try {
    const res = await api.get(`/invoices`, { params: { q: searchQuery } });
    return res.data;
  } catch (error) {
    console.error("Failed to fetch invoices", error);
    return [];
  }
}

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams?: { query?: string };
}) {
  const query = searchParams?.query || '';
  const invoices = await getInvoices(query);

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Invoices</h1>
      <InvoicesTable invoices={invoices} />
    </div>
  );
}
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/sonner';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
        <div className="container flex items-center justify-between h-14">
          <Link href="/" className="text-xl font-bold">PDF Review</Link>
          <nav>
            <Button asChild variant="ghost">
              <Link href="/">Dashboard</Link>
            </Button>
            <Button asChild variant="ghost">
              <Link href="/invoices">All Invoices</Link>
            </Button>
          </nav>
        </div>
      </header>
      <main className="flex-1">
        {children}
      </main>
      <Toaster />
    </div>
  );
}
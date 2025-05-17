import { Package } from 'lucide-react';

export default function Header() {
  return (
    <header className="bg-card border-b border-border shadow-sm sticky top-0 z-40">
      <div className="container mx-auto px-4 h-16 flex items-center">
        <Package className="h-8 w-8 text-primary mr-3" />
        <h1 className="text-2xl font-semibold text-foreground">StockWise</h1>
      </div>
    </header>
  );
}

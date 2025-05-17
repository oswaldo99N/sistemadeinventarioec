"use client";

import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { Material } from '@/types/inventory';

interface LowStockNoticeProps {
  materials: Material[];
}

export function LowStockNotice({ materials }: LowStockNoticeProps) {
  const lowStockItems = materials.filter(
    (material) => material.quantity <= material.lowStockThreshold && material.lowStockThreshold > 0
  );

  if (lowStockItems.length === 0) {
    return null;
  }

  return (
    <Alert variant="destructive" className="mb-6 shadow-md">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Low Stock Alert!</AlertTitle>
      <AlertDescription>
        The following item(s) are running low: {lowStockItems.map((item) => item.name).join(', ')}. Consider reordering soon.
      </AlertDescription>
    </Alert>
  );
}

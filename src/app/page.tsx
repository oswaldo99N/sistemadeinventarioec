
"use client";

import { useEffect, useState, useCallback } from 'react';
import { PlusCircle, Search, Download } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InventoryTable } from '@/components/inventory/InventoryTable';
import { MaterialDialog } from '@/components/inventory/MaterialDialog';
import { LowStockNotice } from '@/components/inventory/LowStockNotice';
import type { Material, MaterialFormValues } from '@/types/inventory';
import { loadState, saveState } from '@/lib/localStorage';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';


const LOCAL_STORAGE_KEY = 'stockwise_materials';

export default function InventoryPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingMaterial, setEditingMaterial] = useState<Material | undefined>(undefined);
  const [isMounted, setIsMounted] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setIsMounted(true);
    setMaterials(loadState<Material[]>(LOCAL_STORAGE_KEY, []));
  }, []);

  useEffect(() => {
    if (isMounted) {
      saveState<Material[]>(LOCAL_STORAGE_KEY, materials);
    }
  }, [materials, isMounted]);

  const handleAddMaterial = useCallback((values: MaterialFormValues) => {
    const newMaterial: Material = {
      ...values,
      id: crypto.randomUUID(),
      purchaseDate: values.purchaseDate, // Already ISO string from dialog
    };
    setMaterials((prev) => [newMaterial, ...prev]);
    toast({
      title: "Material Agregado",
      description: `${newMaterial.name} ha sido agregado al inventario.`,
      variant: "default",
    });
  }, [toast]);

  const handleEditMaterial = useCallback((values: MaterialFormValues) => {
    setMaterials((prev) =>
      prev.map((m) => (m.id === values.id ? { ...m, ...values, purchaseDate: values.purchaseDate } as Material : m))
    );
    toast({
      title: "Material Actualizado",
      description: `${values.name} ha sido actualizado.`,
      variant: "default",
    });
    setEditingMaterial(undefined);
  }, [toast]);

  const handleDeleteMaterial = useCallback((id: string) => {
    const materialToDelete = materials.find(m => m.id === id);
    setMaterials((prev) => prev.filter((m) => m.id !== id));
    if (materialToDelete) {
      toast({
        title: "Material Eliminado",
        description: `${materialToDelete.name} ha sido eliminado del inventario.`,
        variant: "destructive",
      });
    }
  }, [materials, toast]);

  const handleQuantityChange = useCallback((id: string, newQuantity: number) => {
    setMaterials(prevMaterials => 
      prevMaterials.map(material =>
        material.id === id ? { ...material, quantity: Math.max(0, newQuantity) } : material
      )
    );
     // No toast for quick adjustments to avoid spamming notifications
  }, []);

  const handleDownloadInventory = useCallback(() => {
    if (materials.length === 0) {
      toast({
        title: "Inventario Vacío",
        description: "No hay materiales para descargar.",
        variant: "default",
      });
      return;
    }

    const headers = [
      "ID",
      "Nombre",
      "Descripción",
      "Cantidad",
      "Fecha de Compra",
      "Umbral de Stock Bajo"
    ];

    const escapeCsvCell = (cellData: string | number) => {
      const stringData = String(cellData);
      // Si contiene coma, comillas dobles o salto de línea, encerrar entre comillas dobles
      // y escapar comillas dobles existentes duplicándolas.
      if (stringData.includes(',') || stringData.includes('"') || stringData.includes('\n')) {
        return `"${stringData.replace(/"/g, '""')}"`;
      }
      return stringData;
    };
    
    const csvRows = [
      headers.join(','),
      ...materials.map(material => 
        [
          escapeCsvCell(material.id),
          escapeCsvCell(material.name),
          escapeCsvCell(material.description),
          escapeCsvCell(material.quantity),
          escapeCsvCell(format(new Date(material.purchaseDate), 'yyyy-MM-dd', { locale: es })),
          escapeCsvCell(material.lowStockThreshold)
        ].join(',')
      )
    ];
    
    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `inventario_stockwise_${format(new Date(), 'yyyyMMdd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Descarga Iniciada",
      description: "El archivo del inventario se está descargando.",
      variant: "default",
    });

  }, [materials, toast]);


  const totalItems = materials.length;
  const totalQuantity = materials.reduce((sum, item) => sum + item.quantity, 0);
  const lowStockCount = materials.filter(m => m.quantity <= m.lowStockThreshold && m.lowStockThreshold > 0).length;

  if (!isMounted) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Cargando Inventario...</CardTitle>
              <CardDescription>Por favor, espera mientras cargamos tus datos.</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-3xl">Resumen del Inventario</CardTitle>
            <CardDescription>Gestiona tus materiales eficientemente.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="bg-secondary/50 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total de Artículos Únicos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalItems}</div>
                </CardContent>
              </Card>
              <Card className="bg-secondary/50 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Cantidad Total</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalQuantity}</div>
                </CardContent>
              </Card>
              <Card className={lowStockCount > 0 ? "bg-destructive/20 shadow-sm" : "bg-secondary/50 shadow-sm"}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Artículos con Stock Bajo</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{lowStockCount}</div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        <LowStockNotice materials={materials} />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar materiales..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full shadow-sm"
              aria-label="Buscar materiales"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <MaterialDialog
              onSave={handleAddMaterial}
            >
              <Button className="w-full sm:w-auto shadow-md bg-primary hover:bg-primary/90">
                <PlusCircle className="mr-2 h-5 w-5" />
                Agregar Nuevo Material
              </Button>
            </MaterialDialog>
            <Button 
              className="w-full sm:w-auto shadow-md"
              variant="outline"
              onClick={handleDownloadInventory}
              disabled={materials.length === 0}
            >
              <Download className="mr-2 h-5 w-5" />
              Descargar Inventario
            </Button>
          </div>
        </div>

        <InventoryTable
          materials={materials}
          onEdit={(material) => {
            // This logic is now handled by MaterialDialog itself
            // The trigger button in InventoryTable will open the dialog
            // For simplicity, we just pass the material data to MaterialDialog
            // which then handles setting its own state
          }}
          onDelete={handleDeleteMaterial}
          onQuantityChange={handleQuantityChange}
          searchTerm={searchTerm}
          setEditingMaterial={setEditingMaterial} 
        />
        
         {editingMaterial && (
           <MaterialDialog
             material={editingMaterial}
             onSave={handleEditMaterial}
           >
             <></> 
           </MaterialDialog>
         )}
      </div>
    </AppLayout>
  );
}


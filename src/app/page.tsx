"use client";

import { useEffect, useState, useCallback } from 'react';
import { PlusCircle, Search } from 'lucide-react';
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
      title: "Material Added",
      description: `${newMaterial.name} has been added to the inventory.`,
      variant: "default",
    });
  }, [toast]);

  const handleEditMaterial = useCallback((values: MaterialFormValues) => {
    setMaterials((prev) =>
      prev.map((m) => (m.id === values.id ? { ...m, ...values, purchaseDate: values.purchaseDate } as Material : m))
    );
    toast({
      title: "Material Updated",
      description: `${values.name} has been updated.`,
      variant: "default",
    });
    setEditingMaterial(undefined);
  }, [toast]);

  const handleDeleteMaterial = useCallback((id: string) => {
    const materialToDelete = materials.find(m => m.id === id);
    setMaterials((prev) => prev.filter((m) => m.id !== id));
    if (materialToDelete) {
      toast({
        title: "Material Deleted",
        description: `${materialToDelete.name} has been removed from the inventory.`,
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


  const totalItems = materials.length;
  const totalQuantity = materials.reduce((sum, item) => sum + item.quantity, 0);
  const lowStockCount = materials.filter(m => m.quantity <= m.lowStockThreshold && m.lowStockThreshold > 0).length;

  if (!isMounted) {
    // Optional: render a loading skeleton or spinner
    return (
      <AppLayout>
        <div className="space-y-6">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Loading Inventory...</CardTitle>
              <CardDescription>Please wait while we fetch your data.</CardDescription>
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
            <CardTitle className="text-3xl">Inventory Overview</CardTitle>
            <CardDescription>Manage your materials efficiently.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="bg-secondary/50 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Unique Items</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalItems}</div>
                </CardContent>
              </Card>
              <Card className="bg-secondary/50 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Quantity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalQuantity}</div>
                </CardContent>
              </Card>
              <Card className={lowStockCount > 0 ? "bg-destructive/20 shadow-sm" : "bg-secondary/50 shadow-sm"}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
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
              placeholder="Search materials..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full shadow-sm"
              aria-label="Search materials"
            />
          </div>
          <MaterialDialog
            onSave={handleAddMaterial}
          >
            <Button className="w-full sm:w-auto shadow-md bg-primary hover:bg-primary/90">
              <PlusCircle className="mr-2 h-5 w-5" />
              Add New Material
            </Button>
          </MaterialDialog>
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
          setEditingMaterial={setEditingMaterial} // This might not be needed if MaterialDialog is self-contained within InventoryTable's map
        />
        
        {/* This instance of MaterialDialog is for editing, triggered from InventoryTable */}
        {/* It is kept here in case a separate "Edit" button not part of the table row is needed in the future */}
        {/* Currently, InventoryTable's MaterialDialog handles edits directly */}
         {editingMaterial && (
           <MaterialDialog
             material={editingMaterial}
             onSave={handleEditMaterial}
           >
             {/* This is a hidden trigger, dialog is controlled by editingMaterial state */}
             <></> 
           </MaterialDialog>
         )}
      </div>
    </AppLayout>
  );
}

"use client";

import type { Material } from '@/types/inventory';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Edit3, Trash2, AlertTriangle, ChevronsUpDown, Plus, Minus, PackageSearch } from 'lucide-react';
import type { Dispatch, SetStateAction } from 'react';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { MaterialDialog } from './MaterialDialog';
import { DeleteConfirmationDialog } from './DeleteConfirmationDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type SortKey = keyof Material | '';
interface SortConfig {
  key: SortKey;
  direction: 'ascending' | 'descending';
}

interface InventoryTableProps {
  materials: Material[];
  onEdit: (material: Material) => void;
  onDelete: (id: string) => void;
  onQuantityChange: (id: string, newQuantity: number) => void;
  searchTerm: string;
  setEditingMaterial: Dispatch<SetStateAction<Material | undefined>>;
}

export function InventoryTable({
  materials,
  onEdit,
  onDelete,
  onQuantityChange,
  searchTerm,
  setEditingMaterial,
}: InventoryTableProps) {
  const [sortConfig, setSortConfig] = React.useState<SortConfig>({ key: 'name', direction: 'ascending' });

  const filteredMaterials = React.useMemo(() => {
    return materials.filter(
      (material) =>
        material.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        material.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [materials, searchTerm]);

  const sortedMaterials = React.useMemo(() => {
    let sortableItems = [...filteredMaterials];
    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        const aValue = a[sortConfig.key as keyof Material];
        const bValue = b[sortConfig.key as keyof Material];

        if (aValue === undefined || bValue === undefined) return 0;

        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortConfig.direction === 'ascending' ? aValue - bValue : bValue - aValue;
        }
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortConfig.direction === 'ascending' 
            ? aValue.localeCompare(bValue) 
            : bValue.localeCompare(aValue);
        }
        // For dates (stored as strings)
        if (sortConfig.key === 'purchaseDate') {
            return sortConfig.direction === 'ascending'
            ? new Date(aValue).getTime() - new Date(bValue).getTime()
            : new Date(bValue).getTime() - new Date(aValue).getTime();
        }
        return 0;
      });
    }
    return sortableItems;
  }, [filteredMaterials, sortConfig]);

  const requestSort = (key: SortKey) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortIndicator = (key: SortKey) => {
    if (sortConfig.key === key) {
      return sortConfig.direction === 'ascending' ? '▲' : '▼';
    }
    return <ChevronsUpDown className="h-4 w-4 opacity-50" />;
  };

  if (materials.length === 0 && !searchTerm) {
     return (
      <Card className="mt-6 shadow-lg">
        <CardHeader>
          <CardTitle className="text-center">Aún no hay materiales</CardTitle>
        </CardHeader>
        <CardContent className="text-center text-muted-foreground">
          <PackageSearch className="mx-auto h-16 w-16 mb-4 text-primary opacity-50" />
          <p>Tu inventario está actualmente vacío.</p>
          <p>Haz clic en el botón "Agregar Nuevo Material" para comenzar.</p>
        </CardContent>
      </Card>
    );
  }
  
  if (sortedMaterials.length === 0 && searchTerm) {
    return (
      <Card className="mt-6 shadow-lg">
        <CardContent className="text-center text-muted-foreground py-10">
          <PackageSearch className="mx-auto h-16 w-16 mb-4 text-primary opacity-50" />
          <p>No se encontraron materiales para "{searchTerm}".</p>
          <p>Intenta ajustar tus términos de búsqueda.</p>
        </CardContent>
      </Card>
    );
  }


  return (
    <TooltipProvider>
      <div className="rounded-lg border shadow-md overflow-hidden bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="cursor-pointer w-[25%]" onClick={() => requestSort('name')}>
                <div className="flex items-center">Nombre {getSortIndicator('name')}</div>
              </TableHead>
              <TableHead className="w-[30%] hidden md:table-cell">Descripción</TableHead>
              <TableHead className="cursor-pointer w-[10%]" onClick={() => requestSort('quantity')}>
                <div className="flex items-center">Cant. {getSortIndicator('quantity')}</div>
              </TableHead>
              <TableHead className="cursor-pointer w-[15%] hidden sm:table-cell" onClick={() => requestSort('purchaseDate')}>
                 <div className="flex items-center">Comprado {getSortIndicator('purchaseDate')}</div>
              </TableHead>
              <TableHead className="text-right w-[20%]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedMaterials.map((material) => (
              <TableRow key={material.id} className={material.quantity <= material.lowStockThreshold && material.lowStockThreshold > 0 ? 'bg-destructive/10 hover:bg-destructive/20' : ''}>
                <TableCell className="font-medium">
                  <div className="flex items-center">
                  {material.name}
                  {material.quantity <= material.lowStockThreshold && material.lowStockThreshold > 0 && (
                     <Tooltip>
                        <TooltipTrigger asChild>
                           <AlertTriangle className="ml-2 h-4 w-4 text-destructive" />
                        </TooltipTrigger>
                        <TooltipContent>
                           <p>{`¡Stock bajo! Cantidad: ${material.quantity}, Umbral: ${material.lowStockThreshold}`}</p>
                        </TooltipContent>
                     </Tooltip>
                  )}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground hidden md:table-cell">{material.description || '-'}</TableCell>
                <TableCell>
                  <div className="flex items-center space-x-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onQuantityChange(material.id, Math.max(0, material.quantity - 1))}>
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span>{material.quantity}</span>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onQuantityChange(material.id, material.quantity + 1)}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground hidden sm:table-cell">{format(new Date(material.purchaseDate), 'PP', { locale: es })}</TableCell>
                <TableCell className="text-right space-x-1">
                  <MaterialDialog
                    material={material}
                    onSave={(values) => onEdit({ ...values, id: material.id } as Material)}
                  >
                    <Button variant="ghost" size="icon" aria-label="Editar material">
                      <Edit3 className="h-4 w-4" />
                    </Button>
                  </MaterialDialog>
                  <DeleteConfirmationDialog
                    onConfirm={() => onDelete(material.id)}
                    itemName={material.name}
                    trigger={
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/80" aria-label="Eliminar material">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    }
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </TooltipProvider>
  );
}

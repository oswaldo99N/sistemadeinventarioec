"use client";

import React from 'react'; // Changed from type import
import { zodResolver } from '@hookform/resolvers/zod';
import { CalendarIcon, PlusCircle, Edit3 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type { Material, MaterialFormValues } from '@/types/inventory';

const materialSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'El nombre es obligatorio').max(100, 'El nombre debe tener 100 caracteres o menos'),
  description: z.string().max(500, 'La descripción debe tener 500 caracteres o menos').optional(),
  quantity: z.coerce.number().min(0, 'La cantidad no puede ser negativa').int('La cantidad debe ser un número entero'),
  purchaseDate: z.date({ required_error: 'La fecha de compra es obligatoria.' }),
  lowStockThreshold: z.coerce.number().min(0, 'El umbral no puede ser negativo').int('El umbral debe ser un número entero'),
});

interface MaterialDialogProps {
  material?: Material;
  onSave: (values: MaterialFormValues) => void;
  children: React.ReactNode; // Trigger element
}

export function MaterialDialog({ material, onSave, children }: MaterialDialogProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const form = useForm<MaterialFormValues>({
    resolver: zodResolver(materialSchema),
    defaultValues: material
      ? { ...material, purchaseDate: parseISO(material.purchaseDate) }
      : {
          name: '',
          description: '',
          quantity: 0,
          purchaseDate: new Date(),
          lowStockThreshold: 0,
        },
  });
  
  React.useEffect(() => {
    if (isOpen) {
      form.reset(
        material
        ? { ...material, purchaseDate: parseISO(material.purchaseDate) }
        : {
            name: '',
            description: '',
            quantity: 0,
            purchaseDate: new Date(),
            lowStockThreshold: 0,
          }
      );
    }
  }, [isOpen, material, form]);


  const onSubmit = (values: z.infer<typeof materialSchema>) => {
    onSave({ ...values, purchaseDate: values.purchaseDate.toISOString() });
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[525px] shadow-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            {material ? <Edit3 className="mr-2 h-5 w-5" /> : <PlusCircle className="mr-2 h-5 w-5" />}
            {material ? 'Editar Material' : 'Agregar Nuevo Material'}
          </DialogTitle>
          <DialogDescription>
            {material ? 'Actualiza los detalles del material.' : 'Completa los detalles del nuevo material.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Tornillos, Tablas de madera" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Ej: Acero inoxidable 5cm, Madera de roble 2x4x8" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cantidad</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lowStockThreshold"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Umbral de Stock Bajo</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="purchaseDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Fecha de Compra</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={'outline'}
                          className={cn(
                            'pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value ? (
                            format(field.value, 'PPP', { locale: es })
                          ) : (
                            <span>Elige una fecha</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        locale={es}
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date('1900-01-01')
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-accent hover:bg-accent/90 text-accent-foreground">
                {material ? 'Guardar Cambios' : 'Agregar Material'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

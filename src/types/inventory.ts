export interface Material {
  id: string;
  name: string;
  description: string;
  quantity: number;
  purchaseDate: string; // ISO string
  lowStockThreshold: number;
}

export type MaterialFormValues = Omit<Material, 'id'> & { id?: string };

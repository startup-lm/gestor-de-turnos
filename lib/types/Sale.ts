export interface Sale {
  id?: number;
  product_id: number;
  barber_id: number;
  price: number;
  quantity: number;
  total: number;
  details: string;
  created_at?: string;
}

export interface SaleWithRelations extends Sale {
  barbers?: { name: string } | null;
  products?: { name: string } | null;
}

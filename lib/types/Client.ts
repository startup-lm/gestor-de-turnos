export interface Client {
  id: number;
  name: string;
  phone: string;
  last_visit_date?: string | null;
  created_at?: string;
}

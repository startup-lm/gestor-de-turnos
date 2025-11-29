export interface Appointment {
  id: number;
  client: string;
  barber_id: number;
  date: string;
  start_time: string;
  end_time: string;
  phone: string;
  paid: boolean;
  price: number;
  service_id: number;
  barbers?: {
    name?: string;
  } | null;
  services?: {
    name?: string;
  } | null;
}

export interface AppointmentUpdates {
  client?: string;
  barber_id?: number;
  date?: string;
  start_time?: string;
  end_time?: string;
  phone?: string;
  paid?: boolean;
  price?: number;
  service_id?: number;
};
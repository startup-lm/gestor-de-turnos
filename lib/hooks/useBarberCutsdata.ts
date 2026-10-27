import { useState, useEffect } from "react";
import { getTotalAndRevenueForAllBarbers } from "@/lib/repository/appointments";
import { getBarbers } from "@/lib/repository/barbers";
import { Barber } from "@/lib/types/Barbers";

export interface PieData {
  name: string;
  value: number;
};

export interface BarberTotalData {
  totalAppt:     number;
  totalRevenue:  number;
};

export interface BarberTotals {
  barberId: number;
  totalAppt: number;
  totalRevenue: number;
};

export type PaymentMethodTotals = Record<string, number>;

export function useBarberCutsData(startDate: Date, endDate: Date, initialBarbers?: Barber[]) {
  const [pieData, setPieData] = useState<PieData[]>([]);
  const [summary, setSummary] = useState<BarberTotalData>({ totalAppt: 0, totalRevenue: 0 });
  const [paymentTotals, setPaymentTotals] = useState<PaymentMethodTotals>({});
  const [barberTotals, setBarberTotals] = useState<BarberTotals[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const response = await getTotalAndRevenueForAllBarbers(startDate, endDate);
      const totals: BarberTotals[] = response.barberTotals || [];
      const payTotals: PaymentMethodTotals = response.paymentMethodTotals || {};
      
      const barbers: Barber[] = (initialBarbers && initialBarbers.length > 0) ? initialBarbers : await getBarbers();
      if (!mounted) return;

      const data = totals.map((t) => {
        const barber = barbers.find((b) => b.id === t.barberId);
        return {
          name: barber ? barber.name : "Desconocido",
          value: t.totalAppt,
        };
      });
      const totalApptAll = totals.reduce((sum, t) => sum + t.totalAppt, 0);
      const totalRevenueAll = totals.reduce((sum, t) => sum + t.totalRevenue, 0);

      setPieData(data);
      setSummary({ totalAppt: totalApptAll, totalRevenue: totalRevenueAll });
      setPaymentTotals(payTotals);
      setBarberTotals(totals);
    })();
    return () => {
      mounted = false;
    };
  }, [startDate, endDate, initialBarbers]);

  return { summary, pieData, paymentTotals, barberTotals };
}

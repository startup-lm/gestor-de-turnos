import { useState, useEffect } from "react";
import { getBarbers } from "@/lib/repository/barbers";
import { getBarbersAppointmentsFromDates } from "@/lib/repository/appointments";
import { Appointment } from "@/lib/types/Appointment";
import { Barber } from "@/lib/types/Barbers";

export function useTotalCommissions(startDate: Date, endDate: Date) {
  const [totalCommissions, setTotalCommissions] = useState<number>(0);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const barbers: Barber[] = await getBarbers();
      let total = 0;

      // For each barber, fetch appointments and calculate their commissions
      for (const barber of barbers) {
        const allAppt: Appointment[] = await getBarbersAppointmentsFromDates(barber.id!, startDate, endDate);
        const appointments = allAppt.filter(appt => appt.phone !== "0000000000");

        const commissionSum = appointments.reduce((sum, appt) => {
          const price = appt.price ?? 0;
          const commission = barber.commission ?? 0;
          return sum + price * commission;
        }, 0);

        total += commissionSum;
      }

      if (mounted) {
        setTotalCommissions(total);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [startDate, endDate]);

  return totalCommissions;
}

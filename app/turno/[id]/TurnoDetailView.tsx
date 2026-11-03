"use client";

import { useRouter } from "next/navigation";
import { Appointment } from "@/lib/types/Appointment";
import { Barber } from "@/lib/types/Barbers";
import AppointmentDetailsSplitPanel from "@/components/turnos/AppointmentDetailsSplitPanel";

interface Props {
  appointment: Appointment;
  barbers: Barber[];
}

export default function TurnoDetailView({ appointment, barbers }: Readonly<Props>) {
  const router = useRouter();

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-6 sm:py-8">
      <AppointmentDetailsSplitPanel
        appointment={appointment}
        barbers={barbers}
        onClose={() => router.push("/admin?tab=turnos")}
        onAppointmentChanged={() => router.refresh()}
      />
    </div>
  );
}

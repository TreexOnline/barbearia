"use server";

import { createClient } from "@/lib/supabase/server";
import { requireClient } from "@/lib/auth";
import { notifyAppointment } from "@/lib/notifications/notify";
import { revalidatePath } from "next/cache";

export async function cancelAppointmentAction(appointmentId: string) {
  const { user, profile } = await requireClient();
  const supabase = await createClient();

  const { data: appointment, error } = await supabase
    .from("appointments")
    .update({ status: "cancelled" })
    .eq("id", appointmentId)
    .eq("client_id", user.id)
    .select("id, start_time, service:services(name), barber:profiles!appointments_barber_id_fkey(full_name)")
    .single();

  if (error || !appointment) {
    return { error: "Não foi possível cancelar o agendamento" };
  }

  revalidatePath("/");

  const service = Array.isArray(appointment.service) ? appointment.service[0] : appointment.service;
  const barber = Array.isArray(appointment.barber) ? appointment.barber[0] : appointment.barber;

  await notifyAppointment({
    appointmentId: appointment.id,
    type: "cancellation",
    clientName: profile.full_name,
    clientEmail: user.email ?? "",
    clientPhone: profile.phone,
    barberName: barber?.full_name ?? "",
    serviceName: service?.name ?? "",
    startTime: new Date(appointment.start_time),
  });

  return { success: true };
}

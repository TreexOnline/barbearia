"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireBarber } from "@/lib/auth";
import { notifyAppointment } from "@/lib/notifications/notify";
import { revalidatePath } from "next/cache";

export type FormState = { error?: string; success?: boolean } | undefined;

const TIME_RE = /^\d{2}:\d{2}$/;

export async function saveWeeklyScheduleAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const { user } = await requireBarber();
  const supabase = await createClient();

  const rows: { barber_id: string; weekday: number; start_time: string; end_time: string }[] = [];

  for (let weekday = 0; weekday < 7; weekday++) {
    const enabled = formData.get(`enabled_${weekday}`);
    if (!enabled) continue;

    const start = formData.get(`start_${weekday}`);
    const end = formData.get(`end_${weekday}`);
    if (typeof start !== "string" || !TIME_RE.test(start) || typeof end !== "string" || !TIME_RE.test(end)) {
      return { error: "Informe o horário de início e fim para os dias que você atende" };
    }
    if (end <= start) {
      return { error: "O horário final precisa ser depois do inicial" };
    }
    rows.push({ barber_id: user.id, weekday, start_time: `${start}:00`, end_time: `${end}:00` });
  }

  await supabase.from("barber_schedules").delete().eq("barber_id", user.id);

  if (rows.length > 0) {
    const { error } = await supabase.from("barber_schedules").insert(rows);
    if (error) return { error: "Não foi possível salvar os horários" };
  }

  revalidatePath("/barbeiro/horarios");
  return { success: true };
}

export async function addTimeOffAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const { user } = await requireBarber();
  const supabase = await createClient();

  const date = formData.get("date");
  const startTime = formData.get("startTime");
  const endTime = formData.get("endTime");
  const reason = formData.get("reason");

  if (typeof date !== "string" || !date) {
    return { error: "Selecione uma data" };
  }

  const hasStart = typeof startTime === "string" && startTime;
  const hasEnd = typeof endTime === "string" && endTime;

  const { error } = await supabase.from("barber_time_off").insert({
    barber_id: user.id,
    date,
    start_time: hasStart ? `${startTime}:00` : null,
    end_time: hasEnd ? `${endTime}:00` : null,
    reason: typeof reason === "string" && reason ? reason : null,
  });

  if (error) return { error: "Não foi possível salvar a folga" };

  await cancelAppointmentsInClosedWindow({
    barberId: user.id,
    date,
    startTime: hasStart ? (startTime as string) : "00:00",
    endTime: hasEnd ? (endTime as string) : "23:59",
  });

  revalidatePath("/barbeiro/horarios");
  revalidatePath("/barbeiro/agendamentos");
  revalidatePath("/barbeiro/dashboard");
  return { success: true };
}

/**
 * Quando o barbeiro fecha o dia (ou parte dele), cancela automaticamente
 * qualquer agendamento que já existisse naquela janela e avisa o cliente
 * por WhatsApp/email — sem isso o cliente nunca saberia que o horário caiu.
 */
async function cancelAppointmentsInClosedWindow({
  barberId,
  date,
  startTime,
  endTime,
}: {
  barberId: string;
  date: string;
  startTime: string;
  endTime: string;
}) {
  const admin = createAdminClient();
  const rangeStart = `${date}T${startTime}:00`;
  const rangeEnd = `${date}T${endTime}:59`;

  const { data: appointments } = await admin
    .from("appointments")
    .select(
      "id, start_time, client_id, client:profiles!appointments_client_id_fkey(full_name, phone), barber:profiles!appointments_barber_id_fkey(full_name), service:services(name, price), appointment_services(service_name, price)"
    )
    .eq("barber_id", barberId)
    .in("status", ["confirmed", "pending"])
    .gte("start_time", rangeStart)
    .lte("start_time", rangeEnd);

  if (!appointments || appointments.length === 0) return;

  await admin
    .from("appointments")
    .update({ status: "cancelled" })
    .in(
      "id",
      appointments.map((a) => a.id)
    );

  for (const appt of appointments) {
    const client = Array.isArray(appt.client) ? appt.client[0] : appt.client;
    const barber = Array.isArray(appt.barber) ? appt.barber[0] : appt.barber;
    const service = Array.isArray(appt.service) ? appt.service[0] : appt.service;
    const items = appt.appointment_services?.length
      ? appt.appointment_services
      : service
        ? [{ service_name: service.name, price: service.price }]
        : [];
    if (!client || items.length === 0) continue;

    const { data: authUser } = await admin.auth.admin.getUserById(appt.client_id);

    await notifyAppointment({
      appointmentId: appt.id,
      type: "cancellation",
      clientName: client.full_name,
      clientEmail: authUser?.user?.email ?? "",
      clientPhone: client.phone,
      barberName: barber?.full_name ?? "",
      barberPhone: null, // o próprio barbeiro fechou o dia, não precisa se avisar
      serviceName: items.map((i) => i.service_name).join(" + "),
      price: items.reduce((sum, i) => sum + i.price, 0),
      startTime: new Date(appt.start_time),
    });
  }
}

export async function deleteTimeOffAction(id: string) {
  const { user } = await requireBarber();
  const supabase = await createClient();

  const { error } = await supabase
    .from("barber_time_off")
    .delete()
    .eq("id", id)
    .eq("barber_id", user.id);

  if (error) return { error: "Não foi possível remover a folga" };

  revalidatePath("/barbeiro/horarios");
  return { success: true };
}

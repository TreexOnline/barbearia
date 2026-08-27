"use server";

import { createClient } from "@/lib/supabase/server";
import { requireClient } from "@/lib/auth";
import { bookingSchema } from "@/lib/validations";
import { getAvailableSlots } from "@/lib/availability";
import { notifyAppointment } from "@/lib/notifications/notify";
import { revalidatePath } from "next/cache";

export async function getAvailableSlotsAction({
  barberId,
  serviceIds,
  dateISO,
  excludeAppointmentId,
}: {
  barberId: string;
  serviceIds: string[];
  dateISO: string;
  excludeAppointmentId?: string;
}): Promise<{ slots: string[]; error?: string }> {
  const supabase = await createClient();
  // dateISO ("YYYY-MM-DD") é a data local da barbearia; usamos meio-dia para
  // evitar que a conversão de fuso horário volte para o dia anterior.
  const day = new Date(`${dateISO}T12:00:00`);
  const [year, month, date] = dateISO.split("-").map(Number);
  const weekday = new Date(Date.UTC(year, month - 1, date)).getUTCDay();

  let appointmentsQuery = supabase
    .from("appointments")
    .select("start_time, end_time")
    .eq("barber_id", barberId)
    .neq("status", "cancelled")
    .gte("start_time", `${dateISO}T00:00:00`)
    .lte("start_time", `${dateISO}T23:59:59`);
  if (excludeAppointmentId) {
    appointmentsQuery = appointmentsQuery.neq("id", excludeAppointmentId);
  }

  const [{ data: services }, { data: schedules }, { data: timeOff }, { data: appointments }] =
    await Promise.all([
      supabase.from("services").select("duration_minutes").in("id", serviceIds),
      supabase
        .from("barber_schedules")
        .select("start_time, end_time")
        .eq("barber_id", barberId)
        .eq("weekday", weekday),
      supabase
        .from("barber_time_off")
        .select("start_time, end_time")
        .eq("barber_id", barberId)
        .eq("date", dateISO),
      appointmentsQuery,
    ]);

  if (!services || services.length !== serviceIds.length) {
    return { slots: [], error: "Serviço não encontrado" };
  }
  const totalDuration = services.reduce((sum, s) => sum + s.duration_minutes, 0);

  const slots = getAvailableSlots({
    day,
    serviceDurationMinutes: totalDuration,
    workingBlocks: (schedules ?? []).map((s) => ({ startTime: s.start_time, endTime: s.end_time })),
    timeOffBlocks: (timeOff ?? []).map((t) => ({ startTime: t.start_time, endTime: t.end_time })),
    busyBlocks: (appointments ?? []).map((a) => ({
      start: new Date(a.start_time),
      end: new Date(a.end_time),
    })),
  });

  return { slots: slots.map((s) => s.toISOString()) };
}

export type CreateAppointmentState = { error?: string; success?: boolean } | undefined;

export async function createAppointmentAction(
  _prevState: CreateAppointmentState,
  formData: FormData
): Promise<CreateAppointmentState> {
  const parsed = bookingSchema.safeParse({
    serviceIds: formData.getAll("serviceIds"),
    barberId: formData.get("barberId"),
    startTime: formData.get("startTime"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const { user, profile } = await requireClient();
  const supabase = await createClient();

  const [{ data: services }, { data: barber }] = await Promise.all([
    supabase.from("services").select("id, duration_minutes, name, price").in("id", parsed.data.serviceIds),
    supabase.from("profiles").select("full_name").eq("id", parsed.data.barberId).single(),
  ]);
  if (!services || services.length !== parsed.data.serviceIds.length) {
    return { error: "Um dos serviços selecionados não foi encontrado" };
  }
  if (!barber) return { error: "Barbeiro não encontrado" };

  const orderedServices = parsed.data.serviceIds.map((id) => services.find((s) => s.id === id)!);
  const totalMinutes = orderedServices.reduce((sum, s) => sum + s.duration_minutes, 0);

  const startTime = new Date(parsed.data.startTime);
  const endTime = new Date(startTime.getTime() + totalMinutes * 60_000);

  if (startTime < new Date()) {
    return { error: "Escolha um horário no futuro" };
  }

  const { data: appointment, error } = await supabase
    .from("appointments")
    .insert({
      client_id: user.id,
      barber_id: parsed.data.barberId,
      service_id: orderedServices[0].id,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23P01") {
      return { error: "Esse horário acabou de ser reservado. Escolha outro." };
    }
    return { error: "Não foi possível criar o agendamento" };
  }

  await supabase.from("appointment_services").insert(
    orderedServices.map((s) => ({
      appointment_id: appointment.id,
      service_id: s.id,
      service_name: s.name,
      price: s.price,
      duration_minutes: s.duration_minutes,
    }))
  );

  revalidatePath("/");

  await notifyAppointment({
    appointmentId: appointment.id,
    type: "confirmation",
    clientName: profile.full_name,
    clientEmail: user.email ?? "",
    clientPhone: profile.phone,
    barberName: barber.full_name,
    serviceName: orderedServices.map((s) => s.name).join(" + "),
    startTime,
  });

  return { success: true };
}

export async function rescheduleAppointmentAction(
  appointmentId: string,
  newStartTimeISO: string
): Promise<{ error?: string; success?: boolean }> {
  const { user, profile } = await requireClient();
  const supabase = await createClient();

  const { data: current } = await supabase
    .from("appointments")
    .select(
      "service:services(name, duration_minutes), barber:profiles!appointments_barber_id_fkey(full_name), appointment_services(service_name, duration_minutes)"
    )
    .eq("id", appointmentId)
    .eq("client_id", user.id)
    .single();
  if (!current) return { error: "Agendamento não encontrado" };

  const service = Array.isArray(current.service) ? current.service[0] : current.service;
  const barber = Array.isArray(current.barber) ? current.barber[0] : current.barber;
  const items = current.appointment_services?.length
    ? current.appointment_services
    : service
      ? [{ service_name: service.name, duration_minutes: service.duration_minutes }]
      : [];
  if (items.length === 0) return { error: "Agendamento não encontrado" };

  const totalMinutes = items.reduce((sum, i) => sum + i.duration_minutes, 0);
  const serviceName = items.map((i) => i.service_name).join(" + ");

  const startTime = new Date(newStartTimeISO);
  if (startTime < new Date()) {
    return { error: "Escolha um horário no futuro" };
  }
  const endTime = new Date(startTime.getTime() + totalMinutes * 60_000);

  const { error } = await supabase
    .from("appointments")
    .update({ start_time: startTime.toISOString(), end_time: endTime.toISOString() })
    .eq("id", appointmentId)
    .eq("client_id", user.id);

  if (error) {
    if (error.code === "23P01") {
      return { error: "Esse horário acabou de ser reservado. Escolha outro." };
    }
    return { error: "Não foi possível trocar o horário" };
  }

  revalidatePath("/");

  await notifyAppointment({
    appointmentId,
    type: "rescheduled",
    clientName: profile.full_name,
    clientEmail: user.email ?? "",
    clientPhone: profile.phone,
    barberName: barber?.full_name ?? "",
    serviceName,
    startTime,
  });

  return { success: true };
}

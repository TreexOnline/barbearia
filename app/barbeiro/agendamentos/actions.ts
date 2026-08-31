"use server";

import { randomBytes } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireBarber } from "@/lib/auth";
import { notifyAppointment } from "@/lib/notifications/notify";
import { normalizeAuthPhone } from "@/lib/phone";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { AppointmentStatus } from "@/lib/database.types";

export async function updateAppointmentStatusAction(appointmentId: string, status: AppointmentStatus) {
  const { user, profile } = await requireBarber();
  const supabase = await createClient();

  let query = supabase.from("appointments").update({ status }).eq("id", appointmentId);
  if (!profile.is_admin) query = query.eq("barber_id", user.id);

  const { data: appointment, error } = await query
    .select(
      "id, start_time, client_id, client:profiles!appointments_client_id_fkey(full_name, phone), service:services(name), barber:profiles!appointments_barber_id_fkey(full_name, phone), appointment_services(service_name)"
    )
    .single();

  if (error || !appointment) {
    return { error: "Não foi possível atualizar o agendamento" };
  }

  revalidatePath("/barbeiro/agendamentos");
  revalidatePath("/barbeiro/dashboard");
  revalidatePath("/barbeiro/lucros");

  if (status === "cancelled") {
    const client = Array.isArray(appointment.client) ? appointment.client[0] : appointment.client;
    const service = Array.isArray(appointment.service) ? appointment.service[0] : appointment.service;
    const barber = Array.isArray(appointment.barber) ? appointment.barber[0] : appointment.barber;
    const serviceName = appointment.appointment_services?.length
      ? appointment.appointment_services.map((s) => s.service_name).join(" + ")
      : (service?.name ?? "");

    const admin = createAdminClient();
    const { data: authUser } = await admin.auth.admin.getUserById(appointment.client_id);

    await notifyAppointment({
      appointmentId: appointment.id,
      type: "cancellation",
      clientName: client?.full_name ?? "",
      clientEmail: authUser?.user?.email ?? "",
      clientPhone: client?.phone ?? null,
      barberName: barber?.full_name ?? "",
      barberPhone: barber?.phone ?? null,
      serviceName,
      price: null,
      startTime: new Date(appointment.start_time),
    });
  }

  return { success: true };
}

/** Encontra (por telefone) ou cria um profile "avulso" (sem login) pra um cliente sem cadastro. */
async function resolveGuestClientId(admin: ReturnType<typeof createAdminClient>, name: string, phone?: string) {
  const normalizedPhone = phone ? normalizeAuthPhone(phone) : null;

  if (normalizedPhone) {
    const { data: existing } = await admin
      .from("profiles")
      .select("id")
      .eq("phone", normalizedPhone)
      .maybeSingle();
    if (existing) return existing.id;
  }

  const { data: created, error } = await admin.auth.admin.createUser({
    phone: normalizedPhone ?? undefined,
    password: randomBytes(24).toString("hex"),
    phone_confirm: Boolean(normalizedPhone),
    user_metadata: { full_name: name, guest: true },
  });
  if (error || !created.user) return null;

  await admin
    .from("profiles")
    .update({ role: "client", full_name: name, phone: normalizedPhone })
    .eq("id", created.user.id);

  return created.user.id;
}

const clientFields = z.object({
  clientMode: z.enum(["existing", "guest"]),
  clientId: z.string().uuid().optional(),
  guestName: z.string().min(2, "Informe o nome do cliente").optional(),
  guestPhone: z.string().optional(),
});

const newAppointmentSchema = z
  .object({
    serviceIds: z.array(z.string().uuid()).min(1, "Selecione ao menos um serviço"),
    date: z.string().min(1, "Selecione uma data"),
    time: z.string().regex(/^\d{2}:\d{2}$/, "Selecione um horário"),
  })
  .and(clientFields);

export type NewAppointmentState = { error?: string; success?: boolean } | undefined;

export async function createAppointmentForClientAction(
  _prevState: NewAppointmentState,
  formData: FormData
): Promise<NewAppointmentState> {
  const { user: barberUser } = await requireBarber();

  const parsed = newAppointmentSchema.safeParse({
    clientMode: formData.get("clientMode"),
    clientId: formData.get("clientId") || undefined,
    guestName: formData.get("guestName") || undefined,
    guestPhone: formData.get("guestPhone") || undefined,
    serviceIds: formData.getAll("serviceIds"),
    date: formData.get("date"),
    time: formData.get("time"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const admin = createAdminClient();

  let clientId: string;
  if (parsed.data.clientMode === "existing") {
    if (!parsed.data.clientId) return { error: "Selecione um cliente" };
    clientId = parsed.data.clientId;
  } else {
    if (!parsed.data.guestName) return { error: "Informe o nome do cliente" };
    const guestId = await resolveGuestClientId(admin, parsed.data.guestName, parsed.data.guestPhone);
    if (!guestId) return { error: "Não foi possível registrar o cliente avulso" };
    clientId = guestId;
  }

  const supabase = await createClient();
  const [{ data: services }, { data: barber }, { data: client }] = await Promise.all([
    supabase.from("services").select("id, duration_minutes, name, price").in("id", parsed.data.serviceIds),
    supabase.from("profiles").select("full_name, phone").eq("id", barberUser.id).single(),
    supabase.from("profiles").select("full_name, phone").eq("id", clientId).single(),
  ]);
  if (!services || services.length !== parsed.data.serviceIds.length) {
    return { error: "Um dos serviços selecionados não foi encontrado" };
  }
  if (!barber) return { error: "Barbeiro não encontrado" };
  if (!client) return { error: "Cliente não encontrado" };

  const orderedServices = parsed.data.serviceIds.map((id) => services.find((s) => s.id === id)!);
  const totalMinutes = orderedServices.reduce((sum, s) => sum + s.duration_minutes, 0);

  const startTime = new Date(`${parsed.data.date}T${parsed.data.time}:00`);
  if (Number.isNaN(startTime.getTime())) return { error: "Data ou horário inválido" };
  const endTime = new Date(startTime.getTime() + totalMinutes * 60_000);

  // RLS só permite client_id = auth.uid() no insert (agendamento feito pelo
  // próprio cliente); aqui é o barbeiro/admin criando em nome do cliente,
  // então usamos o client admin.
  const { data: appointment, error } = await admin
    .from("appointments")
    .insert({
      client_id: clientId,
      barber_id: barberUser.id,
      service_id: orderedServices[0].id,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      status: "confirmed",
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23P01") {
      return { error: "Esse horário já está ocupado." };
    }
    return { error: "Não foi possível criar o agendamento" };
  }

  await admin.from("appointment_services").insert(
    orderedServices.map((s) => ({
      appointment_id: appointment.id,
      service_id: s.id,
      service_name: s.name,
      price: s.price,
      duration_minutes: s.duration_minutes,
    }))
  );

  const { data: authUser } = await admin.auth.admin.getUserById(clientId);
  await notifyAppointment({
    appointmentId: appointment.id,
    type: "confirmation",
    clientName: client.full_name,
    clientEmail: authUser?.user?.email ?? "",
    clientPhone: client.phone,
    barberName: barber.full_name,
    barberPhone: barber.phone,
    serviceName: orderedServices.map((s) => s.name).join(" + "),
    price: orderedServices.reduce((sum, s) => sum + s.price, 0),
    startTime,
  });

  revalidatePath("/barbeiro/agendamentos");
  revalidatePath("/barbeiro/dashboard");
  revalidatePath("/barbeiro/usuarios");

  return { success: true };
}

const editAppointmentSchema = z
  .object({
    appointmentId: z.string().uuid(),
    serviceId: z.string().uuid("Selecione um serviço"),
    date: z.string().min(1, "Selecione uma data"),
    time: z.string().regex(/^\d{2}:\d{2}$/, "Selecione um horário"),
  })
  .and(clientFields);

export async function updateAppointmentAction(
  _prevState: NewAppointmentState,
  formData: FormData
): Promise<NewAppointmentState> {
  const { user: barberUser, profile } = await requireBarber();

  const parsed = editAppointmentSchema.safeParse({
    appointmentId: formData.get("appointmentId"),
    clientMode: formData.get("clientMode"),
    clientId: formData.get("clientId") || undefined,
    guestName: formData.get("guestName") || undefined,
    guestPhone: formData.get("guestPhone") || undefined,
    serviceId: formData.get("serviceId"),
    date: formData.get("date"),
    time: formData.get("time"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const admin = createAdminClient();

  let clientId: string;
  if (parsed.data.clientMode === "existing") {
    if (!parsed.data.clientId) return { error: "Selecione um cliente" };
    clientId = parsed.data.clientId;
  } else {
    if (!parsed.data.guestName) return { error: "Informe o nome do cliente" };
    const guestId = await resolveGuestClientId(admin, parsed.data.guestName, parsed.data.guestPhone);
    if (!guestId) return { error: "Não foi possível registrar o cliente avulso" };
    clientId = guestId;
  }

  const supabase = await createClient();
  const { data: service } = await supabase
    .from("services")
    .select("duration_minutes")
    .eq("id", parsed.data.serviceId)
    .single();
  if (!service) return { error: "Serviço não encontrado" };

  const startTime = new Date(`${parsed.data.date}T${parsed.data.time}:00`);
  if (Number.isNaN(startTime.getTime())) return { error: "Data ou horário inválido" };
  const endTime = new Date(startTime.getTime() + service.duration_minutes * 60_000);

  let query = admin
    .from("appointments")
    .update({
      client_id: clientId,
      service_id: parsed.data.serviceId,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
    })
    .eq("id", parsed.data.appointmentId);
  if (!profile.is_admin) query = query.eq("barber_id", barberUser.id);

  const { error } = await query;
  if (error) {
    if (error.code === "23P01") {
      return { error: "Esse horário já está ocupado." };
    }
    return { error: "Não foi possível salvar as alterações" };
  }

  revalidatePath("/barbeiro/agendamentos");
  revalidatePath("/barbeiro/dashboard");
  revalidatePath("/barbeiro/usuarios");

  return { success: true };
}

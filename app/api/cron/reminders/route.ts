import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyAppointment } from "@/lib/notifications/notify";

/**
 * Chamado por um cron externo (ex: cron-job.org) a cada poucos minutos.
 * Manda o lembrete de "faltam 10 minutos" pra quem tem agendamento
 * chegando, uma vez só por agendamento (checa o notification_log).
 *
 * GET /api/cron/reminders?secret=CRON_SECRET
 */
export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const now = new Date();
  // Janela larga (5–15 min à frente) pra garantir que todo agendamento seja
  // pego por pelo menos uma execução do cron, mesmo que ele atrase um pouco.
  const windowStart = new Date(now.getTime() + 5 * 60_000);
  const windowEnd = new Date(now.getTime() + 15 * 60_000);

  const { data: appointments, error } = await admin
    .from("appointments")
    .select(
      "id, start_time, client_id, client:profiles!appointments_client_id_fkey(full_name, phone), barber:profiles!appointments_barber_id_fkey(full_name, phone), service:services(name, price), appointment_services(service_name, price)"
    )
    .in("status", ["confirmed", "pending"])
    .gte("start_time", windowStart.toISOString())
    .lte("start_time", windowEnd.toISOString());

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let sent = 0;
  for (const appt of appointments ?? []) {
    const { data: alreadySent } = await admin
      .from("notification_log")
      .select("id")
      .eq("appointment_id", appt.id)
      .eq("type", "reminder")
      .eq("channel", "whatsapp")
      .eq("status", "sent")
      .maybeSingle();
    if (alreadySent) continue;

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
      type: "reminder",
      clientName: client.full_name,
      clientEmail: authUser?.user?.email ?? "",
      clientPhone: client.phone,
      barberName: barber?.full_name ?? "",
      barberPhone: barber?.phone ?? null,
      serviceName: items.map((i) => i.service_name).join(" + "),
      price: items.reduce((sum, i) => sum + i.price, 0),
      startTime: new Date(appt.start_time),
    });
    sent++;
  }

  return NextResponse.json({ checked: appointments?.length ?? 0, sent });
}

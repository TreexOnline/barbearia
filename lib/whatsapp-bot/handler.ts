import { addDays, format, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveGuestClientId } from "@/lib/guest-client";
import { sendWhatsApp } from "@/lib/notifications/whatsapp";
import { notifyAppointment } from "@/lib/notifications/notify";
import { getAvailableSlots } from "@/lib/availability";
import { normalizeAuthPhone } from "@/lib/phone";
import type { Json } from "@/lib/database.types";

const SESSION_TIMEOUT_MS = 30 * 60_000;
const DAYS_TO_OFFER = 7;
const MAX_DATE_OPTIONS = 6;

interface ServiceMenuItem {
  id: string;
  name: string;
  price: number;
  duration_minutes: number;
}

interface SessionData {
  clientId?: string;
  clientName?: string;
  barberId?: string;
  barberName?: string;
  serviceMenu?: ServiceMenuItem[];
  selectedServiceIds?: string[];
  dateMenu?: string[];
  selectedDate?: string;
  timeMenu?: string[];
  _lastMessageId?: string;
}

type Step = "awaiting_name" | "awaiting_service" | "awaiting_date" | "awaiting_time";

const currency = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

async function reply(phone: string, message: string) {
  await sendWhatsApp({ phone, message });
}

async function getSession(admin: ReturnType<typeof createAdminClient>, phone: string) {
  const { data } = await admin.from("whatsapp_sessions").select("*").eq("phone", phone).maybeSingle();
  if (!data) return null;
  const isStale = Date.now() - new Date(data.updated_at).getTime() > SESSION_TIMEOUT_MS;
  if (isStale) return null;
  return { step: data.step as Step, data: data.data as SessionData };
}

async function saveSession(
  admin: ReturnType<typeof createAdminClient>,
  phone: string,
  step: Step,
  data: SessionData
) {
  await admin
    .from("whatsapp_sessions")
    .upsert({ phone, step, data: data as Json, updated_at: new Date().toISOString() }, { onConflict: "phone" });
}

async function clearSession(admin: ReturnType<typeof createAdminClient>, phone: string) {
  await admin.from("whatsapp_sessions").delete().eq("phone", phone);
}

async function sendServiceMenu(admin: ReturnType<typeof createAdminClient>, phone: string, name: string) {
  const { data: services } = await admin
    .from("services")
    .select("id, name, price, duration_minutes")
    .eq("active", true)
    .order("name");

  const menu = (services ?? []) as ServiceMenuItem[];
  if (menu.length === 0) {
    await reply(phone, "Desculpa, não temos nenhum serviço cadastrado no momento. Tenta de novo mais tarde 🙏");
    await clearSession(admin, phone);
    return;
  }

  const lines = menu.map(
    (s, i) => `${i + 1}. ${s.name} — ${currency(s.price)} (${s.duration_minutes} min)`
  );
  await reply(
    phone,
    `Boa, ${name}! 💈 Qual serviço você quer marcar?\n\n${lines.join("\n")}\n\n` +
      `Responde com o número. Se quiser mais de um, separa por vírgula (ex: 1,2).`
  );

  await saveSession(admin, phone, "awaiting_service", { clientName: name, serviceMenu: menu });
}

async function sendDateMenu(
  admin: ReturnType<typeof createAdminClient>,
  phone: string,
  session: { step: Step; data: SessionData }
) {
  const { data: barberRows } = await admin
    .from("profiles")
    .select("id, full_name, barber_schedules!inner(id)")
    .eq("role", "barber");
  const barber = (barberRows ?? [])[0] as { id: string; full_name: string } | undefined;
  if (!barber) {
    await reply(phone, "Desculpa, não tem nenhum barbeiro disponível pra agendar agora. Tenta mais tarde 🙏");
    await clearSession(admin, phone);
    return;
  }

  const services = session.data.serviceMenu ?? [];
  const selected = services.filter((s) => session.data.selectedServiceIds?.includes(s.id));
  const totalMinutes = selected.reduce((sum, s) => sum + s.duration_minutes, 0);

  const today = startOfDay(new Date());
  const rangeStart = format(today, "yyyy-MM-dd");
  const rangeEnd = format(addDays(today, 30), "yyyy-MM-dd");

  const [{ data: schedules }, { data: timeOff }, { data: appointments }] = await Promise.all([
    admin.from("barber_schedules").select("weekday, start_time, end_time").eq("barber_id", barber.id),
    admin
      .from("barber_time_off")
      .select("date, start_time, end_time")
      .eq("barber_id", barber.id)
      .gte("date", rangeStart)
      .lte("date", rangeEnd),
    admin
      .from("appointments")
      .select("start_time, end_time")
      .eq("barber_id", barber.id)
      .neq("status", "cancelled")
      .gte("start_time", `${rangeStart}T00:00:00-03:00`)
      .lte("start_time", `${rangeEnd}T23:59:59.999-03:00`),
  ]);

  const dateOptions: string[] = [];
  for (let i = 0; i < DAYS_TO_OFFER * 2 && dateOptions.length < MAX_DATE_OPTIONS; i++) {
    const day = addDays(today, i);
    const dateStr = format(day, "yyyy-MM-dd");
    const weekday = day.getDay();

    const slots = getAvailableSlots({
      day,
      serviceDurationMinutes: totalMinutes,
      workingBlocks: (schedules ?? [])
        .filter((s) => s.weekday === weekday)
        .map((s) => ({ startTime: s.start_time, endTime: s.end_time })),
      timeOffBlocks: (timeOff ?? [])
        .filter((t) => t.date === dateStr)
        .map((t) => ({ startTime: t.start_time, endTime: t.end_time })),
      busyBlocks: (appointments ?? []).map((a) => ({ start: new Date(a.start_time), end: new Date(a.end_time) })),
    });

    if (slots.length > 0) dateOptions.push(dateStr);
  }

  if (dateOptions.length === 0) {
    await reply(phone, "Não achei nenhum horário livre nos próximos dias 😕 Tenta de novo mais tarde.");
    await clearSession(admin, phone);
    return;
  }

  const lines = dateOptions.map(
    (d, i) => `${i + 1}. ${format(new Date(`${d}T12:00:00`), "EEEE, dd/MM", { locale: ptBR })}`
  );
  await reply(phone, `Show! Agora escolhe o dia:\n\n${lines.join("\n")}\n\nResponde com o número.`);

  await saveSession(admin, phone, "awaiting_date", {
    ...session.data,
    barberId: barber.id,
    barberName: barber.full_name,
    dateMenu: dateOptions,
  });
}

async function sendTimeMenu(
  admin: ReturnType<typeof createAdminClient>,
  phone: string,
  session: { step: Step; data: SessionData }
) {
  const services = session.data.serviceMenu ?? [];
  const selected = services.filter((s) => session.data.selectedServiceIds?.includes(s.id));
  const totalMinutes = selected.reduce((sum, s) => sum + s.duration_minutes, 0);
  const dateStr = session.data.selectedDate!;
  const barberId = session.data.barberId!;

  const [{ data: schedules }, { data: timeOff }, { data: appointments }] = await Promise.all([
    admin
      .from("barber_schedules")
      .select("start_time, end_time")
      .eq("barber_id", barberId)
      .eq("weekday", new Date(`${dateStr}T12:00:00`).getDay()),
    admin.from("barber_time_off").select("start_time, end_time").eq("barber_id", barberId).eq("date", dateStr),
    admin
      .from("appointments")
      .select("start_time, end_time")
      .eq("barber_id", barberId)
      .neq("status", "cancelled")
      .gte("start_time", `${dateStr}T00:00:00-03:00`)
      .lte("start_time", `${dateStr}T23:59:59.999-03:00`),
  ]);

  const slots = getAvailableSlots({
    day: new Date(`${dateStr}T12:00:00`),
    serviceDurationMinutes: totalMinutes,
    workingBlocks: (schedules ?? []).map((s) => ({ startTime: s.start_time, endTime: s.end_time })),
    timeOffBlocks: (timeOff ?? []).map((t) => ({ startTime: t.start_time, endTime: t.end_time })),
    busyBlocks: (appointments ?? []).map((a) => ({ start: new Date(a.start_time), end: new Date(a.end_time) })),
  });

  if (slots.length === 0) {
    await reply(phone, "Esse dia acabou de lotar 😕 Escolhe outro:");
    await sendDateMenu(admin, phone, session);
    return;
  }

  const timeMenu = slots.map((s) => s.toISOString());
  const lines = timeMenu.map((t, i) => `${i + 1}. ${format(new Date(t), "HH:mm")}`);
  await reply(phone, `Beleza, quais horários tem nesse dia:\n\n${lines.join("\n")}\n\nResponde com o número.`);

  await saveSession(admin, phone, "awaiting_time", { ...session.data, timeMenu });
}

/**
 * Chamado pelo webhook toda vez que chega uma mensagem de texto de um
 * número. O Evolution/Baileys costuma disparar o mesmo "messages.upsert"
 * mais de uma vez pro mesmo id (status pending/delivered/read mudando) —
 * por isso o dedup por messageId antes de processar de verdade.
 */
export async function handleIncomingMessage({
  phoneRaw,
  text,
  pushName,
  messageId,
}: {
  phoneRaw: string;
  text: string;
  pushName: string | null;
  messageId: string;
}) {
  const phone = normalizeAuthPhone(phoneRaw);
  const admin = createAdminClient();

  const { data: raw } = await admin.from("whatsapp_sessions").select("data").eq("phone", phone).maybeSingle();
  const lastMessageId = (raw?.data as SessionData | undefined)?._lastMessageId;
  if (lastMessageId && lastMessageId === messageId) return;

  await processMessage({ phone, text, pushName, admin });

  const { data: after } = await admin.from("whatsapp_sessions").select("data").eq("phone", phone).maybeSingle();
  if (after) {
    await admin
      .from("whatsapp_sessions")
      .update({ data: { ...(after.data as object), _lastMessageId: messageId } as Json })
      .eq("phone", phone);
  }
}

async function processMessage({
  phone,
  text,
  pushName,
  admin,
}: {
  phone: string;
  text: string;
  pushName: string | null;
  admin: ReturnType<typeof createAdminClient>;
}) {
  const trimmed = text.trim();

  if (/^(cancelar|sair|reiniciar)$/i.test(trimmed)) {
    await clearSession(admin, phone);
    await reply(phone, "Combinado, cancelei o que estava rolando. Manda um oi quando quiser começar de novo! 👋");
    return;
  }

  const session = await getSession(admin, phone);

  if (!session) {
    const { data: existing } = await admin
      .from("profiles")
      .select("id, full_name")
      .eq("phone", phone)
      .eq("role", "client")
      .maybeSingle();

    if (existing) {
      await sendServiceMenu(admin, phone, existing.full_name);
      const current = await getSession(admin, phone);
      if (current) await saveSession(admin, phone, current.step, { ...current.data, clientId: existing.id });
      return;
    }

    const nameHint = pushName ? ` (vi aqui que no WhatsApp você é "${pushName}" — pode confirmar ou mandar outro)` : "";
    await reply(
      phone,
      `Oi! 💈 Sou o assistente da *Garage Barbershop*.\n\nPra agendar seu horário, qual é o seu nome?${nameHint}`
    );
    await saveSession(admin, phone, "awaiting_name", {});
    return;
  }

  switch (session.step) {
    case "awaiting_name": {
      if (trimmed.length < 2) {
        await reply(phone, "Manda seu nome completo, por favor 🙂");
        return;
      }
      const clientId = await resolveGuestClientId(admin, trimmed, phone);
      if (!clientId) {
        await reply(phone, "Não consegui te cadastrar agora 😕 Tenta de novo em instantes.");
        await clearSession(admin, phone);
        return;
      }
      await sendServiceMenu(admin, phone, trimmed);
      const current = await getSession(admin, phone);
      if (current) await saveSession(admin, phone, current.step, { ...current.data, clientId, clientName: trimmed });
      return;
    }

    case "awaiting_service": {
      const menu = session.data.serviceMenu ?? [];
      const indexes = trimmed
        .split(",")
        .map((n) => parseInt(n.trim(), 10))
        .filter((n) => !Number.isNaN(n));
      const valid = indexes.length > 0 && indexes.every((n) => n >= 1 && n <= menu.length);
      if (!valid) {
        await reply(phone, "Não entendi 😕 Responde só com o número (ou números separados por vírgula) do serviço.");
        return;
      }
      const selectedServiceIds = [...new Set(indexes.map((n) => menu[n - 1].id))];
      await saveSession(admin, phone, "awaiting_service", { ...session.data, selectedServiceIds });
      const updated = await getSession(admin, phone);
      if (updated) await sendDateMenu(admin, phone, updated);
      return;
    }

    case "awaiting_date": {
      const dateMenu = session.data.dateMenu ?? [];
      const index = parseInt(trimmed, 10);
      if (Number.isNaN(index) || index < 1 || index > dateMenu.length) {
        await reply(phone, "Não entendi 😕 Responde só com o número do dia que você quer.");
        return;
      }
      const selectedDate = dateMenu[index - 1];
      await saveSession(admin, phone, "awaiting_date", { ...session.data, selectedDate });
      const updated = await getSession(admin, phone);
      if (updated) await sendTimeMenu(admin, phone, updated);
      return;
    }

    case "awaiting_time": {
      const timeMenu = session.data.timeMenu ?? [];
      const index = parseInt(trimmed, 10);
      if (Number.isNaN(index) || index < 1 || index > timeMenu.length) {
        await reply(phone, "Não entendi 😕 Responde só com o número do horário que você quer.");
        return;
      }

      const { clientId, clientName, barberId, barberName, serviceMenu, selectedServiceIds } = session.data;
      const services = (serviceMenu ?? []).filter((s) => selectedServiceIds?.includes(s.id));
      if (!clientId || !barberId || services.length === 0) {
        await reply(phone, "Ops, algo deu errado 😕 Manda um oi pra começar de novo.");
        await clearSession(admin, phone);
        return;
      }

      let cursor = new Date(timeMenu[index - 1]);
      const createdIds: string[] = [];
      for (const service of services) {
        const startTime = cursor;
        const endTime = new Date(startTime.getTime() + service.duration_minutes * 60_000);

        const { data: appointment, error } = await admin
          .from("appointments")
          .insert({
            client_id: clientId,
            barber_id: barberId,
            service_id: service.id,
            start_time: startTime.toISOString(),
            end_time: endTime.toISOString(),
            status: "confirmed",
          })
          .select("id")
          .single();

        if (error) {
          if (error.code === "23P01") {
            await reply(phone, "Esse horário acabou de ser reservado por outra pessoa 😕 Escolhe outro:");
            await sendTimeMenu(admin, phone, session);
            return;
          }
          await reply(phone, "Não consegui criar o agendamento agora 😕 Tenta de novo em instantes.");
          await clearSession(admin, phone);
          return;
        }

        await admin.from("appointment_services").insert({
          appointment_id: appointment.id,
          service_id: service.id,
          service_name: service.name,
          price: service.price,
          duration_minutes: service.duration_minutes,
        });

        createdIds.push(appointment.id);
        cursor = endTime;

        const { data: authUser } = await admin.auth.admin.getUserById(clientId);
        const { data: barberProfile } = await admin.from("profiles").select("phone").eq("id", barberId).single();

        await notifyAppointment({
          appointmentId: appointment.id,
          type: "confirmation",
          clientName: clientName ?? "",
          clientEmail: authUser?.user?.email ?? "",
          clientPhone: phone,
          barberName: barberName ?? "",
          barberPhone: barberProfile?.phone ?? null,
          serviceName: service.name,
          price: service.price,
          startTime,
        });
      }

      await clearSession(admin, phone);
      return;
    }
  }
}

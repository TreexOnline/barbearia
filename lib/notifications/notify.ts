import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/notifications/email";
import { sendWhatsApp } from "@/lib/notifications/whatsapp";
import type { NotificationType } from "@/lib/database.types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AppointmentNotificationInput {
  appointmentId: string;
  type: NotificationType;
  clientName: string;
  clientEmail: string;
  clientPhone: string | null;
  barberName: string;
  barberPhone: string | null;
  serviceName: string;
  price: number | null;
  startTime: Date;
}

const SUBJECTS: Record<NotificationType, string> = {
  confirmation: "Agendamento confirmado",
  reminder: "Lembrete do seu horário",
  cancellation: "Agendamento cancelado",
  rescheduled: "Agendamento remarcado",
};

const currency = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

function buildMessage(input: AppointmentNotificationInput): string {
  const when = format(input.startTime, "EEEE, dd/MM 'às' HH:mm", { locale: ptBR });
  const priceLine = input.price != null ? `\n💰 Valor: ${currency(input.price)}` : "";
  switch (input.type) {
    case "confirmation":
      return (
        `✅ *Agendamento confirmado!*\n\n` +
        `Olá ${input.clientName}, seu horário foi marcado:\n\n` +
        `💈 Serviço: ${input.serviceName}\n` +
        `🧔 Barbeiro: ${input.barberName}\n` +
        `📅 ${when}${priceLine}\n\n` +
        `Te esperamos na Garage Barbershop! 🙌`
      );
    case "reminder":
      return (
        `⏰ *Faltam 10 minutos!*\n\n` +
        `Olá ${input.clientName}, seu horário está chegando:\n\n` +
        `💈 Serviço: ${input.serviceName}\n` +
        `🧔 Barbeiro: ${input.barberName}\n` +
        `📅 Hoje às ${format(input.startTime, "HH:mm")}${priceLine}\n\n` +
        `Te esperamos aí! 🙌`
      );
    case "cancellation":
      return (
        `❌ *Agendamento cancelado*\n\n` +
        `Olá ${input.clientName}, infelizmente seu horário de ${input.serviceName} com ${input.barberName} em ${when} foi cancelado.\n\n` +
        `Fala com o barbeiro pra saber o motivo, ou agenda um novo horário quando quiser. 🙏`
      );
    case "rescheduled":
      return (
        `🔄 *Agendamento remarcado*\n\n` +
        `Olá ${input.clientName}, seu horário foi alterado:\n\n` +
        `💈 Serviço: ${input.serviceName}\n` +
        `🧔 Barbeiro: ${input.barberName}\n` +
        `📅 Novo horário: ${when}${priceLine}`
      );
  }
}

/** Mensagem enviada pro barbeiro (não pro cliente) sobre o mesmo evento. */
function buildBarberMessage(input: AppointmentNotificationInput): string {
  const when = format(input.startTime, "EEEE, dd/MM 'às' HH:mm", { locale: ptBR });
  const priceLine = input.price != null ? `\n💰 Valor: ${currency(input.price)}` : "";
  const clientPhoneLine = input.clientPhone ? `\n📞 ${input.clientPhone}` : "";
  switch (input.type) {
    case "confirmation":
      return (
        `🆕 *Novo agendamento!*\n\n` +
        `👤 Cliente: ${input.clientName}${clientPhoneLine}\n` +
        `💈 Vai cortar: ${input.serviceName}\n` +
        `📅 ${when}${priceLine}`
      );
    case "reminder":
      return (
        `⏰ *Faltam 10 minutos!*\n\n` +
        `👤 Cliente: ${input.clientName}${clientPhoneLine}\n` +
        `💈 ${input.serviceName}\n` +
        `📅 Hoje às ${format(input.startTime, "HH:mm")}${priceLine}`
      );
    case "cancellation":
      return `❌ *Cancelado*: ${input.clientName} cancelou ${input.serviceName} que seria em ${when}.`;
    case "rescheduled":
      return (
        `🔄 *Remarcado*\n\n` +
        `👤 Cliente: ${input.clientName}${clientPhoneLine}\n` +
        `💈 ${input.serviceName}\n` +
        `📅 Novo horário: ${when}${priceLine}`
      );
  }
}

/**
 * Dispara email + WhatsApp de forma best-effort (não lança erro em caso de
 * falha de envio) e registra o resultado em notification_log.
 */
export async function notifyAppointment(input: AppointmentNotificationInput) {
  const message = buildMessage(input);
  const admin = createAdminClient();

  const emailHtml = `<p>${message
    .replace(/\*(.+?)\*/g, "<strong>$1</strong>")
    .replace(/\n/g, "<br>")}</p>`;

  const [emailResult, whatsappResult] = await Promise.all([
    input.clientEmail
      ? sendEmail({ to: input.clientEmail, subject: SUBJECTS[input.type], html: emailHtml })
      : Promise.resolve({ ok: false, error: "Sem email" }),
    input.clientPhone ? sendWhatsApp({ phone: input.clientPhone, message }) : Promise.resolve({ ok: false, error: "Sem telefone" }),
    // Aviso pro barbeiro, best-effort — não entra no notification_log (essa
    // tabela acompanha só as notificações enviadas ao cliente).
    input.barberPhone
      ? sendWhatsApp({ phone: input.barberPhone, message: buildBarberMessage(input) })
      : Promise.resolve({ ok: false, error: "Sem telefone" }),
  ]);

  const logEntries = [
    input.clientEmail && {
      appointment_id: input.appointmentId,
      channel: "email" as const,
      type: input.type,
      status: emailResult.ok ? "sent" : `failed: ${emailResult.error}`,
    },
    {
      appointment_id: input.appointmentId,
      channel: "whatsapp" as const,
      type: input.type,
      status: whatsappResult.ok ? "sent" : `failed: ${whatsappResult.error}`,
    },
  ].filter(Boolean) as { appointment_id: string; channel: "email" | "whatsapp"; type: typeof input.type; status: string }[];

  await admin.from("notification_log").insert(logEntries);
}

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
  serviceName: string;
  startTime: Date;
}

const SUBJECTS: Record<NotificationType, string> = {
  confirmation: "Agendamento confirmado",
  reminder: "Lembrete do seu horário",
  cancellation: "Agendamento cancelado",
  rescheduled: "Agendamento remarcado",
};

function buildMessage(input: AppointmentNotificationInput): string {
  const when = format(input.startTime, "EEEE, dd/MM 'às' HH:mm", { locale: ptBR });
  switch (input.type) {
    case "confirmation":
      return `Olá ${input.clientName}! Seu horário de ${input.serviceName} com ${input.barberName} foi confirmado para ${when}.`;
    case "reminder":
      return `Olá ${input.clientName}! Lembrete: você tem ${input.serviceName} com ${input.barberName} hoje às ${format(input.startTime, "HH:mm")}.`;
    case "cancellation":
      return `Olá ${input.clientName}, seu horário de ${input.serviceName} com ${input.barberName} em ${when} foi cancelado.`;
    case "rescheduled":
      return `Olá ${input.clientName}! Seu horário de ${input.serviceName} com ${input.barberName} foi remarcado para ${when}.`;
  }
}

/**
 * Dispara email + WhatsApp de forma best-effort (não lança erro em caso de
 * falha de envio) e registra o resultado em notification_log.
 */
export async function notifyAppointment(input: AppointmentNotificationInput) {
  const message = buildMessage(input);
  const admin = createAdminClient();

  const [emailResult, whatsappResult] = await Promise.all([
    input.clientEmail
      ? sendEmail({ to: input.clientEmail, subject: SUBJECTS[input.type], html: `<p>${message}</p>` })
      : Promise.resolve({ ok: false, error: "Sem email" }),
    input.clientPhone ? sendWhatsApp({ phone: input.clientPhone, message }) : Promise.resolve({ ok: false, error: "Sem telefone" }),
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

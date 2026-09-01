import { NextRequest, NextResponse } from "next/server";
import { EVOLUTION_INSTANCE } from "@/lib/notifications/evolution";
import { handleIncomingMessage } from "@/lib/whatsapp-bot/handler";

interface EvolutionWebhookPayload {
  event?: string;
  instance?: string;
  data?: {
    key?: { remoteJid?: string; fromMe?: boolean };
    pushName?: string;
    message?: { conversation?: string; extendedTextMessage?: { text?: string } };
    messageType?: string;
  };
}

/**
 * Recebe os eventos "messages.upsert" da Evolution API (configurado em
 * /instance/webhook/set) e conduz a conversa do bot de agendamento.
 * Sempre responde 200 rápido — o Evolution não espera nada no corpo.
 */
export async function POST(request: NextRequest) {
  let payload: EvolutionWebhookPayload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: true });
  }

  if (payload.event !== "messages.upsert" || payload.instance !== EVOLUTION_INSTANCE) {
    return NextResponse.json({ ok: true });
  }

  const data = payload.data;
  const remoteJid = data?.key?.remoteJid;
  const fromMe = data?.key?.fromMe;
  const text = data?.message?.conversation ?? data?.message?.extendedTextMessage?.text ?? null;

  if (!remoteJid || fromMe || !text) {
    return NextResponse.json({ ok: true });
  }

  const phoneRaw = remoteJid.split("@")[0];

  try {
    await handleIncomingMessage({ phoneRaw, text, pushName: data?.pushName ?? null });
  } catch (err) {
    console.error("Erro no bot do WhatsApp:", err);
  }

  return NextResponse.json({ ok: true });
}

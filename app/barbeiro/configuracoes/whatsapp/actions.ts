"use server";

import { requireAdmin } from "@/lib/auth";
import {
  fetchWhatsAppQrCode,
  getWhatsAppConnectionState,
  disconnectWhatsApp,
  getEvolutionConfig,
} from "@/lib/notifications/evolution";

export type WhatsAppStatus =
  | { configured: false }
  | { configured: true; state: "open" | "connecting" | "close" | "not_found"; qrCodeBase64?: string | null; error?: string };

export async function checkWhatsAppStatusAction(): Promise<WhatsAppStatus> {
  await requireAdmin();
  if (!getEvolutionConfig()) return { configured: false };

  const result = await getWhatsAppConnectionState();
  if (!result.ok) return { configured: true, state: "close", error: result.error };
  return { configured: true, state: result.state };
}

export async function generateWhatsAppQrAction(): Promise<WhatsAppStatus> {
  await requireAdmin();
  if (!getEvolutionConfig()) return { configured: false };

  const result = await fetchWhatsAppQrCode();
  if (!result.ok) return { configured: true, state: "close", error: result.error };
  return { configured: true, state: result.state, qrCodeBase64: result.qrCodeBase64 };
}

export async function disconnectWhatsAppAction(): Promise<{ error?: string; success?: boolean }> {
  await requireAdmin();
  const result = await disconnectWhatsApp();
  if (!result.ok) return { error: result.error };
  return { success: true };
}

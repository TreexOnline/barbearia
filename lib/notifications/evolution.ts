/**
 * Cliente da Evolution API (https://doc.evolution-api.com) — envio de
 * mensagens e gerenciamento da instância (criar, gerar QR code, checar
 * conexão, desconectar). Um único nome de instância fixo: só existe um
 * número de WhatsApp para o negócio inteiro.
 */
export const EVOLUTION_INSTANCE = "garage-barbershop";

export function getEvolutionConfig() {
  const baseUrl = process.env.EVOLUTION_API_URL;
  const apiKey = process.env.EVOLUTION_API_KEY;
  if (!baseUrl || !apiKey) return null;
  return { baseUrl: baseUrl.replace(/\/$/, ""), apiKey };
}

async function evolutionFetch(path: string, init?: RequestInit) {
  const config = getEvolutionConfig();
  if (!config) return { ok: false as const, error: "Evolution API não configurada", status: 0 };

  try {
    const res = await fetch(`${config.baseUrl}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        apikey: config.apiKey,
        ...init?.headers,
      },
      cache: "no-store",
    });
    const bodyText = await res.text();
    let body: unknown = null;
    try {
      body = bodyText ? JSON.parse(bodyText) : null;
    } catch {
      body = bodyText;
    }
    if (!res.ok) {
      const message =
        body && typeof body === "object" && "message" in body
          ? String((body as { message: unknown }).message)
          : bodyText;
      return { ok: false as const, error: `Evolution API respondeu ${res.status}: ${message}`, status: res.status };
    }
    return { ok: true as const, data: body, status: res.status };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Erro desconhecido",
      status: 0,
    };
  }
}

export type ConnectionState = "open" | "connecting" | "close" | "not_found";

/** Cria a instância (se ainda não existir) e devolve o estado da conexão. */
export async function createWhatsAppInstance() {
  return evolutionFetch("/instance/create", {
    method: "POST",
    body: JSON.stringify({
      instanceName: EVOLUTION_INSTANCE,
      qrcode: true,
      integration: "WHATSAPP-BAILEYS",
    }),
  });
}

/** Pega o QR code atual (base64) pra escanear e conectar o número. */
export async function fetchWhatsAppQrCode(): Promise<
  { ok: true; qrCodeBase64: string | null; state: ConnectionState } | { ok: false; error: string }
> {
  const result = await evolutionFetch(`/instance/connect/${EVOLUTION_INSTANCE}`);
  if (!result.ok) {
    // Instância ainda não existe — cria e tenta buscar o QR de novo.
    if (result.status === 404) {
      const created = await createWhatsAppInstance();
      if (!created.ok) return { ok: false, error: created.error };
      const retry = await evolutionFetch(`/instance/connect/${EVOLUTION_INSTANCE}`);
      if (!retry.ok) return { ok: false, error: retry.error };
      return extractQr(retry.data);
    }
    return { ok: false, error: result.error };
  }
  return extractQr(result.data);
}

function extractQr(
  data: unknown
): { ok: true; qrCodeBase64: string | null; state: ConnectionState } | { ok: false; error: string } {
  if (!data || typeof data !== "object") return { ok: true, qrCodeBase64: null, state: "connecting" };
  const d = data as Record<string, unknown>;
  const base64 =
    (typeof d.base64 === "string" && d.base64) ||
    (typeof d.qrcode === "object" && d.qrcode && "base64" in d.qrcode
      ? String((d.qrcode as Record<string, unknown>).base64)
      : null);
  const stateRaw = typeof d.state === "string" ? d.state : (typeof d.instance === "object" && d.instance ? (d.instance as Record<string, unknown>).state : null);
  const state: ConnectionState = stateRaw === "open" ? "open" : stateRaw === "close" ? "close" : "connecting";
  return { ok: true, qrCodeBase64: base64, state };
}

export async function getWhatsAppConnectionState(): Promise<
  { ok: true; state: ConnectionState } | { ok: false; error: string }
> {
  const result = await evolutionFetch(`/instance/connectionState/${EVOLUTION_INSTANCE}`);
  if (!result.ok) {
    if (result.status === 404) return { ok: true, state: "not_found" };
    return { ok: false, error: result.error };
  }
  const d = result.data as Record<string, unknown> | null;
  const instance = d && typeof d.instance === "object" ? (d.instance as Record<string, unknown>) : d;
  const stateRaw = instance && typeof instance.state === "string" ? instance.state : null;
  const state: ConnectionState = stateRaw === "open" ? "open" : stateRaw === "close" ? "close" : "connecting";
  return { ok: true, state };
}

export async function disconnectWhatsApp() {
  return evolutionFetch(`/instance/logout/${EVOLUTION_INSTANCE}`, { method: "DELETE" });
}

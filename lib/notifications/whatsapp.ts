/**
 * Envio de WhatsApp via Evolution API (https://doc.evolution-api.com).
 * Endpoint padrão: POST {EVOLUTION_API_URL}/message/sendText/{instance}
 * Se a sua instância usar outra versão/rota, ajuste `endpoint` abaixo.
 */
export async function sendWhatsApp({
  phone,
  message,
}: {
  phone: string; // formato: 55DDDNUMERO (só dígitos)
  message: string;
}): Promise<{ ok: boolean; error?: string }> {
  const baseUrl = process.env.EVOLUTION_API_URL;
  const apiKey = process.env.EVOLUTION_API_KEY;
  const instance = process.env.EVOLUTION_INSTANCE;

  if (!baseUrl || !apiKey || !instance) {
    console.warn("Evolution API não configurada — WhatsApp não enviado.");
    return { ok: false, error: "Evolution API não configurada" };
  }

  const number = phone.replace(/\D/g, "");
  const endpoint = `${baseUrl.replace(/\/$/, "")}/message/sendText/${instance}`;

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: apiKey,
      },
      body: JSON.stringify({
        number,
        text: message,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      return { ok: false, error: `Evolution API respondeu ${res.status}: ${body}` };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Erro desconhecido" };
  }
}

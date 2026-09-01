import { randomBytes } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeAuthPhone } from "@/lib/phone";

/** Encontra (por telefone) ou cria um profile "avulso" (sem login) pra um cliente sem cadastro. */
export async function resolveGuestClientId(
  admin: ReturnType<typeof createAdminClient>,
  name: string,
  phone?: string
) {
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

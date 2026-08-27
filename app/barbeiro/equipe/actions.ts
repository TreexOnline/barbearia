"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth";
import { barberFormSchema } from "@/lib/validations";
import { normalizeAuthPhone } from "@/lib/phone";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export type FormState = { error?: string; success?: boolean } | undefined;

export async function createBarberAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  await requireAdmin();

  const parsed = barberFormSchema.safeParse({
    fullName: formData.get("fullName"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    password: formData.get("password"),
    isAdmin: formData.get("isAdmin") === "on",
    commissionPercent: formData.get("commissionPercent") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };

  const admin = createAdminClient();
  const phone = normalizeAuthPhone(parsed.data.phone);

  const { data: existing } = await admin.from("profiles").select("id").eq("phone", phone).maybeSingle();
  if (existing) {
    return { error: "Já existe uma conta com esse celular." };
  }

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: parsed.data.email,
    phone,
    password: parsed.data.password,
    email_confirm: true,
    phone_confirm: true,
    user_metadata: { full_name: parsed.data.fullName },
  });

  if (createError || !created.user) {
    return { error: createError?.message ?? "Não foi possível criar o barbeiro" };
  }

  const { error: updateError } = await admin
    .from("profiles")
    .update({
      role: "barber",
      is_admin: parsed.data.isAdmin,
      commission_percent: parsed.data.commissionPercent ?? 0,
    })
    .eq("id", created.user.id);

  if (updateError) return { error: "Barbeiro criado, mas houve um erro ao definir o perfil" };

  revalidatePath("/barbeiro/equipe");
  return { success: true };
}

const updateBarberSchema = z.object({
  id: z.string().uuid(),
  isAdmin: z.boolean(),
  commissionPercent: z.coerce.number().min(0).max(100),
});

export async function updateBarberAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const { user } = await requireAdmin();

  const parsed = updateBarberSchema.safeParse({
    id: formData.get("id"),
    isAdmin: formData.get("isAdmin") === "on",
    commissionPercent: formData.get("commissionPercent") || 0,
  });
  if (!parsed.success) return { error: "Dados inválidos" };

  if (parsed.data.id === user.id && !parsed.data.isAdmin) {
    return { error: "Você não pode remover seu próprio acesso de admin" };
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ is_admin: parsed.data.isAdmin, commission_percent: parsed.data.commissionPercent })
    .eq("id", parsed.data.id);

  if (error) return { error: "Não foi possível atualizar o barbeiro" };

  revalidatePath("/barbeiro/equipe");
  return { success: true };
}

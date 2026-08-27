"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { loginSchema, registerSchema, forgotPasswordSchema } from "@/lib/validations";
import { normalizeAuthPhone } from "@/lib/phone";
import { redirect } from "next/navigation";

export type AuthActionState = { error?: string } | undefined;

export async function loginAction(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse({
    phone: formData.get("phone"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    phone: normalizeAuthPhone(parsed.data.phone),
    password: parsed.data.password,
  });
  if (error) {
    return { error: "Telefone ou senha incorretos" };
  }

  const next = formData.get("next");
  redirect(typeof next === "string" && next ? next : "/");
}

export async function registerAction(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const parsed = registerSchema.safeParse({
    fullName: formData.get("fullName"),
    phone: formData.get("phone"),
    birthDate: formData.get("birthDate"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const phone = normalizeAuthPhone(parsed.data.phone);
  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("profiles")
    .select("id")
    .eq("phone", phone)
    .maybeSingle();
  if (existing) {
    return { error: "Esse número já está cadastrado. Faça login ou recupere sua senha." };
  }

  const { error: createError } = await admin.auth.admin.createUser({
    phone,
    password: parsed.data.password,
    phone_confirm: true,
    user_metadata: { full_name: parsed.data.fullName, birth_date: parsed.data.birthDate },
  });
  if (createError) {
    return { error: "Não foi possível criar sua conta. Tente novamente." };
  }

  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    phone,
    password: parsed.data.password,
  });
  if (signInError) {
    return { error: "Conta criada, mas não foi possível entrar automaticamente. Faça login." };
  }

  const next = formData.get("next");
  redirect(typeof next === "string" && next ? next : "/");
}

export type ForgotPasswordState = { error?: string; success?: boolean } | undefined;

export async function forgotPasswordAction(
  _prevState: ForgotPasswordState,
  formData: FormData
): Promise<ForgotPasswordState> {
  const parsed = forgotPasswordSchema.safeParse({
    phone: formData.get("phone"),
    birthDate: formData.get("birthDate"),
    newPassword: formData.get("newPassword"),
    confirmNewPassword: formData.get("confirmNewPassword"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const phone = normalizeAuthPhone(parsed.data.phone);
  const admin = createAdminClient();

  const { data: profile } = await admin
    .from("profiles")
    .select("id, birth_date")
    .eq("phone", phone)
    .maybeSingle();

  const genericError = "Telefone ou data de nascimento incorretos.";
  if (!profile || !profile.birth_date || profile.birth_date !== parsed.data.birthDate) {
    return { error: genericError };
  }

  const { error } = await admin.auth.admin.updateUserById(profile.id, {
    password: parsed.data.newPassword,
  });
  if (error) {
    return { error: "Não foi possível trocar a senha. Tente novamente." };
  }

  return { success: true };
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { loginSchema, registerSchema } from "@/lib/validations";
import { normalizeAuthPhone } from "@/lib/phone";
import { birthDateToISO } from "@/lib/birthdate";
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
  const { data: signInData, error } = await supabase.auth.signInWithPassword({
    phone: normalizeAuthPhone(parsed.data.phone),
    password: parsed.data.password,
  });
  if (error) {
    return { error: "Telefone ou data de nascimento incorretos" };
  }

  const next = formData.get("next");
  if (typeof next === "string" && next) {
    redirect(next);
  }

  if (signInData.user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", signInData.user.id)
      .single();
    if (profile?.role === "barber") {
      redirect("/barbeiro/dashboard");
    }
  }

  redirect("/");
}

export async function registerAction(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const parsed = registerSchema.safeParse({
    fullName: formData.get("fullName"),
    phone: formData.get("phone"),
    birthDate: formData.get("birthDate"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const birthDateISO = birthDateToISO(parsed.data.birthDate);
  if (!birthDateISO) {
    return { error: "Data de nascimento inválida" };
  }

  const phone = normalizeAuthPhone(parsed.data.phone);
  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("profiles")
    .select("id")
    .eq("phone", phone)
    .maybeSingle();
  if (existing) {
    return { error: "Esse número já está cadastrado. Faça login com sua data de nascimento." };
  }

  // A senha da conta é a própria data de nascimento (sem campo de senha no
  // cadastro) — o cliente entra depois com celular + data de nascimento.
  const { error: createError } = await admin.auth.admin.createUser({
    phone,
    password: parsed.data.birthDate,
    phone_confirm: true,
    user_metadata: { full_name: parsed.data.fullName, birth_date: birthDateISO },
  });
  if (createError) {
    return { error: "Não foi possível criar sua conta. Tente novamente." };
  }

  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    phone,
    password: parsed.data.birthDate,
  });
  if (signInError) {
    return { error: "Conta criada, mas não foi possível entrar automaticamente. Faça login." };
  }

  const next = formData.get("next");
  redirect(typeof next === "string" && next ? next : "/");
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

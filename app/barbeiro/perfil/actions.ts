"use server";

import { createClient } from "@/lib/supabase/server";
import { requireBarber } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export type FormState = { error?: string; success?: boolean } | undefined;

export async function updateBarberProfileAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const { user } = await requireBarber();
  const supabase = await createClient();

  const fullName = formData.get("fullName");
  if (typeof fullName !== "string" || fullName.trim().length < 2) {
    return { error: "Informe um nome válido" };
  }

  const { error } = await supabase.from("profiles").update({ full_name: fullName.trim() }).eq("id", user.id);
  if (error) return { error: "Não foi possível salvar" };

  revalidatePath("/barbeiro/perfil");
  return { success: true };
}

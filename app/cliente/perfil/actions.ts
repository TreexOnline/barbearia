"use server";

import { createClient } from "@/lib/supabase/server";
import { requireClient } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const profileSchema = z.object({
  fullName: z.string().min(2, "Informe seu nome completo"),
});

export type UpdateProfileState = { error?: string; success?: boolean } | undefined;

export async function updateProfileAction(
  _prevState: UpdateProfileState,
  formData: FormData
): Promise<UpdateProfileState> {
  const parsed = profileSchema.safeParse({
    fullName: formData.get("fullName"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const { user } = await requireClient();
  const supabase = await createClient();

  const { error } = await supabase
    .from("profiles")
    .update({ full_name: parsed.data.fullName })
    .eq("id", user.id);

  if (error) return { error: "Não foi possível salvar seu perfil" };

  revalidatePath("/cliente/perfil");
  return { success: true };
}

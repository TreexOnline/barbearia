"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth";
import { serviceFormSchema } from "@/lib/validations";
import { revalidatePath } from "next/cache";

export type FormState = { error?: string; success?: boolean } | undefined;

const PHOTO_BUCKET = "service-photos";

async function uploadPhotoIfProvided(formData: FormData): Promise<string | undefined> {
  const photo = formData.get("photo");
  if (!(photo instanceof File) || photo.size === 0) return undefined;

  const admin = createAdminClient();
  const ext = photo.name.split(".").pop() || "jpg";
  const path = `${crypto.randomUUID()}.${ext}`;

  const { error } = await admin.storage.from(PHOTO_BUCKET).upload(path, photo, {
    contentType: photo.type,
    upsert: true,
  });
  if (error) return undefined;

  const { data } = admin.storage.from(PHOTO_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function createServiceAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  await requireAdmin();
  const parsed = serviceFormSchema.safeParse({
    name: formData.get("name"),
    durationMinutes: formData.get("durationMinutes"),
    price: formData.get("price"),
    active: formData.get("active") === "on",
    includedItems: formData.get("includedItems") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };

  const imageUrl = await uploadPhotoIfProvided(formData);

  const supabase = await createClient();
  const { error } = await supabase.from("services").insert({
    name: parsed.data.name,
    duration_minutes: parsed.data.durationMinutes,
    price: parsed.data.price,
    active: parsed.data.active,
    included_items: parsed.data.includedItems ?? null,
    image_url: imageUrl ?? null,
  });
  if (error) return { error: "Não foi possível criar o serviço" };

  revalidatePath("/barbeiro/servicos");
  revalidatePath("/");
  return { success: true };
}

export async function updateServiceAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  await requireAdmin();
  const id = formData.get("id");
  if (typeof id !== "string" || !id) return { error: "Serviço inválido" };

  const parsed = serviceFormSchema.safeParse({
    name: formData.get("name"),
    durationMinutes: formData.get("durationMinutes"),
    price: formData.get("price"),
    active: formData.get("active") === "on",
    includedItems: formData.get("includedItems") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };

  const imageUrl = await uploadPhotoIfProvided(formData);

  const supabase = await createClient();
  const { error } = await supabase
    .from("services")
    .update({
      name: parsed.data.name,
      duration_minutes: parsed.data.durationMinutes,
      price: parsed.data.price,
      active: parsed.data.active,
      included_items: parsed.data.includedItems ?? null,
      ...(imageUrl ? { image_url: imageUrl } : {}),
    })
    .eq("id", id);
  if (error) return { error: "Não foi possível atualizar o serviço" };

  revalidatePath("/barbeiro/servicos");
  revalidatePath("/");
  return { success: true };
}

export async function deleteServiceAction(id: string) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("services").delete().eq("id", id);
  if (error) return { error: "Não foi possível remover o serviço (pode estar em uso)" };

  revalidatePath("/barbeiro/servicos");
  revalidatePath("/");
  return { success: true };
}

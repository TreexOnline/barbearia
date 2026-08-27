"use server";

import { createClient } from "@/lib/supabase/server";
import { requireBarber } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export type FormState = { error?: string; success?: boolean } | undefined;

const TIME_RE = /^\d{2}:\d{2}$/;

export async function saveWeeklyScheduleAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const { user } = await requireBarber();
  const supabase = await createClient();

  const rows: { barber_id: string; weekday: number; start_time: string; end_time: string }[] = [];

  for (let weekday = 0; weekday < 7; weekday++) {
    const enabled = formData.get(`enabled_${weekday}`);
    if (!enabled) continue;

    const start = formData.get(`start_${weekday}`);
    const end = formData.get(`end_${weekday}`);
    if (typeof start !== "string" || !TIME_RE.test(start) || typeof end !== "string" || !TIME_RE.test(end)) {
      return { error: "Informe o horário de início e fim para os dias que você atende" };
    }
    if (end <= start) {
      return { error: "O horário final precisa ser depois do inicial" };
    }
    rows.push({ barber_id: user.id, weekday, start_time: `${start}:00`, end_time: `${end}:00` });
  }

  await supabase.from("barber_schedules").delete().eq("barber_id", user.id);

  if (rows.length > 0) {
    const { error } = await supabase.from("barber_schedules").insert(rows);
    if (error) return { error: "Não foi possível salvar os horários" };
  }

  revalidatePath("/barbeiro/horarios");
  return { success: true };
}

export async function addTimeOffAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const { user } = await requireBarber();
  const supabase = await createClient();

  const date = formData.get("date");
  const startTime = formData.get("startTime");
  const endTime = formData.get("endTime");
  const reason = formData.get("reason");

  if (typeof date !== "string" || !date) {
    return { error: "Selecione uma data" };
  }

  const { error } = await supabase.from("barber_time_off").insert({
    barber_id: user.id,
    date,
    start_time: typeof startTime === "string" && startTime ? `${startTime}:00` : null,
    end_time: typeof endTime === "string" && endTime ? `${endTime}:00` : null,
    reason: typeof reason === "string" && reason ? reason : null,
  });

  if (error) return { error: "Não foi possível salvar a folga" };

  revalidatePath("/barbeiro/horarios");
  return { success: true };
}

export async function deleteTimeOffAction(id: string) {
  const { user } = await requireBarber();
  const supabase = await createClient();

  const { error } = await supabase
    .from("barber_time_off")
    .delete()
    .eq("id", id)
    .eq("barber_id", user.id);

  if (error) return { error: "Não foi possível remover a folga" };

  revalidatePath("/barbeiro/horarios");
  return { success: true };
}

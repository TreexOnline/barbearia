import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Database } from "@/lib/database.types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

/**
 * `getUser()` sempre revalida o token com o servidor de auth (é o motivo de
 * usarmos ele em vez de `getSession()`) — cada chamada é uma ida e volta de
 * rede real, não uma leitura local. Como o layout de /barbeiro e cada page
 * chamam requireBarber()/requireAdmin() por conta própria, sem cache isso
 * virava 2–3 idas e voltas de auth + 2–3 SELECTs em profiles por navegação,
 * em série. `cache()` do React deduplica pelo request: a 1ª chamada resolve
 * de verdade, as demais dentro do mesmo request reaproveitam o resultado.
 */
export const getCurrentUserAndProfile = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { user: null, profile: null };

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return { user, profile: profile as Profile | null };
});

export async function requireClient() {
  const { user, profile } = await getCurrentUserAndProfile();
  if (!user || !profile || profile.role !== "client") redirect("/login");
  return { user, profile };
}

export async function requireBarber() {
  const { user, profile } = await getCurrentUserAndProfile();
  if (!user || !profile || profile.role !== "barber") redirect("/login");
  return { user, profile };
}

export async function requireAdmin() {
  const { user, profile } = await requireBarber();
  if (!profile.is_admin) redirect("/barbeiro/dashboard");
  return { user, profile };
}

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Database } from "@/lib/database.types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export async function getCurrentUserAndProfile() {
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
}

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

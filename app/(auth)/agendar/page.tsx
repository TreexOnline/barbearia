import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AgendarForm } from "./agendar-form";

export default async function AgendarPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    redirect(profile?.role === "barber" ? "/barbeiro/dashboard" : "/?agendar=1");
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <AgendarForm />
    </div>
  );
}

import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { UsersTable } from "./users-table";

export default async function UsuariosPage() {
  await requireAdmin();
  const supabase = await createClient();

  const { data: users } = await supabase
    .from("profiles")
    .select("id, full_name, phone, role, created_at")
    .eq("role", "client")
    .order("created_at", { ascending: false });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Usuários</h1>
        <p className="text-muted-foreground">Todos os clientes cadastrados no site.</p>
      </div>

      <UsersTable users={users ?? []} />
    </div>
  );
}

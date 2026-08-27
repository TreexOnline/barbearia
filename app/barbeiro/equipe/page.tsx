import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { NewBarberDialog, EditBarberDialog } from "./barber-dialogs";

export default async function EquipePage() {
  await requireAdmin();
  const supabase = await createClient();

  const { data: barbers } = await supabase
    .from("profiles")
    .select("id, full_name, phone, is_admin, commission_percent")
    .eq("role", "barber")
    .order("full_name");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Equipe</h1>
          <p className="text-muted-foreground">Gerencie os barbeiros da equipe.</p>
        </div>
        <NewBarberDialog />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Telefone</TableHead>
            <TableHead>Comissão</TableHead>
            <TableHead>Admin</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(barbers ?? []).map((b) => (
            <TableRow key={b.id}>
              <TableCell className="font-medium">{b.full_name}</TableCell>
              <TableCell>{b.phone ?? "-"}</TableCell>
              <TableCell>{b.commission_percent ?? 0}%</TableCell>
              <TableCell>
                <Badge variant={b.is_admin ? "default" : "secondary"}>{b.is_admin ? "Sim" : "Não"}</Badge>
              </TableCell>
              <TableCell className="flex justify-end">
                <EditBarberDialog barber={b} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

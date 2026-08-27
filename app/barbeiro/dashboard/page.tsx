import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireBarber } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NewAppointmentDialog } from "../agendamentos/new-appointment-dialog";
import { format, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";

const STATUS_LABEL: Record<string, string> = {
  pending: "Pendente",
  confirmed: "Confirmado",
  completed: "Concluído",
  cancelled: "Cancelado",
};

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "outline",
  confirmed: "default",
  completed: "secondary",
  cancelled: "destructive",
};

const currency = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

export default async function DashboardPage() {
  const { user, profile } = await requireBarber();
  const supabase = await createClient();

  const today = new Date();

  let query = supabase
    .from("appointments")
    .select(
      "id, start_time, status, client:profiles!appointments_client_id_fkey(full_name), service:services(name, price), appointment_services(service_name, price)"
    )
    .gte("start_time", startOfDay(today).toISOString())
    .lte("start_time", endOfDay(today).toISOString())
    .order("start_time");
  if (!profile.is_admin) query = query.eq("barber_id", user.id);

  const [{ data: appointments }, { data: clients }, { data: services }] = await Promise.all([
    query,
    supabase.from("profiles").select("id, full_name, birth_date").eq("role", "client").order("full_name"),
    supabase.from("services").select("id, name, duration_minutes").eq("active", true).order("name"),
  ]);

  const rows = (appointments ?? []).map((a) => ({
    ...a,
    client: Array.isArray(a.client) ? a.client[0] : a.client,
    service: Array.isArray(a.service) ? a.service[0] : a.service,
  }));

  const serviceLabel = (a: (typeof rows)[number]) =>
    a.appointment_services?.length
      ? a.appointment_services.map((s) => s.service_name).join(" + ")
      : (a.service?.name ?? "Serviço");
  const servicePrice = (a: (typeof rows)[number]) =>
    a.appointment_services?.length
      ? a.appointment_services.reduce((sum, s) => sum + s.price, 0)
      : (a.service?.price ?? 0);

  const concluidos = rows.filter((a) => a.status === "completed");
  const cancelados = rows.filter((a) => a.status === "cancelled");
  const faturamento = concluidos.reduce((sum, a) => sum + servicePrice(a), 0);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-muted-foreground">Resumo geral da barbearia</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-muted-foreground">Agendamentos</p>
            <p className="mt-1 text-2xl font-semibold">{rows.length}</p>
            <p className="text-xs text-muted-foreground">Hoje</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-muted-foreground">Concluídos</p>
            <p className="mt-1 text-2xl font-semibold">{concluidos.length}</p>
            <p className="text-xs text-muted-foreground">Hoje</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-muted-foreground">Cancelados</p>
            <p className="mt-1 text-2xl font-semibold">{cancelados.length}</p>
            <p className="text-xs text-muted-foreground">Hoje</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-muted-foreground">Faturamento</p>
            <p className="mt-1 text-2xl font-semibold">{currency(faturamento)}</p>
            <p className="text-xs text-muted-foreground">Hoje</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="font-medium">Agendamentos de hoje</h2>
          <Link href="/barbeiro/agendamentos" className="text-sm text-primary underline-offset-4 hover:underline">
            Ver todos
          </Link>
        </div>

        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum agendamento hoje.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {rows.slice(0, 5).map((a) => (
              <Card key={a.id}>
                <CardContent className="flex items-center justify-between gap-3 py-3">
                  <div>
                    <p className="text-sm font-medium">
                      {format(new Date(a.start_time), "HH:mm", { locale: ptBR })} ·{" "}
                      {a.client?.full_name ?? "Cliente"}
                    </p>
                    <p className="text-xs text-muted-foreground">{serviceLabel(a)}</p>
                  </div>
                  <Badge variant={STATUS_VARIANT[a.status]}>{STATUS_LABEL[a.status]}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <NewAppointmentDialog clients={clients ?? []} services={services ?? []} triggerClassName="w-full" />
    </div>
  );
}

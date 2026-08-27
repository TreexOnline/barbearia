import { createClient } from "@/lib/supabase/server";
import { requireBarber } from "@/lib/auth";
import { AppointmentsList } from "./appointments-list";
import { NewAppointmentDialog } from "./new-appointment-dialog";

export default async function AgendamentosPage() {
  const { user, profile } = await requireBarber();
  const supabase = await createClient();

  let query = supabase
    .from("appointments")
    .select(
      "id, start_time, status, client_id, service_id, client:profiles!appointments_client_id_fkey(full_name, phone), service:services(name), barber:profiles!appointments_barber_id_fkey(full_name), appointment_services(service_name)"
    )
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
    barber: Array.isArray(a.barber) ? a.barber[0] : a.barber,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Agendamentos</h1>
          <p className="text-muted-foreground">Gerencie todos os agendamentos</p>
        </div>
        <NewAppointmentDialog clients={clients ?? []} services={services ?? []} />
      </div>

      <AppointmentsList
        appointments={rows}
        showBarber={profile.is_admin}
        clients={clients ?? []}
        services={services ?? []}
      />
    </div>
  );
}

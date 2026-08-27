"use client";

import { useMemo, useState } from "react";
import { format, isSameDay, isAfter, isBefore, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusActions } from "./status-actions";
import { EditAppointmentDialog } from "./edit-appointment-dialog";
import type { ClientOption } from "./client-search";
import type { AppointmentStatus } from "@/lib/database.types";

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

export interface AppointmentRow {
  id: string;
  start_time: string;
  status: string;
  client_id: string;
  service_id: string;
  client: { full_name: string; phone: string | null } | null;
  service: { name: string } | null;
  barber: { full_name: string } | null;
  appointment_services?: { service_name: string }[];
}

interface Service {
  id: string;
  name: string;
  duration_minutes: number;
}

export function AppointmentsList({
  appointments,
  showBarber,
  clients,
  services,
}: {
  appointments: AppointmentRow[];
  showBarber: boolean;
  clients: ClientOption[];
  services: Service[];
}) {
  const [tab, setTab] = useState("hoje");
  const now = useMemo(() => new Date(), []);

  const groups = useMemo(() => {
    const todos = [...appointments].sort((a, b) => a.start_time.localeCompare(b.start_time));
    const hoje = todos.filter((a) => isSameDay(new Date(a.start_time), now));
    const proximos = todos.filter((a) => isAfter(new Date(a.start_time), endOfDay(now)));
    const passados = todos
      .filter((a) => isBefore(new Date(a.start_time), startOfDay(now)))
      .sort((a, b) => b.start_time.localeCompare(a.start_time));
    return { todos, hoje, proximos, passados };
  }, [appointments, now]);

  return (
    <Tabs value={tab} onValueChange={(v) => setTab(v ?? "hoje")}>
      <TabsList className="w-full">
        <TabsTrigger value="todos">Todos</TabsTrigger>
        <TabsTrigger value="hoje">Hoje</TabsTrigger>
        <TabsTrigger value="proximos">Próximos</TabsTrigger>
        <TabsTrigger value="passados">Passados</TabsTrigger>
      </TabsList>

      {(["todos", "hoje", "proximos", "passados"] as const).map((key) => (
        <TabsContent key={key} value={key} className="mt-4">
          <AppointmentGroup rows={groups[key]} showBarber={showBarber} clients={clients} services={services} />
        </TabsContent>
      ))}
    </Tabs>
  );
}

function AppointmentGroup({
  rows,
  showBarber,
  clients,
  services,
}: {
  rows: AppointmentRow[];
  showBarber: boolean;
  clients: ClientOption[];
  services: Service[];
}) {
  if (rows.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">Nenhum agendamento aqui.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {rows.map((a) => (
        <Card key={a.id}>
          <CardContent className="flex flex-col gap-3 py-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium">
                  {format(new Date(a.start_time), "dd/MM · HH:mm", { locale: ptBR })} ·{" "}
                  {a.appointment_services?.length
                    ? a.appointment_services.map((s) => s.service_name).join(" + ")
                    : (a.service?.name ?? "Serviço")}
                </p>
                <p className="text-sm text-muted-foreground">
                  {a.client?.full_name ?? "Cliente"}
                  {a.client?.phone ? ` · ${a.client.phone}` : ""}
                  {showBarber && a.barber ? ` · ${a.barber.full_name}` : ""}
                </p>
              </div>
              <Badge variant={STATUS_VARIANT[a.status]}>{STATUS_LABEL[a.status]}</Badge>
            </div>
            <div className="flex gap-2">
              <StatusActions appointmentId={a.id} status={a.status as AppointmentStatus} />
              <EditAppointmentDialog
                appointmentId={a.id}
                clientId={a.client_id}
                serviceId={a.service_id}
                startTime={a.start_time}
                clients={clients}
                services={services}
              />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

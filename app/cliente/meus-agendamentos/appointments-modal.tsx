"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CancelButton } from "./cancel-button";
import { RescheduleInline } from "./reschedule-inline";

export interface AppointmentRow {
  id: string;
  start_time: string;
  status: string;
  service: { id: string; name: string; price: number } | null;
  barber: { id: string; full_name: string } | null;
  appointment_services?: { service_id: string; service_name: string }[];
}

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

export function AppointmentsModal({
  open,
  onOpenChange,
  appointments,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointments: AppointmentRow[];
}) {
  const [reschedulingId, setReschedulingId] = useState<string | null>(null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Meus agendamentos</DialogTitle>
        </DialogHeader>
        <div className="flex max-h-[70vh] flex-col gap-3 overflow-y-auto">
          {appointments.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Você ainda não tem agendamentos.
            </p>
          ) : (
            appointments.map((a) => {
              const canManage =
                (a.status === "confirmed" || a.status === "pending") &&
                new Date(a.start_time) > new Date();
              const isRescheduling = reschedulingId === a.id;
              const serviceLabel = a.appointment_services?.length
                ? a.appointment_services.map((s) => s.service_name).join(" + ")
                : (a.service?.name ?? "Serviço");
              const serviceIds = a.appointment_services?.length
                ? a.appointment_services.map((s) => s.service_id)
                : a.service
                  ? [a.service.id]
                  : [];
              return (
                <div key={a.id} className="rounded-xl border p-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">{serviceLabel}</p>
                      <p className="text-sm text-muted-foreground">
                        com {a.barber?.full_name ?? "barbeiro"} ·{" "}
                        {format(new Date(a.start_time), "EEEE, dd/MM 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                    <Badge variant={STATUS_VARIANT[a.status]}>{STATUS_LABEL[a.status]}</Badge>
                  </div>

                  {canManage && !isRescheduling && (
                    <div className="mt-3 flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setReschedulingId(a.id)}
                      >
                        Trocar horário
                      </Button>
                      <CancelButton appointmentId={a.id} />
                    </div>
                  )}

                  {canManage && isRescheduling && serviceIds.length > 0 && a.barber && (
                    <div className="mt-3">
                      <RescheduleInline
                        appointmentId={a.id}
                        barberId={a.barber.id}
                        serviceIds={serviceIds}
                        onDone={() => setReschedulingId(null)}
                      />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

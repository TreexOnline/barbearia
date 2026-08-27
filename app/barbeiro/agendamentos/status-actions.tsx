"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { updateAppointmentStatusAction } from "./actions";
import type { AppointmentStatus } from "@/lib/database.types";

export function StatusActions({ appointmentId, status }: { appointmentId: string; status: AppointmentStatus }) {
  const [pending, startTransition] = useTransition();

  function run(next: AppointmentStatus, confirmMessage?: string) {
    if (confirmMessage && !confirm(confirmMessage)) return;
    startTransition(async () => {
      const result = await updateAppointmentStatusAction(appointmentId, next);
      if (result.error) toast.error(result.error);
      else toast.success("Agendamento atualizado");
    });
  }

  if (status !== "confirmed" && status !== "pending") return null;

  return (
    <div className="flex gap-2">
      <Button type="button" size="sm" disabled={pending} onClick={() => run("completed")}>
        Concluir
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={pending}
        onClick={() => run("cancelled", "Cancelar este agendamento?")}
      >
        Cancelar
      </Button>
    </div>
  );
}

"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cancelAppointmentAction } from "./actions";

export function CancelButton({ appointmentId }: { appointmentId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={() => {
        if (!confirm("Cancelar este agendamento?")) return;
        startTransition(async () => {
          const result = await cancelAppointmentAction(appointmentId);
          if (result.error) toast.error(result.error);
          else toast.success("Agendamento cancelado");
        });
      }}
    >
      {pending ? "Cancelando..." : "Cancelar"}
    </Button>
  );
}

"use client";

import { useEffect, useState, useTransition } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { getAvailableSlotsAction, rescheduleAppointmentAction } from "@/app/cliente/nova-reserva/actions";

export function RescheduleInline({
  appointmentId,
  barberId,
  serviceIds,
  onDone,
}: {
  appointmentId: string;
  barberId: string;
  serviceIds: string[];
  onDone: () => void;
}) {
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [slots, setSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string>("");
  const [loadingSlots, startLoadingSlots] = useTransition();
  const [saving, startSaving] = useTransition();
  const serviceIdsKey = serviceIds.join(",");

  useEffect(() => {
    startLoadingSlots(async () => {
      setSelectedSlot("");
      setSlots([]);
      if (!date) return;
      const dateISO = format(date, "yyyy-MM-dd");
      const result = await getAvailableSlotsAction({
        barberId,
        serviceIds,
        dateISO,
        excludeAppointmentId: appointmentId,
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setSlots(result.slots);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, barberId, serviceIdsKey, appointmentId]);

  function confirm() {
    startSaving(async () => {
      const result = await rescheduleAppointmentAction(appointmentId, selectedSlot);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Horário atualizado!");
      onDone();
    });
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-muted/30 p-3">
      <Popover>
        <PopoverTrigger
          render={
            <Button
              variant="outline"
              size="sm"
              className={cn("w-full justify-start sm:w-56", !date && "text-muted-foreground")}
            />
          }
        >
          <CalendarIcon className="mr-2 size-4" />
          {date ? format(date, "EEEE, dd 'de' MMMM", { locale: ptBR }) : "Escolha uma nova data"}
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar mode="single" selected={date} onSelect={setDate} disabled={{ before: new Date() }} locale={ptBR} />
        </PopoverContent>
      </Popover>

      {date && (
        <>
          {loadingSlots ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Carregando horários...
            </p>
          ) : slots.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum horário disponível nesse dia.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {slots.map((slot) => (
                <Button
                  key={slot}
                  type="button"
                  size="sm"
                  variant={selectedSlot === slot ? "default" : "outline"}
                  onClick={() => setSelectedSlot(slot)}
                >
                  {format(new Date(slot), "HH:mm")}
                </Button>
              ))}
            </div>
          )}
        </>
      )}

      <div className="flex gap-2">
        <Button type="button" size="sm" disabled={!selectedSlot || saving} onClick={confirm}>
          {saving ? "Salvando..." : "Confirmar novo horário"}
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={onDone}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}

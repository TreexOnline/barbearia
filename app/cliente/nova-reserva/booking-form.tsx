"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useActionState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, Loader2, UserRound } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { createAppointmentAction, getAvailableSlotsAction } from "./actions";
import { ServiceListStep, type ServiceOption } from "./service-picker";

interface Barber {
  id: string;
  full_name: string;
}

type Step = "service" | "barber" | "datetime";

export function BookingForm({
  services,
  barbers,
  onSuccess,
}: {
  services: ServiceOption[];
  barbers: Barber[];
  onSuccess?: () => void;
}) {
  const hasSingleBarber = barbers.length === 1;

  const [step, setStep] = useState<Step>("service");
  const [serviceIds, setServiceIds] = useState<string[]>([]);
  const [barberId, setBarberId] = useState(() => (hasSingleBarber ? barbers[0].id : ""));
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [slots, setSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [loadingSlots, startLoadingSlots] = useTransition();
  const [state, formAction, pending] = useActionState(createAppointmentAction, undefined);

  useEffect(() => {
    startLoadingSlots(async () => {
      setSelectedSlot("");
      setSlots([]);
      if (serviceIds.length === 0 || !barberId || !date) return;
      const dateISO = format(date, "yyyy-MM-dd");
      const result = await getAvailableSlotsAction({ barberId, serviceIds, dateISO });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setSlots(result.slots);
    });
  }, [serviceIds, barberId, date]);

  useEffect(() => {
    if (state?.error) toast.error(state.error);
    if (state?.success) {
      toast.success("Agendamento confirmado!");
      onSuccess?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const selectedServices = useMemo(
    () => services.filter((s) => serviceIds.includes(s.id)),
    [services, serviceIds]
  );

  function toggleService(id: string) {
    setServiceIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function continueFromServices() {
    setStep(hasSingleBarber ? "datetime" : "barber");
  }

  function selectBarber(id: string) {
    setBarberId(id);
    setStep("datetime");
  }

  function goBack() {
    if (step === "datetime") setStep(hasSingleBarber ? "service" : "barber");
    else if (step === "barber") setStep("service");
  }

  return (
    <div className="flex flex-col gap-4">
      {step !== "service" && (
        <button
          type="button"
          onClick={goBack}
          className="flex w-fit items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="size-4" /> Voltar
        </button>
      )}

      {selectedServices.length > 0 && step !== "service" && (
        <p className="text-sm text-muted-foreground">
          Serviço:{" "}
          <span className="font-medium text-foreground">
            {selectedServices.map((s) => s.name).join(" + ")}
          </span>
        </p>
      )}

      {step === "service" && (
        <ServiceListStep
          services={services}
          selectedIds={serviceIds}
          onToggle={toggleService}
          onContinue={continueFromServices}
        />
      )}

      {step === "barber" && (
        <div className="flex flex-col gap-2">
          {barbers.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => selectBarber(b.id)}
              className={cn(
                "flex items-center gap-3 rounded-xl border p-3 text-left transition-colors hover:bg-muted",
                b.id === barberId && "border-primary bg-muted"
              )}
            >
              <span className="flex size-10 items-center justify-center rounded-full bg-muted">
                <UserRound className="size-5 text-muted-foreground" />
              </span>
              <span className="font-medium">{b.full_name}</span>
            </button>
          ))}
        </div>
      )}

      {step === "datetime" && (
        <div className="flex flex-col gap-4">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            disabled={{ before: new Date() }}
            locale={ptBR}
            className="w-full"
            classNames={{
              root: "w-full",
              months: "w-full",
              month: "w-full",
              month_grid: "w-full border-collapse",
              weekdays: "flex w-full",
              weekday: "flex-1 text-center text-sm",
              week: "mt-1 flex w-full",
              day: "group/day relative flex-1 aspect-square h-full w-full rounded-(--cell-radius) p-0 text-center select-none",
            }}
            style={{ "--cell-size": "3rem" } as React.CSSProperties}
          />

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Horário</label>
            {loadingSlots ? (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" /> Carregando horários...
              </p>
            ) : slots.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum horário disponível nesse dia.</p>
            ) : (
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
                {slots.map((slot) => (
                  <Button
                    key={slot}
                    type="button"
                    variant={selectedSlot === slot ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedSlot(slot)}
                  >
                    {format(new Date(slot), "HH:mm")}
                  </Button>
                ))}
              </div>
            )}
          </div>

          <form action={formAction} className="flex flex-col gap-2">
            {serviceIds.map((id) => (
              <input key={id} type="hidden" name="serviceIds" value={id} />
            ))}
            <input type="hidden" name="barberId" value={barberId} />
            <input type="hidden" name="startTime" value={selectedSlot} />
            <Button type="submit" disabled={!selectedSlot || pending} className="mt-2">
              {pending ? "Confirmando..." : "Confirmar reserva"}
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}

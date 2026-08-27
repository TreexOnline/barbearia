"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateAppointmentAction } from "./actions";
import { ClientFields } from "./client-fields";
import type { ClientOption } from "./client-search";
import { Pencil } from "lucide-react";

interface Service {
  id: string;
  name: string;
  duration_minutes: number;
}

export function EditAppointmentDialog({
  appointmentId,
  clientId: initialClientId,
  serviceId: initialServiceId,
  startTime,
  clients,
  services,
}: {
  appointmentId: string;
  clientId: string;
  serviceId: string;
  startTime: string;
  clients: ClientOption[];
  services: Service[];
}) {
  const [open, setOpen] = useState(false);
  const [clientMode, setClientMode] = useState<"existing" | "guest">("existing");
  const [clientId, setClientId] = useState(initialClientId);
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [serviceId, setServiceId] = useState(initialServiceId);
  const [pending, startTransition] = useTransition();

  const start = new Date(startTime);
  const dateDefault = format(start, "yyyy-MM-dd");
  const timeDefault = format(start, "HH:mm");

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await updateAppointmentAction(undefined, formData);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Agendamento atualizado");
      setOpen(false);
    });
  }

  const canSubmit =
    Boolean(serviceId) && (clientMode === "existing" ? Boolean(clientId) : guestName.trim().length >= 2);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button type="button" variant="outline" size="sm" />}>
        <Pencil className="size-4" /> Editar
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar agendamento</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="flex flex-col gap-4">
          <input type="hidden" name="appointmentId" value={appointmentId} />
          <input type="hidden" name="clientMode" value={clientMode} />
          <input type="hidden" name="clientId" value={clientMode === "existing" ? clientId : ""} />
          <input type="hidden" name="guestName" value={clientMode === "guest" ? guestName : ""} />
          <input type="hidden" name="guestPhone" value={clientMode === "guest" ? guestPhone : ""} />
          <input type="hidden" name="serviceId" value={serviceId} />

          <ClientFields
            clients={clients}
            mode={clientMode}
            onModeChange={setClientMode}
            clientId={clientId}
            onClientIdChange={setClientId}
            guestName={guestName}
            onGuestNameChange={setGuestName}
            guestPhone={guestPhone}
            onGuestPhoneChange={setGuestPhone}
          />

          <div className="flex flex-col gap-2">
            <Label>Serviço</Label>
            <Select value={serviceId} onValueChange={(v) => setServiceId(v ?? "")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione o serviço">
                  {(value: string | null) => services.find((s) => s.id === value)?.name ?? "Selecione o serviço"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {services.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name} · {s.duration_minutes} min
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor={`date-${appointmentId}`}>Data</Label>
              <Input id={`date-${appointmentId}`} name="date" type="date" defaultValue={dateDefault} required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor={`time-${appointmentId}`}>Horário</Label>
              <Input id={`time-${appointmentId}`} name="time" type="time" defaultValue={timeDefault} required />
            </div>
          </div>

          <Button type="submit" disabled={pending || !canSubmit} className="mt-2 self-start">
            {pending ? "Salvando..." : "Salvar alterações"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

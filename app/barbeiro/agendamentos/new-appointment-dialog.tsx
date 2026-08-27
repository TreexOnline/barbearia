"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
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
import { createAppointmentForClientAction } from "./actions";
import { ClientFields } from "./client-fields";
import type { ClientOption } from "./client-search";
import { MultiServicePicker } from "./multi-service-picker";
import { Plus } from "lucide-react";

interface Service {
  id: string;
  name: string;
  duration_minutes: number;
}

function nowDefaults() {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    date: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`,
    time: `${pad(now.getHours())}:${pad(now.getMinutes())}`,
  };
}

export function NewAppointmentDialog({
  clients,
  services,
  triggerClassName,
}: {
  clients: ClientOption[];
  services: Service[];
  triggerClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [clientMode, setClientMode] = useState<"existing" | "guest">("existing");
  const [clientId, setClientId] = useState("");
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [serviceIds, setServiceIds] = useState<string[]>([]);
  const [defaults, setDefaults] = useState(nowDefaults());
  const [pending, startTransition] = useTransition();

  function reset() {
    setClientMode("existing");
    setClientId("");
    setGuestName("");
    setGuestPhone("");
    setServiceIds([]);
  }

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await createAppointmentForClientAction(undefined, formData);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Agendamento criado");
      setOpen(false);
      reset();
    });
  }

  const canSubmit =
    serviceIds.length > 0 && (clientMode === "existing" ? Boolean(clientId) : guestName.trim().length >= 2);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setDefaults(nowDefaults());
      }}
    >
      <DialogTrigger render={<Button size="sm" className={triggerClassName} />}>
        <Plus className="size-4" /> Novo agendamento
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo agendamento</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="flex flex-col gap-4">
          <input type="hidden" name="clientMode" value={clientMode} />
          <input type="hidden" name="clientId" value={clientMode === "existing" ? clientId : ""} />
          <input type="hidden" name="guestName" value={clientMode === "guest" ? guestName : ""} />
          <input type="hidden" name="guestPhone" value={clientMode === "guest" ? guestPhone : ""} />
          {serviceIds.map((id) => (
            <input key={id} type="hidden" name="serviceIds" value={id} />
          ))}

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

          <MultiServicePicker services={services} selectedIds={serviceIds} onChange={setServiceIds} />

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="date">Data</Label>
              <Input id="date" name="date" type="date" defaultValue={defaults.date} key={`d-${defaults.date}`} required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="time">Horário</Label>
              <Input id="time" name="time" type="time" defaultValue={defaults.time} key={`t-${defaults.time}`} required />
            </div>
          </div>

          <Button type="submit" disabled={pending || !canSubmit} className="mt-2 self-start">
            {pending ? "Criando..." : "Criar agendamento"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

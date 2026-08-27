"use client";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ClientSearch, type ClientOption } from "./client-search";

export function ClientFields({
  clients,
  mode,
  onModeChange,
  clientId,
  onClientIdChange,
  guestName,
  onGuestNameChange,
  guestPhone,
  onGuestPhoneChange,
}: {
  clients: ClientOption[];
  mode: "existing" | "guest";
  onModeChange: (mode: "existing" | "guest") => void;
  clientId: string;
  onClientIdChange: (id: string) => void;
  guestName: string;
  onGuestNameChange: (v: string) => void;
  guestPhone: string;
  onGuestPhoneChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onModeChange("existing")}
          className={cn(
            "flex-1 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors",
            mode === "existing"
              ? "border-primary bg-primary text-primary-foreground dark:bg-gradient-to-b dark:from-[#dfb96f] dark:to-[#b9863c] dark:text-[#241a0a]"
              : "border-border text-muted-foreground hover:text-foreground"
          )}
        >
          Cliente cadastrado
        </button>
        <button
          type="button"
          onClick={() => onModeChange("guest")}
          className={cn(
            "flex-1 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors",
            mode === "guest"
              ? "border-primary bg-primary text-primary-foreground dark:bg-gradient-to-b dark:from-[#dfb96f] dark:to-[#b9863c] dark:text-[#241a0a]"
              : "border-border text-muted-foreground hover:text-foreground"
          )}
        >
          Cliente avulso
        </button>
      </div>

      {mode === "existing" ? (
        <div className="flex flex-col gap-2">
          <Label>Cliente</Label>
          <ClientSearch clients={clients} value={clientId} onChange={onClientIdChange} />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="guestName">Nome</Label>
            <Input
              id="guestName"
              value={guestName}
              onChange={(e) => onGuestNameChange(e.target.value)}
              placeholder="Nome do cliente"
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="guestPhone">Celular (opcional)</Label>
            <Input
              id="guestPhone"
              value={guestPhone}
              onChange={(e) => onGuestPhoneChange(e.target.value)}
              placeholder="(11) 99999-9999"
            />
          </div>
        </div>
      )}
    </div>
  );
}

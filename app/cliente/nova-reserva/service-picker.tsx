"use client";

import { Check, Scissors } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface ServiceOption {
  id: string;
  name: string;
  duration_minutes: number;
  price: number;
  image_url: string | null;
  included_items: string | null;
}

const currency = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

export function ServiceListStep({
  services,
  selectedIds,
  onToggle,
  onContinue,
}: {
  services: ServiceOption[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  onContinue: () => void;
}) {
  const selected = selectedIds.map((id) => services.find((s) => s.id === id)).filter(Boolean) as ServiceOption[];
  const totalMinutes = selected.reduce((sum, s) => sum + s.duration_minutes, 0);
  const totalPrice = selected.reduce((sum, s) => sum + s.price, 0);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex max-h-[55vh] flex-col gap-2 overflow-y-auto">
        {services.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Nenhum serviço disponível no momento.
          </p>
        )}
        {services.map((service) => {
          const isSelected = selectedIds.includes(service.id);
          return (
            <button
              key={service.id}
              type="button"
              onClick={() => onToggle(service.id)}
              className={cn(
                "flex gap-4 rounded-xl border p-3 text-left transition-colors hover:bg-muted",
                isSelected && "border-primary bg-muted"
              )}
            >
              {service.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={service.image_url} alt="" className="size-20 shrink-0 rounded-lg object-cover" />
              ) : (
                <span className="flex size-20 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <Scissors className="size-6 text-muted-foreground" />
                </span>
              )}
              <div className="flex flex-1 flex-col">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium">{service.name}</p>
                  <p className="shrink-0 font-semibold">{currency(service.price)}</p>
                </div>
                <p className="text-sm text-muted-foreground">{service.duration_minutes} min</p>
                {service.included_items && (
                  <p className="mt-1 text-xs text-muted-foreground">{service.included_items}</p>
                )}
              </div>
              <span
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center self-center rounded-full border",
                  isSelected ? "border-primary bg-primary text-primary-foreground" : "border-input"
                )}
              >
                {isSelected && <Check className="size-3.5" />}
              </span>
            </button>
          );
        })}
      </div>

      {selected.length > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {selected.length} serviço{selected.length > 1 ? "s" : ""} · {totalMinutes} min
          </span>
          <span className="font-semibold text-foreground">{currency(totalPrice)}</span>
        </div>
      )}

      <Button type="button" disabled={selected.length === 0} onClick={onContinue}>
        Continuar
      </Button>
    </div>
  );
}

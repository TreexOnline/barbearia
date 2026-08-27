"use client";

import { X } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Service {
  id: string;
  name: string;
  duration_minutes: number;
}

export function MultiServicePicker({
  services,
  selectedIds,
  onChange,
}: {
  services: Service[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}) {
  const available = services.filter((s) => !selectedIds.includes(s.id));
  const selected = selectedIds.map((id) => services.find((s) => s.id === id)).filter(Boolean) as Service[];
  const totalMinutes = selected.reduce((sum, s) => sum + s.duration_minutes, 0);

  return (
    <div className="flex flex-col gap-2">
      <Label>Serviços</Label>

      {selected.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {selected.map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between rounded-md border border-border bg-muted/40 px-3 py-1.5 text-sm"
            >
              <span>
                {s.name} · {s.duration_minutes} min
              </span>
              <button
                type="button"
                onClick={() => onChange(selectedIds.filter((id) => id !== s.id))}
                className="text-muted-foreground hover:text-destructive"
                aria-label={`Remover ${s.name}`}
              >
                <X className="size-4" />
              </button>
            </div>
          ))}
          <p className="text-xs text-muted-foreground">Duração total: {totalMinutes} min</p>
        </div>
      )}

      {available.length > 0 && (
        <Select value="" onValueChange={(v) => v && onChange([...selectedIds, v])}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder={selected.length > 0 ? "Adicionar outro serviço" : "Selecione o serviço"} />
          </SelectTrigger>
          <SelectContent>
            {available.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name} · {s.duration_minutes} min
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}

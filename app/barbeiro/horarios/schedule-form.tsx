"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { saveWeeklyScheduleAction } from "./actions";

const WEEKDAYS = [
  { value: 1, label: "Segunda-feira" },
  { value: 2, label: "Terça-feira" },
  { value: 3, label: "Quarta-feira" },
  { value: 4, label: "Quinta-feira" },
  { value: 5, label: "Sexta-feira" },
  { value: 6, label: "Sábado" },
  { value: 0, label: "Domingo" },
];

interface Schedule {
  weekday: number;
  start_time: string;
  end_time: string;
}

export function ScheduleForm({ schedules }: { schedules: Schedule[] }) {
  const [state, formAction, pending] = useActionState(saveWeeklyScheduleAction, undefined);
  const byWeekday = new Map(schedules.map((s) => [s.weekday, s]));

  const [enabled, setEnabled] = useState<Record<number, boolean>>(() =>
    Object.fromEntries(WEEKDAYS.map((d) => [d.value, byWeekday.has(d.value)]))
  );

  useEffect(() => {
    if (state?.error) toast.error(state.error);
    if (state?.success) toast.success("Horários salvos");
  }, [state]);

  return (
    <form action={formAction} className="flex flex-col gap-1">
      {WEEKDAYS.map((d) => {
        const existing = byWeekday.get(d.value);
        const isEnabled = enabled[d.value];
        return (
          <div
            key={d.value}
            className="flex flex-wrap items-center gap-3 border-b border-border py-3 last:border-b-0"
          >
            <label className="flex flex-1 min-w-32 items-center gap-3">
              <Checkbox
                name={`enabled_${d.value}`}
                checked={isEnabled}
                onCheckedChange={(checked) =>
                  setEnabled((prev) => ({ ...prev, [d.value]: checked === true }))
                }
              />
              <span className="font-medium">{d.label}</span>
            </label>

            {isEnabled ? (
              <div className="flex items-center gap-2">
                <Input
                  type="time"
                  name={`start_${d.value}`}
                  defaultValue={existing?.start_time.slice(0, 5) ?? "09:00"}
                  className="w-28"
                />
                <span className="text-sm text-muted-foreground">até</span>
                <Input
                  type="time"
                  name={`end_${d.value}`}
                  defaultValue={existing?.end_time.slice(0, 5) ?? "18:00"}
                  className="w-28"
                />
              </div>
            ) : (
              <span className="text-sm text-muted-foreground">Não atende</span>
            )}
          </div>
        );
      })}

      <Button type="submit" disabled={pending} className="mt-4">
        {pending ? "Salvando..." : "Salvar horários"}
      </Button>
    </form>
  );
}

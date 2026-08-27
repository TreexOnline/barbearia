"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { addTimeOffAction, deleteTimeOffAction } from "./actions";
import { CalendarOff, CalendarClock, Trash2 } from "lucide-react";

interface TimeOff {
  id: string;
  date: string;
  start_time: string | null;
  end_time: string | null;
  reason: string | null;
}

export function SpecialDaySection({ timeOff }: { timeOff: TimeOff[] }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"close" | "custom">("close");
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await addTimeOffAction(undefined, formData);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Alteração salva");
      setOpen(false);
      setMode("close");
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger
          render={
            <Button className="w-full py-6 text-sm tracking-wide uppercase" />
          }
        >
          <CalendarClock className="size-5" />
          Alterar ou fechar a agenda de um dia
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar ou fechar a agenda de um dia</DialogTitle>
          </DialogHeader>
          <form action={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="date">Qual dia?</Label>
              <Input id="date" name="date" type="date" required />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setMode("close")}
                className={cn(
                  "flex flex-1 flex-col items-center gap-1 rounded-lg border px-3 py-3 text-sm font-medium transition-colors",
                  mode === "close"
                    ? "border-primary bg-primary text-primary-foreground dark:bg-gradient-to-b dark:from-[#dfb96f] dark:to-[#b9863c] dark:text-[#241a0a]"
                    : "border-border text-muted-foreground hover:text-foreground"
                )}
              >
                <CalendarOff className="size-5" />
                Fechar o dia
              </button>
              <button
                type="button"
                onClick={() => setMode("custom")}
                className={cn(
                  "flex flex-1 flex-col items-center gap-1 rounded-lg border px-3 py-3 text-sm font-medium transition-colors",
                  mode === "custom"
                    ? "border-primary bg-primary text-primary-foreground dark:bg-gradient-to-b dark:from-[#dfb96f] dark:to-[#b9863c] dark:text-[#241a0a]"
                    : "border-border text-muted-foreground hover:text-foreground"
                )}
              >
                <CalendarClock className="size-5" />
                Mudar horário
              </button>
            </div>

            {mode === "custom" && (
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="startTime">Início</Label>
                  <Input id="startTime" name="startTime" type="time" required />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="endTime">Fim</Label>
                  <Input id="endTime" name="endTime" type="time" required />
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <Label htmlFor="reason">Motivo (opcional)</Label>
              <Input id="reason" name="reason" placeholder="Ex: feriado, evento, compromisso" />
            </div>

            <p className="text-xs text-muted-foreground">
              Isso só muda esse dia — sua agenda normal continua igual nas próximas semanas.
            </p>

            <Button type="submit" disabled={pending} className="mt-2">
              {pending ? "Salvando..." : mode === "close" ? "Fechar esse dia" : "Salvar novo horário"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {timeOff.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">Próximas alterações</p>
          {timeOff.map((t) => (
            <Card key={t.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="text-sm">
                  <span className="font-medium">
                    {format(new Date(`${t.date}T00:00:00`), "dd/MM/yyyy", { locale: ptBR })}
                  </span>{" "}
                  {t.start_time && t.end_time ? (
                    <span className="text-muted-foreground">
                      {t.start_time.slice(0, 5)} às {t.end_time.slice(0, 5)}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">dia fechado</span>
                  )}
                  {t.reason && <span className="text-muted-foreground"> · {t.reason}</span>}
                </div>
                <DeleteTimeOffButton id={t.id} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function DeleteTimeOffButton({ id }: { id: string }) {
  const [pending, setPending] = useState(false);
  return (
    <Button
      type="button"
      size="icon-sm"
      variant="outline"
      disabled={pending}
      onClick={async () => {
        setPending(true);
        const result = await deleteTimeOffAction(id);
        if (result?.error) toast.error(result.error);
        setPending(false);
      }}
      aria-label="Remover"
    >
      <Trash2 className="size-4" />
    </Button>
  );
}

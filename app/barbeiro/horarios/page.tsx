import { createClient } from "@/lib/supabase/server";
import { requireBarber } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { ScheduleForm } from "./schedule-form";
import { SpecialDaySection } from "./special-day-dialog";
import { Clock, CalendarClock } from "lucide-react";

export default async function HorariosPage() {
  const { user } = await requireBarber();
  const supabase = await createClient();

  const [{ data: schedules }, { data: timeOff }] = await Promise.all([
    supabase
      .from("barber_schedules")
      .select("weekday, start_time, end_time")
      .eq("barber_id", user.id),
    supabase
      .from("barber_time_off")
      .select("id, date, start_time, end_time, reason")
      .eq("barber_id", user.id)
      .gte("date", new Date().toISOString().slice(0, 10))
      .order("date"),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Horários</h1>
        <p className="text-muted-foreground">Gerencie os horários de atendimento</p>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-4 pt-2">
          <div className="flex items-start gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full border border-primary/40 bg-primary/10">
              <Clock className="size-4 text-primary" />
            </div>
            <div>
              <p className="font-medium">Qual horário você atende normalmente?</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Defina os dias e horários em que você costuma atender. Esses horários serão usados
                automaticamente na sua agenda.
              </p>
            </div>
          </div>

          <ScheduleForm schedules={schedules ?? []} />
        </CardContent>
      </Card>

      <Card className="border-primary/30">
        <CardContent className="flex flex-col gap-4 pt-2">
          <div className="flex items-start gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full border border-primary/40 bg-primary/10">
              <CalendarClock className="size-4 text-primary" />
            </div>
            <div>
              <p className="font-medium">Não deixe seus clientes na mão!</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Essa é sua agenda normal, que se repete toda semana. Se em algum dia você não puder
                atender ou precisar alterar seu horário, feche sua agenda ou ajuste apenas aquele dia — a
                mudança não afeta sua programação normal.
              </p>
            </div>
          </div>

          <SpecialDaySection timeOff={timeOff ?? []} />
        </CardContent>
      </Card>
    </div>
  );
}

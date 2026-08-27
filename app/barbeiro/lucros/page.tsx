import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RevenueTrendChart, ServiceDonutChart } from "./charts";
import { differenceInCalendarDays, eachDayOfInterval, endOfMonth, format, startOfMonth, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";

const currency = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

export default async function LucrosPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  await requireAdmin();
  const { from: fromParam, to: toParam } = await searchParams;

  const from = fromParam || format(startOfMonth(new Date()), "yyyy-MM-dd");
  const to = toParam || format(endOfMonth(new Date()), "yyyy-MM-dd");

  const periodDays = differenceInCalendarDays(new Date(`${to}T00:00:00`), new Date(`${from}T00:00:00`)) + 1;
  const prevTo = format(subDays(new Date(`${from}T00:00:00`), 1), "yyyy-MM-dd");
  const prevFrom = format(subDays(new Date(`${from}T00:00:00`), periodDays), "yyyy-MM-dd");

  const supabase = await createClient();

  const [{ data: appointments }, { data: prevAppointments }] = await Promise.all([
    supabase
      .from("appointments")
      .select(
        "id, start_time, status, client:profiles!appointments_client_id_fkey(full_name), service:services(name, price), barber:profiles!appointments_barber_id_fkey(full_name, commission_percent), appointment_services(service_name, price)"
      )
      .in("status", ["completed", "cancelled"])
      .gte("start_time", `${from}T00:00:00`)
      .lte("start_time", `${to}T23:59:59`),
    supabase
      .from("appointments")
      .select("service:services(price), appointment_services(price)")
      .eq("status", "completed")
      .gte("start_time", `${prevFrom}T00:00:00`)
      .lte("start_time", `${prevTo}T23:59:59`),
  ]);

  const rows = (appointments ?? []).map((a) => ({
    ...a,
    client: Array.isArray(a.client) ? a.client[0] : a.client,
    service: Array.isArray(a.service) ? a.service[0] : a.service,
    barber: Array.isArray(a.barber) ? a.barber[0] : a.barber,
  }));

  const items = (a: (typeof rows)[number]) =>
    a.appointment_services?.length
      ? a.appointment_services.map((s) => ({ name: s.service_name, price: s.price }))
      : a.service
        ? [{ name: a.service.name, price: a.service.price }]
        : [];
  const appointmentTotal = (a: (typeof rows)[number]) => items(a).reduce((sum, i) => sum + i.price, 0);

  const completed = rows.filter((r) => r.status === "completed");
  const cancelled = rows.filter((r) => r.status === "cancelled");

  const totalRevenue = completed.reduce((sum, r) => sum + appointmentTotal(r), 0);
  const prevRevenue = (prevAppointments ?? []).reduce((sum, r) => {
    if (r.appointment_services?.length) {
      return sum + r.appointment_services.reduce((s, i) => s + i.price, 0);
    }
    const service = Array.isArray(r.service) ? r.service[0] : r.service;
    return sum + (service?.price ?? 0);
  }, 0);
  const pctChange = prevRevenue > 0 ? Math.round(((totalRevenue - prevRevenue) / prevRevenue) * 100) : null;

  const byBarber = new Map<string, { name: string; revenue: number; commission: number; count: number }>();
  for (const r of completed) {
    if (!r.barber) continue;
    const price = appointmentTotal(r);
    const commissionPct = r.barber.commission_percent ?? 0;
    const key = r.barber.full_name;
    const entry = byBarber.get(key) ?? { name: r.barber.full_name, revenue: 0, commission: 0, count: 0 };
    entry.revenue += price;
    entry.commission += price * (commissionPct / 100);
    entry.count += 1;
    byBarber.set(key, entry);
  }

  const byService = new Map<string, { name: string; count: number; revenue: number }>();
  for (const r of completed) {
    for (const item of items(r)) {
      const entry = byService.get(item.name) ?? { name: item.name, count: 0, revenue: 0 };
      entry.count += 1;
      entry.revenue += item.price;
      byService.set(item.name, entry);
    }
  }
  const topServices = [...byService.values()].sort((a, b) => b.revenue - a.revenue);
  const donutData = topServices.slice(0, 5).map((s) => ({ name: s.name, value: s.count }));

  const dayBuckets = new Map<string, number>();
  for (const day of eachDayOfInterval({ start: new Date(`${from}T00:00:00`), end: new Date(`${to}T00:00:00`) })) {
    dayBuckets.set(format(day, "yyyy-MM-dd"), 0);
  }
  for (const r of completed) {
    const key = format(new Date(r.start_time), "yyyy-MM-dd");
    dayBuckets.set(key, (dayBuckets.get(key) ?? 0) + appointmentTotal(r));
  }
  const trendData = [...dayBuckets.entries()].map(([date, total]) => ({ date, total }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Lucros</h1>
        <p className="text-muted-foreground">Acompanhe o desempenho da barbearia</p>
      </div>

      <form className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="from">De</Label>
          <Input id="from" name="from" type="date" defaultValue={from} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="to">Até</Label>
          <Input id="to" name="to" type="date" defaultValue={to} />
        </div>
        <Button type="submit" variant="outline">
          Filtrar
        </Button>
      </form>

      <Tabs defaultValue="resumo">
        <TabsList className="w-full">
          <TabsTrigger value="resumo">Resumo</TabsTrigger>
          <TabsTrigger value="servicos">Serviços</TabsTrigger>
          <TabsTrigger value="cancelados">Cancelados</TabsTrigger>
        </TabsList>

        <TabsContent value="resumo" className="mt-4 flex flex-col gap-4">
          <Card>
            <CardContent className="py-4">
              <p className="text-sm text-muted-foreground">Faturamento total no período</p>
              <div className="mt-1 flex items-baseline gap-2">
                <p className="text-2xl font-semibold">{currency(totalRevenue)}</p>
                {pctChange !== null && (
                  <span className={pctChange >= 0 ? "text-sm text-emerald-500" : "text-sm text-destructive"}>
                    {pctChange >= 0 ? "+" : ""}
                    {pctChange}% vs período anterior
                  </span>
                )}
              </div>
              <RevenueTrendChart data={trendData} />
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="py-4">
                <p className="text-sm text-muted-foreground">Concluídos</p>
                <p className="mt-1 text-2xl font-semibold">{completed.length}</p>
                <p className="text-xs text-muted-foreground">{currency(totalRevenue)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-4">
                <p className="text-sm text-muted-foreground">Cancelados</p>
                <p className="mt-1 text-2xl font-semibold">{cancelled.length}</p>
                <p className="text-xs text-destructive">
                  {currency(cancelled.reduce((s, r) => s + appointmentTotal(r), 0))}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Serviços mais realizados</CardTitle>
            </CardHeader>
            <CardContent>
              <ServiceDonutChart data={donutData} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="servicos" className="mt-4 flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Serviços mais vendidos</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Serviço</TableHead>
                    <TableHead>Quantidade</TableHead>
                    <TableHead>Faturamento</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topServices.map((s) => (
                    <TableRow key={s.name}>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell>{s.count}</TableCell>
                      <TableCell>{currency(s.revenue)}</TableCell>
                    </TableRow>
                  ))}
                  {topServices.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="py-6 text-center text-muted-foreground">
                        Sem dados no período.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Por barbeiro</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Barbeiro</TableHead>
                    <TableHead>Atendimentos</TableHead>
                    <TableHead>Faturamento</TableHead>
                    <TableHead>Comissão</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...byBarber.values()].map((b) => (
                    <TableRow key={b.name}>
                      <TableCell className="font-medium">{b.name}</TableCell>
                      <TableCell>{b.count}</TableCell>
                      <TableCell>{currency(b.revenue)}</TableCell>
                      <TableCell>{currency(b.commission)}</TableCell>
                    </TableRow>
                  ))}
                  {byBarber.size === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="py-6 text-center text-muted-foreground">
                        Sem dados no período.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cancelados" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Serviço</TableHead>
                    <TableHead>Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cancelled.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>{format(new Date(c.start_time), "dd/MM/yyyy", { locale: ptBR })}</TableCell>
                      <TableCell className="font-medium">{c.client?.full_name ?? "-"}</TableCell>
                      <TableCell>
                        {items(c).length ? items(c).map((i) => i.name).join(" + ") : "-"}
                      </TableCell>
                      <TableCell>{currency(appointmentTotal(c))}</TableCell>
                    </TableRow>
                  ))}
                  {cancelled.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="py-6 text-center text-muted-foreground">
                        Nenhum cancelamento no período.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

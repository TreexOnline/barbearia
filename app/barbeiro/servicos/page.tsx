import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { ServiceDialog } from "./service-dialog";
import { DeleteButton } from "./delete-button";

const currency = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

export default async function ServicosPage() {
  await requireAdmin();
  const supabase = await createClient();

  const { data: services } = await supabase.from("services").select("*").order("name");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Serviços</h1>
        <p className="text-muted-foreground">Gerencie os serviços da barbearia</p>
      </div>

      <ServiceDialog triggerClassName="w-full" />

      {(services ?? []).length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum serviço cadastrado ainda.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {(services ?? []).map((s) => (
            <Card key={s.id} className={!s.active ? "opacity-60" : undefined}>
              <CardContent className="flex items-center justify-between gap-3 py-3">
                <div>
                  <p className="font-medium">{s.name}</p>
                  <p className="text-sm text-muted-foreground">{currency(s.price)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <ServiceDialog service={s} triggerLabel="Editar" />
                  <DeleteButton id={s.id} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

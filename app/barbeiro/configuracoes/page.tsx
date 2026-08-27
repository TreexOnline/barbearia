import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Users, UserCog, ChevronRight } from "lucide-react";

const ITEMS = [
  {
    href: "/barbeiro/equipe",
    label: "Equipe",
    description: "Gerencie os barbeiros, comissões e permissões",
    icon: UserCog,
  },
  {
    href: "/barbeiro/usuarios",
    label: "Usuários",
    description: "Veja todos os clientes e barbeiros cadastrados",
    icon: Users,
  },
];

export default async function ConfiguracoesPage() {
  await requireAdmin();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Configurações</h1>
        <p className="text-muted-foreground">Gerencie a equipe e os usuários da barbearia</p>
      </div>

      <div className="flex flex-col gap-2">
        {ITEMS.map((item) => (
          <Link key={item.href} href={item.href}>
            <Card>
              <CardContent className="flex items-center gap-3 py-4">
                <div className="flex size-10 items-center justify-center rounded-full border border-primary/40 bg-primary/10">
                  <item.icon className="size-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{item.label}</p>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
                <ChevronRight className="size-4 text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

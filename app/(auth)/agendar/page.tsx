import Link from "next/link";
import { redirect } from "next/navigation";
import { Bebas_Neue } from "next/font/google";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const bebas = Bebas_Neue({ weight: "400", subsets: ["latin"], display: "swap" });

export default async function AgendarPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    redirect(profile?.role === "barber" ? "/barbeiro/dashboard" : "/");
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <Card className="w-full max-w-sm border-[#c9a15a]/25 bg-white/[0.03] ring-[#c9a15a]/10">
        <CardHeader>
          <CardTitle className={`${bebas.className} text-3xl tracking-wide text-[#f0e9da]`}>
            Vamos agendar seu horário
          </CardTitle>
          <CardDescription className="text-[#b9ae9c]">
            Você já tem uma conta na Garage Barbershop?
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Button
            nativeButton={false}
            render={<Link href="/login?next=%2F%3Fagendar%3D1" />}
            className={`${bebas.className} bg-gradient-to-b from-[#dfb96f] to-[#b9863c] text-base tracking-wide text-[#241a0a] shadow-lg shadow-black/30 transition-transform hover:scale-[1.02]`}
          >
            Sim, entrar
          </Button>
          <Button
            nativeButton={false}
            variant="outline"
            render={<Link href="/cadastro?next=%2F%3Fagendar%3D1" />}
            className={`${bebas.className} border-[#c9a15a]/40 bg-transparent text-base tracking-wide text-[#f0e9da] hover:bg-white/5`}
          >
            Não, cadastre-se agora
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Bebas_Neue } from "next/font/google";
import { loginAction } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const bebas = Bebas_Neue({ weight: "400", subsets: ["latin"], display: "swap" });

export function LoginForm({ next }: { next?: string }) {
  const [state, formAction, pending] = useActionState(loginAction, undefined);

  return (
    <Card className="w-full max-w-sm border-[#c9a15a]/25 bg-white/[0.03] ring-[#c9a15a]/10">
      <CardHeader>
        <CardTitle className={`${bebas.className} text-3xl tracking-wide text-[#f0e9da]`}>
          Entrar
        </CardTitle>
        <CardDescription className="text-[#b9ae9c]">
          Acesse sua conta para agendar um horário.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-4">
          {next && <input type="hidden" name="next" value={next} />}
          <div className="flex flex-col gap-2">
            <Label htmlFor="phone" className="text-[#e7e0d2]">
              Celular
            </Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              placeholder="(11) 99999-9999"
              required
              autoComplete="tel"
              className="border-[#c9a15a]/25 bg-white/[0.02] text-[#f0e9da] placeholder:text-[#7d7364] focus-visible:border-[#c9a15a]/60 focus-visible:ring-[#c9a15a]/20"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password" className="text-[#e7e0d2]">
              Senha
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="border-[#c9a15a]/25 bg-white/[0.02] text-[#f0e9da] placeholder:text-[#7d7364] focus-visible:border-[#c9a15a]/60 focus-visible:ring-[#c9a15a]/20"
            />
          </div>
          {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
          <Button
            type="submit"
            disabled={pending}
            className={`${bebas.className} mt-2 bg-gradient-to-b from-[#dfb96f] to-[#b9863c] text-base tracking-wide text-[#241a0a] shadow-lg shadow-black/30 transition-transform hover:scale-[1.02]`}
          >
            {pending ? "Entrando..." : "Entrar"}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-[#9c9184]">
          <Link href="/esqueci-senha" className="text-[#c9a15a] underline underline-offset-4">
            Esqueci minha senha
          </Link>
        </p>
        <p className="mt-2 text-center text-sm text-[#9c9184]">
          Não tem uma conta?{" "}
          <Link href="/cadastro" className="text-[#c9a15a] underline underline-offset-4">
            Cadastre-se
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

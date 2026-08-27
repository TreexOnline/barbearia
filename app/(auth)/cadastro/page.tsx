"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Bebas_Neue } from "next/font/google";
import { registerAction } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PasswordStrengthMeter } from "@/components/password-strength-meter";

const bebas = Bebas_Neue({ weight: "400", subsets: ["latin"], display: "swap" });

const fieldClassName =
  "border-[#c9a15a]/25 bg-white/[0.02] text-[#f0e9da] placeholder:text-[#7d7364] focus-visible:border-[#c9a15a]/60 focus-visible:ring-[#c9a15a]/20";

export default function CadastroPage() {
  const [state, formAction, pending] = useActionState(registerAction, undefined);
  const [password, setPassword] = useState("");

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <Card className="w-full max-w-sm border-[#c9a15a]/25 bg-white/[0.03] ring-[#c9a15a]/10">
        <CardHeader>
          <CardTitle className={`${bebas.className} text-3xl tracking-wide text-[#f0e9da]`}>
            Criar conta
          </CardTitle>
          <CardDescription className="text-[#b9ae9c]">
            Cadastre-se para agendar seus horários.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="fullName" className="text-[#e7e0d2]">
                Nome completo
              </Label>
              <Input
                id="fullName"
                name="fullName"
                autoComplete="name"
                required
                className={fieldClassName}
              />
            </div>
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
                className={fieldClassName}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="birthDate" className="text-[#e7e0d2]">
                Data de nascimento
              </Label>
              <Input
                id="birthDate"
                name="birthDate"
                type="date"
                required
                className={fieldClassName}
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
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={fieldClassName}
              />
              <PasswordStrengthMeter password={password} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="confirmPassword" className="text-[#e7e0d2]">
                Confirmar senha
              </Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                autoComplete="new-password"
                className={fieldClassName}
              />
            </div>
            {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
            <Button
              type="submit"
              disabled={pending}
              className={`${bebas.className} mt-2 bg-gradient-to-b from-[#dfb96f] to-[#b9863c] text-base tracking-wide text-[#241a0a] shadow-lg shadow-black/30 transition-transform hover:scale-[1.02]`}
            >
              {pending ? "Criando conta..." : "Criar conta"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-[#9c9184]">
            Já tem uma conta?{" "}
            <Link href="/login" className="text-[#c9a15a] underline underline-offset-4">
              Entrar
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

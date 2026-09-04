"use client";

import { useActionState } from "react";
import { Bebas_Neue } from "next/font/google";
import { authAction } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DateMaskInput } from "@/components/date-mask-input";

const bebas = Bebas_Neue({ weight: "400", subsets: ["latin"], display: "swap" });

const fieldClassName =
  "border-[#c9a15a]/25 bg-white/[0.02] text-[#f0e9da] placeholder:text-[#7d7364] focus-visible:border-[#c9a15a]/60 focus-visible:ring-[#c9a15a]/20";

export function AgendarForm() {
  const [state, formAction, pending] = useActionState(authAction, undefined);

  return (
    <Card className="w-full max-w-sm border-[#c9a15a]/25 bg-white/[0.03] ring-[#c9a15a]/10">
      <CardHeader>
        <CardTitle className={`${bebas.className} text-3xl tracking-wide text-[#f0e9da]`}>
          Vamos agendar seu horário
        </CardTitle>
        <CardDescription className="text-[#b9ae9c]">
          Informe seu celular e data de nascimento. Se você já tem conta, a gente já te reconhece.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="next" value="/?agendar=1" />
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
            <DateMaskInput id="birthDate" name="birthDate" required className={fieldClassName} />
          </div>
          {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
          <Button
            type="submit"
            disabled={pending}
            className={`${bebas.className} mt-2 bg-gradient-to-b from-[#dfb96f] to-[#b9863c] text-base tracking-wide text-[#241a0a] shadow-lg shadow-black/30 transition-transform hover:scale-[1.02]`}
          >
            {pending ? "Verificando..." : "Continuar"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

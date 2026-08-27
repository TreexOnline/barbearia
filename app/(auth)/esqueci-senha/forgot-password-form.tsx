"use client";

import { useActionState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Bebas_Neue } from "next/font/google";
import { forgotPasswordAction } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const bebas = Bebas_Neue({ weight: "400", subsets: ["latin"], display: "swap" });

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(forgotPasswordAction, undefined);

  useEffect(() => {
    if (state?.error) toast.error(state.error);
  }, [state]);

  if (state?.success) {
    return (
      <Card className="w-full max-w-sm border-[#c9a15a]/25 bg-white/[0.03] ring-[#c9a15a]/10">
        <CardHeader>
          <CardTitle className={`${bebas.className} text-3xl tracking-wide text-[#f0e9da]`}>
            Senha alterada
          </CardTitle>
          <CardDescription className="text-[#b9ae9c]">
            Sua senha foi trocada com sucesso.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            nativeButton={false}
            render={<Link href="/login" />}
            className={`${bebas.className} w-full bg-gradient-to-b from-[#dfb96f] to-[#b9863c] text-base tracking-wide text-[#241a0a] shadow-lg shadow-black/30 transition-transform hover:scale-[1.02]`}
          >
            Ir para o login
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-sm border-[#c9a15a]/25 bg-white/[0.03] ring-[#c9a15a]/10">
      <CardHeader>
        <CardTitle className={`${bebas.className} text-3xl tracking-wide text-[#f0e9da]`}>
          Esqueci minha senha
        </CardTitle>
        <CardDescription className="text-[#b9ae9c]">
          Informe seu celular e data de nascimento para confirmar sua identidade e trocar a senha.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-4">
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
            <Label htmlFor="birthDate" className="text-[#e7e0d2]">
              Data de nascimento
            </Label>
            <Input
              id="birthDate"
              name="birthDate"
              type="date"
              required
              className="border-[#c9a15a]/25 bg-white/[0.02] text-[#f0e9da] placeholder:text-[#7d7364] focus-visible:border-[#c9a15a]/60 focus-visible:ring-[#c9a15a]/20"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="newPassword" className="text-[#e7e0d2]">
              Nova senha
            </Label>
            <Input
              id="newPassword"
              name="newPassword"
              type="password"
              required
              autoComplete="new-password"
              className="border-[#c9a15a]/25 bg-white/[0.02] text-[#f0e9da] placeholder:text-[#7d7364] focus-visible:border-[#c9a15a]/60 focus-visible:ring-[#c9a15a]/20"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="confirmNewPassword" className="text-[#e7e0d2]">
              Confirmar nova senha
            </Label>
            <Input
              id="confirmNewPassword"
              name="confirmNewPassword"
              type="password"
              required
              autoComplete="new-password"
              className="border-[#c9a15a]/25 bg-white/[0.02] text-[#f0e9da] placeholder:text-[#7d7364] focus-visible:border-[#c9a15a]/60 focus-visible:ring-[#c9a15a]/20"
            />
          </div>
          <Button
            type="submit"
            disabled={pending}
            className={`${bebas.className} mt-2 bg-gradient-to-b from-[#dfb96f] to-[#b9863c] text-base tracking-wide text-[#241a0a] shadow-lg shadow-black/30 transition-transform hover:scale-[1.02]`}
          >
            {pending ? "Verificando..." : "Trocar senha"}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-[#9c9184]">
          <Link href="/login" className="text-[#c9a15a] underline underline-offset-4">
            Voltar para o login
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

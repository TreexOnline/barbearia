"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfileAction } from "./actions";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function ProfileForm({
  fullName,
  phone,
  birthDate,
}: {
  fullName: string;
  phone: string;
  birthDate: string | null;
}) {
  const [state, formAction, pending] = useActionState(updateProfileAction, undefined);

  useEffect(() => {
    if (state?.error) toast.error(state.error);
    if (state?.success) toast.success("Perfil atualizado");
  }, [state]);

  return (
    <form action={formAction} className="flex max-w-sm flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="fullName">Nome completo</Label>
        <Input id="fullName" name="fullName" defaultValue={fullName} required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="phone">Celular</Label>
        <Input id="phone" defaultValue={phone} disabled />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="birthDate">Data de nascimento</Label>
        <Input
          id="birthDate"
          defaultValue={birthDate ? format(new Date(`${birthDate}T00:00:00`), "dd/MM/yyyy", { locale: ptBR }) : ""}
          disabled
        />
      </div>
      <Button type="submit" disabled={pending} className="mt-2 self-start">
        {pending ? "Salvando..." : "Salvar"}
      </Button>
    </form>
  );
}

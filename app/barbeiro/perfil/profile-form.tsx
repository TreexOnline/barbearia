"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateBarberProfileAction } from "./actions";

export function ProfileForm({
  fullName,
  phone,
  roleLabel,
}: {
  fullName: string;
  phone: string;
  roleLabel: string;
}) {
  const [state, formAction, pending] = useActionState(updateBarberProfileAction, undefined);

  useEffect(() => {
    if (state?.error) toast.error(state.error);
    if (state?.success) toast.success("Perfil atualizado");
  }, [state]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="fullName">Nome completo</Label>
        <Input id="fullName" name="fullName" defaultValue={fullName} required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="phone">Celular</Label>
        <Input id="phone" defaultValue={phone} disabled />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="role">Função</Label>
        <Input id="role" defaultValue={roleLabel} disabled />
      </div>
      <Button type="submit" disabled={pending} className="mt-2 self-start">
        {pending ? "Salvando..." : "Salvar"}
      </Button>
    </form>
  );
}

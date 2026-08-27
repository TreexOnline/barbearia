"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createBarberAction, updateBarberAction } from "./actions";
import { Pencil, Plus } from "lucide-react";

export function NewBarberDialog() {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await createBarberAction(undefined, formData);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Barbeiro criado");
        setOpen(false);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>
        <Plus className="size-4" /> Novo barbeiro
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo barbeiro</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="fullName">Nome completo</Label>
            <Input id="fullName" name="fullName" required />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="phone">Telefone (WhatsApp)</Label>
            <Input id="phone" name="phone" placeholder="5511999999999" required />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Senha inicial</Label>
            <Input id="password" name="password" type="password" required />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="commissionPercent">Comissão (%)</Label>
            <Input id="commissionPercent" name="commissionPercent" type="number" min={0} max={100} defaultValue={0} />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="isAdmin" name="isAdmin" />
            <Label htmlFor="isAdmin">É administrador (dono/gerente)</Label>
          </div>
          <Button type="submit" disabled={pending} className="mt-2 self-start">
            {pending ? "Criando..." : "Criar barbeiro"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface Barber {
  id: string;
  full_name: string;
  is_admin: boolean;
  commission_percent: number | null;
}

export function EditBarberDialog({ barber }: { barber: Barber }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await updateBarberAction(undefined, formData);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Barbeiro atualizado");
        setOpen(false);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <Pencil className="size-4" />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar {barber.full_name}</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="flex flex-col gap-4">
          <input type="hidden" name="id" value={barber.id} />
          <div className="flex flex-col gap-2">
            <Label htmlFor="commissionPercent">Comissão (%)</Label>
            <Input
              id="commissionPercent"
              name="commissionPercent"
              type="number"
              min={0}
              max={100}
              defaultValue={barber.commission_percent ?? 0}
            />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="isAdmin" name="isAdmin" defaultChecked={barber.is_admin} />
            <Label htmlFor="isAdmin">É administrador (dono/gerente)</Label>
          </div>
          <Button type="submit" disabled={pending} className="mt-2 self-start">
            {pending ? "Salvando..." : "Salvar"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

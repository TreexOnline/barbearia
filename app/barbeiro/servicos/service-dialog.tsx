"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createServiceAction, updateServiceAction } from "./actions";
import { Pencil, Plus, ImagePlus } from "lucide-react";

interface Service {
  id: string;
  name: string;
  duration_minutes: number;
  price: number;
  active: boolean;
  image_url: string | null;
  included_items: string | null;
}

export function ServiceDialog({
  service,
  triggerClassName,
  triggerLabel,
}: {
  service?: Service;
  triggerClassName?: string;
  triggerLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [preview, setPreview] = useState<string | null>(service?.image_url ?? null);
  const action = service ? updateServiceAction : createServiceAction;

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await action(undefined, formData);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success(service ? "Serviço atualizado" : "Serviço criado");
        setOpen(false);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {service ? (
        <DialogTrigger render={<Button variant="outline" size="sm" className={triggerClassName} />}>
          <Pencil className="size-4" />
          {triggerLabel}
        </DialogTrigger>
      ) : (
        <DialogTrigger render={<Button size="sm" className={triggerClassName} />}>
          <Plus className="size-4" /> Novo serviço
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{service ? "Editar serviço" : "Novo serviço"}</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="flex flex-col gap-4">
          {service && <input type="hidden" name="id" value={service.id} />}

          <div className="flex flex-col gap-2">
            <Label htmlFor="photo">Foto</Label>
            <label
              htmlFor="photo"
              className="flex h-32 cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-dashed border-input bg-muted/40 hover:bg-muted"
            >
              {preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview} alt="" className="size-full object-cover" />
              ) : (
                <span className="flex flex-col items-center gap-1 text-xs text-muted-foreground">
                  <ImagePlus className="size-5" />
                  Selecionar foto
                </span>
              )}
            </label>
            <input
              id="photo"
              name="photo"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) setPreview(URL.createObjectURL(file));
              }}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" name="name" defaultValue={service?.name} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="durationMinutes">Duração (min)</Label>
              <Input
                id="durationMinutes"
                name="durationMinutes"
                type="number"
                min={5}
                defaultValue={service?.duration_minutes ?? 30}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="price">Preço (R$)</Label>
              <Input
                id="price"
                name="price"
                type="number"
                step="0.01"
                min={0}
                defaultValue={service?.price ?? 0}
                required
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="includedItems">O que é incluso</Label>
            <Textarea
              id="includedItems"
              name="includedItems"
              placeholder="Ex: toalha quente, produtos premium, bebida cortesia"
              defaultValue={service?.included_items ?? ""}
              rows={3}
            />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="active" name="active" defaultChecked={service?.active ?? true} />
            <Label htmlFor="active">Ativo (aparece para clientes)</Label>
          </div>
          <Button type="submit" disabled={pending} className="mt-2 self-start">
            {pending ? "Salvando..." : "Salvar"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

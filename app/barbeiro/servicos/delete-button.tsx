"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { deleteServiceAction } from "./actions";

export function DeleteButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={() => {
        if (!confirm("Remover este serviço?")) return;
        startTransition(async () => {
          const result = await deleteServiceAction(id);
          if (result?.error) toast.error(result.error);
        });
      }}
    >
      <Trash2 className="size-4" />
    </Button>
  );
}

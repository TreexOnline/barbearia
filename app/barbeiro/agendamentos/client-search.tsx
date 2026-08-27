"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export interface ClientOption {
  id: string;
  full_name: string;
  birth_date: string | null;
}

function formatBirthDate(birthDate: string | null) {
  if (!birthDate) return "Sem data de nascimento";
  return format(new Date(`${birthDate}T00:00:00`), "dd/MM/yyyy", { locale: ptBR });
}

export function ClientSearch({
  clients,
  value,
  onChange,
}: {
  clients: ClientOption[];
  value: string;
  onChange: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = clients.find((c) => c.id === value);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return clients.filter((c) => c.full_name.toLowerCase().includes(q)).slice(0, 8);
  }, [clients, query]);

  if (selected) {
    return (
      <div className="flex items-center justify-between rounded-lg border border-input bg-white/[0.02] px-3 py-2">
        <div>
          <p className="text-sm font-medium">{selected.full_name}</p>
          <p className="text-xs text-muted-foreground">{formatBirthDate(selected.birth_date)}</p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => {
            onChange("");
            setQuery("");
          }}
          aria-label="Trocar cliente"
        >
          <X className="size-4" />
        </Button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <Input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Digite o nome do cliente"
      />
      {open && query.trim() && (
        <div className="absolute z-50 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-border bg-popover shadow-md">
          {results.length === 0 ? (
            <p className="px-3 py-2 text-sm text-muted-foreground">Nenhum cliente encontrado.</p>
          ) : (
            results.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  onChange(c.id);
                  setQuery("");
                  setOpen(false);
                }}
                className="flex w-full flex-col items-start px-3 py-2 text-left hover:bg-muted"
              >
                <span className="text-sm font-medium">{c.full_name}</span>
                <span className="text-xs text-muted-foreground">{formatBirthDate(c.birth_date)}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

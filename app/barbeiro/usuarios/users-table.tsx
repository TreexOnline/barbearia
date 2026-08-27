"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search } from "lucide-react";

interface UserRow {
  id: string;
  full_name: string;
  phone: string | null;
  role: string;
  created_at: string;
}

export function UsersTable({ users }: { users: UserRow[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) => u.full_name?.toLowerCase().includes(q) || u.phone?.toLowerCase().includes(q)
    );
  }, [users, query]);

  return (
    <div className="flex flex-col gap-4">
      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome ou telefone..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-8"
        />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Telefone</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Cadastrado em</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((u) => (
            <TableRow key={u.id}>
              <TableCell className="font-medium">{u.full_name}</TableCell>
              <TableCell>{u.phone ?? "-"}</TableCell>
              <TableCell>
                <Badge variant={u.role === "barber" ? "default" : "secondary"}>
                  {u.role === "barber" ? "Barbeiro" : "Cliente"}
                </Badge>
              </TableCell>
              <TableCell>{format(new Date(u.created_at), "dd/MM/yyyy", { locale: ptBR })}</TableCell>
            </TableRow>
          ))}
          {filtered.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                Nenhum usuário encontrado.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <p className="text-sm text-muted-foreground">
        {filtered.length} de {users.length} usuário{users.length === 1 ? "" : "s"}
      </p>
    </div>
  );
}

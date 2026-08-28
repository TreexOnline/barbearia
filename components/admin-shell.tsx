"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { logoutAction } from "@/app/(auth)/actions";
import {
  Menu,
  Bell,
  Warehouse,
  LayoutDashboard,
  Scissors,
  CalendarDays,
  Clock,
  TrendingUp,
  User,
  Settings,
  LogOut,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  adminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/barbeiro/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/barbeiro/servicos", label: "Serviços", icon: Scissors, adminOnly: true },
  { href: "/barbeiro/agendamentos", label: "Agendamentos", icon: CalendarDays },
  { href: "/barbeiro/horarios", label: "Horários", icon: Clock },
  { href: "/barbeiro/lucros", label: "Lucros", icon: TrendingUp, adminOnly: true },
];

const DRAWER_EXTRA_ITEMS: NavItem[] = [
  { href: "/barbeiro/perfil", label: "Perfil", icon: User },
  { href: "/barbeiro/configuracoes", label: "Configurações", icon: Settings, adminOnly: true },
];

function BrandMark() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex size-11 items-center justify-center rounded-full border border-primary/60 bg-background">
        <Warehouse className="size-5 text-primary" />
      </div>
      <div className="leading-none">
        <p className="font-heading text-lg tracking-wide">GARAGE</p>
        <p className="text-[10px] tracking-[0.35em] text-primary">BARBERSHOP</p>
      </div>
    </div>
  );
}

function SidebarNav({
  items,
  pathname,
  onNavigate,
}: {
  items: NavItem[];
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex flex-1 flex-col gap-1 p-3">
      {items.map((item) => {
        const active = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              active ? "bg-primary/15 text-primary" : "text-foreground/80 hover:bg-muted"
            )}
          >
            <item.icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarFooter() {
  return (
    <div className="flex flex-col gap-4 p-3">
      <form action={logoutAction}>
        <Button type="submit" variant="ghost" className="w-full justify-start gap-3 px-3 text-foreground/80">
          <LogOut className="size-4" />
          Sair
        </Button>
      </form>
      <div className="border-t border-border px-3 pt-4 pb-2 text-center">
        <p className="font-heading text-sm tracking-wide text-foreground">GARAGE BARBERSHOP</p>
        <p className="mt-1 text-[10px] tracking-[0.2em] text-muted-foreground">
          GARAGEM PEQUENA, RESULTADO GRANDE
        </p>
      </div>
    </div>
  );
}

export function AdminShell({
  fullName,
  isAdmin,
  children,
}: {
  fullName: string;
  isAdmin: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const bottomItems = NAV_ITEMS.filter((item) => isAdmin || !item.adminOnly);
  const drawerItems = [...NAV_ITEMS, ...DRAWER_EXTRA_ITEMS].filter((item) => isAdmin || !item.adminOnly);
  const roleLabel = isAdmin ? "Administrador" : "Barbeiro";

  return (
    <div className="dark flex min-h-screen flex-1 bg-background text-foreground">
      {/* Sidebar fixa — só em telas grandes (desktop) */}
      <aside className="hidden shrink-0 flex-col border-r border-border bg-background lg:flex lg:w-64">
        <div className="border-b border-border p-4">
          <BrandMark />
          <div className="mt-4 border-t border-border pt-3">
            <p className="text-sm font-medium">Olá, {fullName}</p>
            <p className="text-sm text-primary">{roleLabel}</p>
          </div>
        </div>
        <SidebarNav items={drawerItems} pathname={pathname} />
        <SidebarFooter />
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="sticky top-0 z-40 border-b border-border bg-background">
          <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3 lg:max-w-none lg:justify-end lg:px-8">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setOpen(true)}
              aria-label="Abrir menu"
              className="lg:hidden"
            >
              <Menu className="size-5" />
            </Button>
            <Link href="/barbeiro/dashboard" className="flex items-center gap-2 lg:hidden">
              <div className="flex size-8 items-center justify-center rounded-full border border-primary/60 bg-card">
                <Warehouse className="size-4 text-primary" />
              </div>
              <span className="font-heading text-lg tracking-wide">GARAGE</span>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              nativeButton={false}
              render={<Link href="/barbeiro/agendamentos" aria-label="Agendamentos" />}
            >
              <Bell className="size-5" />
            </Button>
          </div>
        </header>

        <main className="mx-auto w-full max-w-lg flex-1 px-4 pt-6 pb-24 lg:max-w-5xl lg:px-8 lg:pb-10">
          {children}
        </main>

        <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background lg:hidden">
          <div className="mx-auto flex max-w-lg items-stretch justify-around px-1 py-1.5">
            {bottomItems.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex flex-1 flex-col items-center gap-1 rounded-lg px-1 py-1.5 text-[11px] transition-colors",
                    active ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <item.icon className="size-5" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="flex w-72 flex-col p-0">
          <SheetHeader className="border-b border-border p-4">
            <SheetTitle className="sr-only">Menu</SheetTitle>
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-full border border-primary/60 bg-background">
                <Warehouse className="size-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">Olá, {fullName}</p>
                <p className="text-sm text-primary">{roleLabel}</p>
              </div>
            </div>
          </SheetHeader>

          <SidebarNav items={drawerItems} pathname={pathname} onNavigate={() => setOpen(false)} />
          <SidebarFooter />
        </SheetContent>
      </Sheet>
    </div>
  );
}

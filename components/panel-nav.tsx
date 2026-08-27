"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/back-button";
import { logoutAction } from "@/app/(auth)/actions";
import { Scissors, LogOut } from "lucide-react";

export interface PanelNavItem {
  href: string;
  label: string;
}

export function PanelNav({
  items,
  userLabel,
}: {
  items: PanelNavItem[];
  userLabel: string;
}) {
  const pathname = usePathname();

  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-3">
          <BackButton />
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Scissors className="size-5" />
            Barbearia
          </Link>
          <nav className="flex flex-wrap gap-1">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted",
                  pathname === item.href
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{userLabel}</span>
          <form action={logoutAction}>
            <Button type="submit" variant="ghost" size="sm">
              <LogOut className="size-4" />
              Sair
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function BackButton({
  href,
  className,
}: {
  href?: string;
  className?: string;
}) {
  const router = useRouter();

  if (href) {
    return (
      <Link href={href} className={cn(buttonVariants({ variant: "ghost", size: "sm" }), className)}>
        <ArrowLeft className="size-4" />
        Voltar
      </Link>
    );
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className={className}
      onClick={() => router.back()}
    >
      <ArrowLeft className="size-4" />
      Voltar
    </Button>
  );
}

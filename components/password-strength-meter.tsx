"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";

function getStrength(password: string) {
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 10) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 2) return { score, label: "Fraca", barColor: "bg-red-500", textColor: "text-red-400" };
  if (score <= 3) return { score, label: "Média", barColor: "bg-amber-500", textColor: "text-amber-400" };
  return { score, label: "Forte", barColor: "bg-emerald-500", textColor: "text-emerald-400" };
}

export function PasswordStrengthMeter({
  password,
  className,
  labelClassName,
}: {
  password: string;
  className?: string;
  labelClassName?: string;
}) {
  const strength = useMemo(() => getStrength(password), [password]);
  if (!password) return null;

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <div className="flex gap-1">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={cn(
              "h-1.5 flex-1 rounded-full bg-white/10 transition-colors",
              i < strength.score && strength.barColor
            )}
          />
        ))}
      </div>
      <p className={cn("text-xs", labelClassName ?? strength.textColor)}>
        Senha {strength.label.toLowerCase()}
      </p>
    </div>
  );
}

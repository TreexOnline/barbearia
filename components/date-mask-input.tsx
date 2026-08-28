"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";

function formatDateMask(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  if (digits.length > 4) return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
  if (digits.length > 2) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return digits;
}

export function DateMaskInput({
  id,
  name,
  required,
  className,
  defaultValue,
}: {
  id?: string;
  name: string;
  required?: boolean;
  className?: string;
  defaultValue?: string;
}) {
  const [value, setValue] = useState(defaultValue ?? "");

  return (
    <Input
      id={id}
      name={name}
      type="text"
      inputMode="numeric"
      placeholder="DD/MM/AAAA"
      required={required}
      className={className}
      value={value}
      onChange={(e) => setValue(formatDateMask(e.target.value))}
      maxLength={10}
    />
  );
}

"use client";

import { useState } from "react";
import { CalendarDays } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DarkScope } from "@/components/dark-scope";
import { BookingForm } from "@/app/cliente/nova-reserva/booking-form";
import type { ServiceOption } from "@/app/cliente/nova-reserva/service-picker";

interface Barber {
  id: string;
  full_name: string;
}

export function HeroBookingButton({
  className,
  services,
  barbers,
}: {
  className?: string;
  services: ServiceOption[];
  barbers: Barber[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        <CalendarDays className="size-5" />
        AGENDAR AGORA
      </button>
      <DarkScope>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Agendar horário</DialogTitle>
            </DialogHeader>
            <BookingForm services={services} barbers={barbers} onSuccess={() => setOpen(false)} />
          </DialogContent>
        </Dialog>
      </DarkScope>
    </>
  );
}

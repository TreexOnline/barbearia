"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CalendarPlus, ChevronDown, ListChecks } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DarkScope } from "@/components/dark-scope";
import { logoutAction } from "@/app/(auth)/actions";
import { BookingForm } from "@/app/cliente/nova-reserva/booking-form";
import { AppointmentsModal, type AppointmentRow } from "@/app/cliente/meus-agendamentos/appointments-modal";
import type { ServiceOption } from "@/app/cliente/nova-reserva/service-picker";

interface Barber {
  id: string;
  full_name: string;
}

export function ClientHomeActions({
  fullName,
  services,
  barbers,
  appointments,
  autoOpenBooking,
}: {
  fullName: string;
  services: ServiceOption[];
  barbers: Barber[];
  appointments: AppointmentRow[];
  autoOpenBooking?: boolean;
}) {
  const [bookingOpen, setBookingOpen] = useState(Boolean(autoOpenBooking));
  const [agendamentosOpen, setAgendamentosOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (autoOpenBooking) router.replace("/", { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-1 text-sm font-medium text-[#f0e9da] transition-colors hover:text-[#c9a15a]">
          Bem-vindo, {fullName.split(" ")[0] || "Cliente"}
          <ChevronDown className="size-3.5" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem render={<Link href="/cliente/perfil" />}>Perfil</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => logoutAction()}>Sair</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#0b0906]/95 backdrop-blur supports-backdrop-filter:bg-[#0b0906]/80"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-2 px-4 py-2.5 sm:px-6">
          <button
            type="button"
            onClick={() => setAgendamentosOpen(true)}
            className="flex flex-col items-center gap-1 rounded-lg px-3 py-1.5 text-[#e7e0d2]/80 transition-colors hover:bg-white/5 hover:text-[#f0e9da]"
          >
            <ListChecks className="size-5" />
            <span className="text-xs font-medium">Meus agendamentos</span>
          </button>
          <button
            type="button"
            onClick={() => setBookingOpen(true)}
            className="flex flex-col items-center gap-1 rounded-lg px-3 py-1.5 text-[#241a0a] transition-colors bg-gradient-to-b from-[#dfb96f] to-[#b9863c]"
          >
            <CalendarPlus className="size-5" />
            <span className="text-xs font-semibold">Agendar agora</span>
          </button>
        </div>
      </nav>

      <DarkScope>
        <Dialog open={bookingOpen} onOpenChange={setBookingOpen}>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Agendar horário</DialogTitle>
            </DialogHeader>
            <BookingForm services={services} barbers={barbers} onSuccess={() => setBookingOpen(false)} />
          </DialogContent>
        </Dialog>

        <AppointmentsModal open={agendamentosOpen} onOpenChange={setAgendamentosOpen} appointments={appointments} />
      </DarkScope>
    </>
  );
}

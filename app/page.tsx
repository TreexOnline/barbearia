import Link from "next/link";
import Image from "next/image";
import { Bebas_Neue } from "next/font/google";
import { createClient } from "@/lib/supabase/server";
import {
  CalendarDays,
  CalendarCheck,
  ChevronRight,
  Scissors,
  UserRound,
  Warehouse,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ClientHomeActions } from "@/components/client-home-actions";
import { HeroBookingButton } from "@/components/hero-booking-button";
import type { AppointmentRow } from "@/app/cliente/meus-agendamentos/appointments-modal";

const bebas = Bebas_Neue({ weight: "400", subsets: ["latin"], display: "swap" });

const STEPS = [
  {
    icon: Scissors,
    title: "ESCOLHA O SERVIÇO",
    description: "Veja nossos serviços e selecione o ideal para você.",
  },
  {
    icon: UserRound,
    title: "ESCOLHA O BARBEIRO",
    description: "Selecione o barbeiro de sua preferência.",
  },
  {
    icon: CalendarDays,
    title: "ESCOLHA O HORÁRIO",
    description: "Escolha o melhor dia e horário para seu atendimento.",
  },
];

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-10 flex items-center justify-center gap-4">
      <span className="h-px w-12 bg-[#c9a15a]/40 sm:w-24" />
      <h2 className={`${bebas.className} text-lg tracking-[0.3em] text-[#c9a15a] sm:text-xl`}>
        {children}
      </h2>
      <span className="h-px w-12 bg-[#c9a15a]/40 sm:w-24" />
    </div>
  );
}

function HeroArt() {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-md lg:mx-0">
      <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(201,161,90,0.25),transparent_70%)] blur-3xl" />
      <Image
        src="/garage-logo.png"
        alt="Garage Barbershop"
        fill
        sizes="(min-width: 1024px) 28rem, 90vw"
        className="relative object-contain drop-shadow-[0_25px_60px_rgba(0,0,0,0.65)]"
        priority
      />
    </div>
  );
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ agendar?: string }>;
}) {
  const { agendar } = await searchParams;
  const supabase = await createClient();
  const [{ data: services }, { data: userData }] = await Promise.all([
    supabase.from("services").select("*").eq("active", true).order("name"),
    supabase.auth.getUser(),
  ]);

  const user = userData?.user ?? null;
  let profile: { full_name: string; role: string } | null = null;
  let barbers: { id: string; full_name: string }[] = [];
  let appointments: AppointmentRow[] = [];

  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("full_name, role")
      .eq("id", user.id)
      .single();
    profile = data;

    if (profile?.role === "client") {
      const [{ data: barberRows }, { data: appointmentRows }] = await Promise.all([
        // Só barbeiros que já configuraram horário de atendimento aparecem pro
        // cliente escolher — evita mostrar contas administrativas sem agenda
        // (ex: dono que nunca atende) como opção de barbeiro.
        supabase
          .from("profiles")
          .select("id, full_name, barber_schedules!inner(id)")
          .eq("role", "barber")
          .order("full_name"),
        supabase
          .from("appointments")
          .select(
            "id, start_time, status, service:services(id, name, price), barber:profiles!appointments_barber_id_fkey(id, full_name), appointment_services(service_id, service_name)"
          )
          .eq("client_id", user.id)
          .order("start_time", { ascending: false }),
      ]);
      barbers = [...new Map((barberRows ?? []).map((b) => [b.id, { id: b.id, full_name: b.full_name }])).values()];
      appointments = (appointmentRows ?? []).map((a) => ({
        ...a,
        service: Array.isArray(a.service) ? a.service[0] : a.service,
        barber: Array.isArray(a.barber) ? a.barber[0] : a.barber,
      }));
    }
  }

  const isClient = Boolean(user && profile?.role === "client");

  const now = new Date();
  const nextAppointment = appointments
    .filter((a) => (a.status === "confirmed" || a.status === "pending") && new Date(a.start_time) > now)
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())[0];
  const nextAppointmentServiceLabel = nextAppointment
    ? nextAppointment.appointment_services?.length
      ? nextAppointment.appointment_services.map((s) => s.service_name).join(" + ")
      : (nextAppointment.service?.name ?? "")
    : "";

  return (
    <div
      className={`flex min-h-screen flex-1 flex-col bg-[#080705] text-[#e7e0d2] ${isClient ? "pb-20" : ""}`}
    >
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-full border border-[#c9a15a]/60 bg-[#141110]">
              <Warehouse className="size-5 text-[#c9a15a]" />
            </div>
            <div className="leading-none">
              <div className={`${bebas.className} text-xl tracking-wide text-[#f0e9da]`}>GARAGE</div>
              <div className={`${bebas.className} text-[10px] tracking-[0.35em] text-[#c9a15a]`}>
                BARBERSHOP
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 sm:gap-6">
            {isClient ? (
              <ClientHomeActions
                fullName={profile?.full_name ?? ""}
                services={services ?? []}
                barbers={barbers}
                appointments={appointments}
                autoOpenBooking={agendar === "1"}
              />
            ) : user ? (
              <Link
                href="/barbeiro/dashboard"
                className="text-sm font-medium text-[#f0e9da] transition-colors hover:text-[#c9a15a]"
              >
                Bem-vindo, {profile?.full_name?.split(" ")[0] || "Barbeiro"}
              </Link>
            ) : (
              <>
                <Link href="/login" className="text-sm text-[#e7e0d2]/80 transition-colors hover:text-[#f0e9da]">
                  Entrar
                </Link>
                <Link
                  href="/agendar"
                  className="rounded-md bg-gradient-to-b from-[#dfb96f] to-[#b9863c] px-5 py-2.5 text-sm font-semibold text-[#241a0a] shadow-lg shadow-black/30 transition-transform hover:scale-[1.02]"
                >
                  Agendar agora
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:items-center lg:gap-16 lg:py-20">
          <div>
            <h1 className={`${bebas.className} text-4xl leading-[0.95] text-[#f0e9da] sm:text-5xl`}>
              AGENDE SEU HORÁRIO NA
            </h1>
            <div
              className={`${bebas.className} text-7xl leading-[0.85] text-[#e8c988] sm:text-8xl`}
              style={{ textShadow: "0 4px 24px rgba(201,161,90,0.25)" }}
            >
              GARAGE
            </div>
            <div className={`${bebas.className} text-3xl tracking-[0.2em] text-[#c9a15a] sm:text-4xl`}>
              BARBERSHOP
            </div>

            <div className="my-6 flex items-center gap-3 text-[#c9a15a]">
              <span className="h-px flex-1 max-w-24 bg-[#c9a15a]/40" />
              <Scissors className="size-4" />
              <span className="h-px flex-1 max-w-24 bg-[#c9a15a]/40" />
            </div>

            <p className="max-w-md text-[#b9ae9c]">
              Escolha o serviço, o barbeiro e o horário que preferir. Confirmação e
              lembrete direto no seu email e WhatsApp.
            </p>

            {isClient ? (
              <HeroBookingButton
                services={services ?? []}
                barbers={barbers}
                className={`${bebas.className} mt-7 inline-flex items-center gap-3 rounded-md bg-gradient-to-b from-[#dfb96f] to-[#b9863c] px-7 py-3.5 text-lg tracking-wide text-[#241a0a] shadow-lg shadow-black/30 transition-transform hover:scale-[1.02]`}
              />
            ) : (
              <Link
                href="/agendar"
                className={`${bebas.className} mt-7 inline-flex items-center gap-3 rounded-md bg-gradient-to-b from-[#dfb96f] to-[#b9863c] px-7 py-3.5 text-lg tracking-wide text-[#241a0a] shadow-lg shadow-black/30 transition-transform hover:scale-[1.02]`}
              >
                <CalendarDays className="size-5" />
                AGENDAR AGORA
              </Link>
            )}

            {nextAppointment && (
              <div className="mt-5 flex items-center gap-3 rounded-xl border border-[#c9a15a]/40 bg-[#c9a15a]/10 px-4 py-3.5">
                <CalendarCheck className="size-6 shrink-0 text-[#c9a15a]" />
                <p className="text-sm text-[#e7e0d2] sm:text-base">
                  Você tem um agendamento para{" "}
                  <span className={`${bebas.className} text-base tracking-wide text-[#f0e9da] sm:text-lg`}>
                    {format(new Date(nextAppointment.start_time), "EEEE, dd/MM 'às' HH:mm", { locale: ptBR })}
                  </span>
                  {nextAppointmentServiceLabel && (
                    <span className="text-[#c9a15a]"> · {nextAppointmentServiceLabel}</span>
                  )}
                </p>
              </div>
            )}
          </div>

          <HeroArt />
        </section>

        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <SectionHeading>COMO FUNCIONA</SectionHeading>
          <div className="flex flex-col items-stretch justify-center gap-8 sm:flex-row sm:items-start sm:gap-4 lg:gap-8">
            {STEPS.map((step, i) => (
              <div key={step.title} className="flex items-center gap-4 sm:items-start sm:gap-0">
                <div className="flex flex-1 flex-col items-center text-center sm:w-40 lg:w-48">
                  <div className="mb-4 flex size-16 items-center justify-center rounded-full border border-[#c9a15a]/50 bg-[#141110]">
                    <step.icon className="size-6 text-[#c9a15a]" />
                  </div>
                  <h3 className={`${bebas.className} text-sm tracking-[0.15em] text-[#f0e9da] sm:text-base`}>
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm text-[#9c9184]">{step.description}</p>
                </div>
                {i < STEPS.length - 1 && (
                  <ChevronRight className="mt-6 hidden size-5 shrink-0 text-[#c9a15a]/60 sm:block" />
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
          <SectionHeading>NOSSOS SERVIÇOS</SectionHeading>

          {services?.length ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((service) => (
                <div
                  key={service.id}
                  className="rounded-2xl border border-[#c9a15a]/25 bg-white/[0.02] px-6 py-5"
                >
                  <p className={`${bebas.className} text-lg tracking-wide text-[#f0e9da]`}>
                    {service.name}
                  </p>
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span className="text-[#9c9184]">{service.duration_minutes} min</span>
                    <span className="font-medium text-[#c9a15a]">
                      {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
                        service.price
                      )}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-[#c9a15a]/25 bg-white/[0.02] px-6 py-14 text-center">
              <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full border border-[#c9a15a]/40">
                <Scissors className="size-5 text-[#c9a15a]" />
              </div>
              <p className="text-[#f0e9da]">Nenhum serviço cadastrado ainda.</p>
              <p className="mt-1 text-sm text-[#c9a15a]">
                Em breve você verá todos os serviços disponíveis.
              </p>
            </div>
          )}
        </section>
      </main>

      <footer className="border-t border-white/10 py-8 text-center">
        <p className="flex items-center justify-center gap-2 text-xs tracking-[0.2em] text-[#c9a15a]">
          <Scissors className="size-3" /> GARAGEM PEQUENA, RESULTADO GRANDE
        </p>
        <p className="mt-2 text-xs text-[#7d7364]">
          © {new Date().getFullYear()} GARAGE BARBERSHOP. Todos os direitos reservados.
        </p>
      </footer>
    </div>
  );
}

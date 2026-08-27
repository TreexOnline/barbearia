import Link from "next/link";
import { Bebas_Neue } from "next/font/google";
import { requireClient } from "@/lib/auth";
import { BackButton } from "@/components/back-button";
import { Warehouse } from "lucide-react";

const bebas = Bebas_Neue({ weight: "400", subsets: ["latin"], display: "swap" });

export default async function ClienteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireClient();

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-[#080705] text-[#e7e0d2]">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-full border border-[#c9a15a]/60 bg-[#141110]">
              <Warehouse className="size-5 text-[#c9a15a]" />
            </div>
            <div className="leading-none">
              <div className={`${bebas.className} text-xl tracking-wide text-[#f0e9da]`}>GARAGE</div>
              <div className={`${bebas.className} text-[10px] tracking-[0.35em] text-[#c9a15a]`}>
                BARBERSHOP
              </div>
            </div>
          </Link>
          <BackButton href="/" className="text-[#e7e0d2]/80 hover:bg-white/10 hover:text-[#f0e9da]" />
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
    </div>
  );
}

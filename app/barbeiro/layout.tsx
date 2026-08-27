import { Bebas_Neue } from "next/font/google";
import { requireBarber } from "@/lib/auth";
import { AdminShell } from "@/components/admin-shell";
import { DarkScope } from "@/components/dark-scope";

const bebas = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-bebas",
});

export default async function BarbeiroLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile } = await requireBarber();

  return (
    <DarkScope>
      <div className={bebas.variable}>
        <AdminShell fullName={profile.full_name || "Barbeiro"} isAdmin={profile.is_admin}>
          {children}
        </AdminShell>
      </div>
    </DarkScope>
  );
}

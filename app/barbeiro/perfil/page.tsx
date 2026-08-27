import { requireBarber } from "@/lib/auth";
import { ProfileForm } from "./profile-form";

export default async function BarberPerfilPage() {
  const { profile } = await requireBarber();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Perfil</h1>
        <p className="text-muted-foreground">Atualize seus dados</p>
      </div>
      <ProfileForm
        fullName={profile.full_name}
        phone={profile.phone ?? ""}
        roleLabel={profile.is_admin ? "Administrador" : "Barbeiro"}
      />
    </div>
  );
}

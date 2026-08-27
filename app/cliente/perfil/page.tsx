import { requireClient } from "@/lib/auth";
import { ProfileForm } from "./profile-form";

export default async function PerfilPage() {
  const { profile } = await requireClient();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Perfil</h1>
        <p className="text-muted-foreground">Atualize seus dados de contato.</p>
      </div>
      <ProfileForm
        fullName={profile.full_name}
        phone={profile.phone ?? ""}
        birthDate={profile.birth_date}
      />
    </div>
  );
}

import { requireAdmin } from "@/lib/auth";
import { WhatsAppConnect } from "./whatsapp-connect";

export default async function WhatsAppPage() {
  await requireAdmin();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">WhatsApp</h1>
        <p className="text-muted-foreground">
          Conecte o número que vai enviar os avisos de agendamento pro barbeiro e pros clientes.
        </p>
      </div>

      <WhatsAppConnect />
    </div>
  );
}

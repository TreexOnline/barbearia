"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  checkWhatsAppStatusAction,
  generateWhatsAppQrAction,
  disconnectWhatsAppAction,
  type WhatsAppStatus,
} from "./actions";
import { CheckCircle2, QrCode, Smartphone, Unplug } from "lucide-react";

export function WhatsAppConnect() {
  const [status, setStatus] = useState<WhatsAppStatus | null>(null);
  const [pending, startTransition] = useTransition();
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function stopPolling() {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }

  useEffect(() => {
    startTransition(async () => {
      const result = await checkWhatsAppStatusAction();
      setStatus(result);
    });
    return stopPolling;
  }, []);

  function handleConnect() {
    startTransition(async () => {
      const result = await generateWhatsAppQrAction();
      setStatus(result);
      if (result.configured && result.state !== "open") {
        stopPolling();
        pollRef.current = setInterval(async () => {
          const check = await checkWhatsAppStatusAction();
          setStatus(check);
          if (check.configured && check.state === "open") {
            stopPolling();
            toast.success("WhatsApp conectado!");
          }
        }, 3000);
      }
    });
  }

  function handleDisconnect() {
    startTransition(async () => {
      const result = await disconnectWhatsAppAction();
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("WhatsApp desconectado");
      setStatus({ configured: true, state: "close" });
    });
  }

  if (!status) {
    return <p className="text-sm text-muted-foreground">Verificando conexão...</p>;
  }

  if (!status.configured) {
    return (
      <Card className="border-destructive/30">
        <CardContent className="py-4 text-sm text-muted-foreground">
          A Evolution API ainda não foi configurada neste projeto (faltam{" "}
          <code className="text-foreground">EVOLUTION_API_URL</code> e{" "}
          <code className="text-foreground">EVOLUTION_API_KEY</code> nas variáveis de ambiente).
        </CardContent>
      </Card>
    );
  }

  if (status.state === "open") {
    return (
      <Card className="border-primary/30">
        <CardContent className="flex items-center justify-between gap-3 py-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="size-6 text-primary" />
            <div>
              <p className="font-medium">WhatsApp conectado</p>
              <p className="text-sm text-muted-foreground">
                As notificações de agendamento estão sendo enviadas normalmente.
              </p>
            </div>
          </div>
          <Button type="button" variant="outline" size="sm" disabled={pending} onClick={handleDisconnect}>
            <Unplug className="size-4" />
            Desconectar
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-4 py-6 text-center">
        {status.qrCodeBase64 ? (
          <>
            <div className="rounded-xl border border-primary/30 bg-white p-3">
              <Image
                src={status.qrCodeBase64}
                alt="QR code do WhatsApp"
                width={220}
                height={220}
                unoptimized
              />
            </div>
            <p className="max-w-xs text-sm text-muted-foreground">
              Abra o WhatsApp no celular que vai enviar as notificações → Aparelhos conectados →
              Conectar um aparelho, e escaneie este código.
            </p>
            <Button type="button" variant="outline" size="sm" disabled={pending} onClick={handleConnect}>
              <QrCode className="size-4" />
              Gerar novo QR code
            </Button>
          </>
        ) : (
          <>
            <Smartphone className="size-10 text-muted-foreground" />
            <div>
              <p className="font-medium">WhatsApp não conectado</p>
              <p className="text-sm text-muted-foreground">
                Clique abaixo para gerar o QR code e conectar o número.
              </p>
            </div>
            <Button type="button" disabled={pending} onClick={handleConnect}>
              <QrCode className="size-4" />
              {pending ? "Gerando..." : "Conectar WhatsApp"}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

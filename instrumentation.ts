/**
 * O cálculo de horários (lib/availability.ts) e toda a formatação de datas
 * (dashboard, e-mails, WhatsApp) assumem que o processo roda no fuso da
 * barbearia. Sem isso, os slots são gerados no fuso do servidor (UTC na
 * Vercel) e não batem com os agendamentos gravados em UTC, deixando horários
 * já reservados aparecerem como livres.
 *
 * `register` roda uma vez por instância do servidor, antes de atender
 * qualquer request. O Node relê `process.env.TZ` ao reatribuí-lo, então isso
 * vale para todos os `Date` seguintes. Um `TZ` definido no ambiente (ex:
 * variável do projeto na Vercel) tem prioridade.
 */
export function register() {
  if (process.env.NEXT_RUNTIME === "nodejs" && !process.env.TZ) {
    process.env.TZ = "America/Sao_Paulo";
  }
}

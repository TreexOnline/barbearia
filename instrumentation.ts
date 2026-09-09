/**
 * O cálculo de horários (lib/availability.ts) e toda a formatação de datas
 * (dashboard, e-mails, WhatsApp) assumem que o processo roda no fuso da
 * barbearia. Sem isso, os slots são gerados no fuso do servidor e as
 * mensagens de confirmação mostram o horário em UTC (ex: agendamento às
 * 17:30 local aparece como "20:30" pro cliente), mesmo com os agendamentos
 * gravados corretamente no banco.
 *
 * A Vercel já define `TZ=UTC` por padrão em toda função Node — não é uma
 * escolha do projeto, é o default da plataforma — então checar `!process.env.TZ`
 * nunca pega essa correção. Por isso sobrescrevemos sempre, sem condicional.
 *
 * `register` roda uma vez por instância do servidor, antes de atender
 * qualquer request. O Node relê `process.env.TZ` ao reatribuí-lo, então isso
 * vale para todos os `Date` seguintes.
 */
export function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    process.env.TZ = "America/Sao_Paulo";
  }
}

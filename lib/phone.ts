/**
 * Normaliza para o formato que o Supabase Auth usa em auth.users.phone:
 * apenas dígitos, com DDI (sem "+"). Ex.: "(11) 99999-9999" -> "5511999999999".
 */
export function normalizeAuthPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.startsWith("55") ? digits : `55${digits}`;
}

const DATE_RE = /^(\d{2})\/(\d{2})\/(\d{4})$/;

/** Converte "DD/MM/AAAA" em "AAAA-MM-DD" (formato do Postgres). Null se inválido. */
export function birthDateToISO(ddmmyyyy: string): string | null {
  const match = ddmmyyyy.match(DATE_RE);
  if (!match) return null;
  const [, dd, mm, yyyy] = match;
  const day = Number(dd);
  const month = Number(mm);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return `${yyyy}-${mm}-${dd}`;
}

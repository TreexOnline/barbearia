/**
 * Cookies de sessão de longa duração (1 ano) para o usuário continuar
 * logado mesmo fechando e voltando ao site — o token é renovado a cada
 * visita, então a expiração vai sempre "escorregando" para frente.
 */
export const AUTH_COOKIE_OPTIONS = {
  maxAge: 60 * 60 * 24 * 365,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

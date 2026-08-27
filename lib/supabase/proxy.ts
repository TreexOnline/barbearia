import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/database.types";
import { AUTH_COOKIE_OPTIONS } from "./cookie-options";

const CLIENT_PREFIX = "/cliente";
const BARBER_PREFIX = "/barbeiro";
const ADMIN_ONLY_PATHS = [
  "/barbeiro/servicos",
  "/barbeiro/equipe",
  "/barbeiro/usuarios",
  "/barbeiro/lucros",
  "/barbeiro/configuracoes",
];

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: AUTH_COOKIE_OPTIONS,
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isClientArea = pathname.startsWith(CLIENT_PREFIX);
  const isBarberArea = pathname.startsWith(BARBER_PREFIX);

  if (!user && (isClientArea || isBarberArea)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (user && (isClientArea || isBarberArea)) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, is_admin")
      .eq("id", user.id)
      .single();

    if (isClientArea && profile?.role !== "client") {
      const url = request.nextUrl.clone();
      url.pathname = "/barbeiro/dashboard";
      return NextResponse.redirect(url);
    }

    if (isBarberArea && profile?.role !== "barber") {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }

    if (ADMIN_ONLY_PATHS.some((p) => pathname.startsWith(p)) && !profile?.is_admin) {
      const url = request.nextUrl.clone();
      url.pathname = "/barbeiro/dashboard";
      return NextResponse.redirect(url);
    }
  }

  return response;
}

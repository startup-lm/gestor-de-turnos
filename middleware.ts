import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  let user = null;
  try {
    // Importante: No uses `getSession` ya que puede ser vulnerable o devolver tokens expirados.
    // `getUser` es la forma recomendada por Supabase para validar de forma segura en el servidor.
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch (error) {
    console.error("Middleware Auth Error:", error);
  }

  // Si intenta acceder a /admin o /dashboard y no está logueado, redirigir al home
  const pathname = request.nextUrl.pathname;
  const isProtectedPath = pathname === "/admin" || pathname.startsWith("/admin/") || pathname === "/dashboard" || pathname.startsWith("/dashboard/");

  if (isProtectedPath && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/admin",
    "/admin/:path*",
    "/dashboard",
    "/dashboard/:path*",
  ],
};

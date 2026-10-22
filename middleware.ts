import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { userIsCommunityLead } from "@/lib/auth/community-lead";
import { matchesLeadToken } from "@/lib/auth/lead-token";

const PROTECTED = ["/queue", "/dashboard", "/settings"];

function isProtected(pathname: string): boolean {
  return PROTECTED.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

function loginRedirect(request: NextRequest, sessionResponse: NextResponse) {
  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = "/login";
  redirectUrl.search = "";
  const redirect = NextResponse.redirect(redirectUrl);
  sessionResponse.cookies.getAll().forEach((cookie) => {
    redirect.cookies.set(cookie.name, cookie.value);
  });
  return redirect;
}

export async function middleware(request: NextRequest) {
  const protectedPath = isProtected(request.nextUrl.pathname);
  const cookieLead = matchesLeadToken(request.cookies.get("gk_lead")?.value);
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    if (protectedPath && !cookieLead) return loginRedirect(request, NextResponse.next());
    return NextResponse.next();
  }

  let supabaseResponse = NextResponse.next({ request });
  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  let userId: string | null = null;
  try {
    const { data } = await supabase.auth.getUser();
    userId = data.user?.id ?? null;
  } catch (error) {
    console.error("session refresh failed", error);
  }

  if (!protectedPath || cookieLead) return supabaseResponse;
  if (userId && (await userIsCommunityLead(supabase, userId))) return supabaseResponse;
  return loginRedirect(request, supabaseResponse);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

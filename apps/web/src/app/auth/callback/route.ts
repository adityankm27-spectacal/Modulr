import { NextResponse, type NextRequest } from "next/server";
import { safeNextPath } from "@/lib/redirect";
import { createClient } from "@/lib/supabase/server";

/** OAuth (Google) return URL: exchanges the code for a session cookie. */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const next = safeNextPath(searchParams.get("next"));
  const code = searchParams.get("code");

  if (searchParams.get("error")) {
    return NextResponse.redirect(
      new URL(`/sign-in?error=oauth&next=${encodeURIComponent(next)}`, origin),
    );
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, origin));
  }

  return NextResponse.redirect(
    new URL(`/sign-in?error=callback&next=${encodeURIComponent(next)}`, origin),
  );
}

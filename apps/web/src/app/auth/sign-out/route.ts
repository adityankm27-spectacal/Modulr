import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST only, so links and prefetches can't sign people out.
 * scope=local signs out this device; scope=global signs out every device.
 */
export async function POST(request: NextRequest) {
  const form = await request.formData();
  const scope = form.get("scope") === "global" ? "global" : "local";

  const supabase = await createClient();
  await supabase.auth.signOut({ scope });

  return NextResponse.redirect(new URL("/", request.nextUrl.origin), { status: 303 });
}

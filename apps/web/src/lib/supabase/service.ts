import "server-only";
import type { Database } from "@modulr/shared";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { supabaseConfig } from "@/lib/env";

/**
 * Service-role client: bypasses RLS. Only for server code with no end user,
 * such as provider webhooks. Never import it into code reachable by a browser.
 */
export function createServiceClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set.");
  return createSupabaseClient<Database>(supabaseConfig().url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

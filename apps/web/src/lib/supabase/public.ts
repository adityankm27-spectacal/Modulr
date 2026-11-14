import "server-only";
import type { Database } from "@modulr/shared";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { supabaseConfig } from "@/lib/env";

/**
 * Anonymous client with no cookies, for public data that is the same for every
 * visitor (plans, site settings). Because it doesn't depend on who is asking,
 * its results can be cached and shared between requests. RLS still applies.
 */
export function createPublicClient() {
  const { url, anonKey } = supabaseConfig();
  return createSupabaseClient<Database>(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

import type { Database } from "@modulr/shared";
import { createBrowserClient } from "@supabase/ssr";
import { supabaseConfig } from "@/lib/env";

/** Supabase client for Client Components (sign-in form). */
export function createClient() {
  const { url, anonKey } = supabaseConfig();
  return createBrowserClient<Database>(url, anonKey);
}

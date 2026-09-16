import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase is configured through `NEXT_PUBLIC_*` environment variables, which
 * Next.js inlines into the bundle during `next build`. Creating the client at
 * module scope therefore made the whole build fail with
 * "supabaseUrl is required." whenever those variables were not present in the
 * build environment (fresh clone, preview deploy, Vercel project without them).
 *
 * The client is created lazily instead, so building never depends on Supabase
 * being configured.
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
      throw new Error(
        "Supabase is not configured — set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
      );
    }

    client = createClient(url, key);
  }

  return client;
}

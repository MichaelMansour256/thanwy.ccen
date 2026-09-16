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
/**
 * Supabase is configured through `NEXT_PUBLIC_*` environment variables, which
 * Next.js inlines into the bundle during `next build`. Creating the client at
 * module scope therefore made the whole build fail with
 * "supabaseUrl is required." whenever those variables were not present in the
 * build environment (fresh clone, preview deploy, Vercel project without them).
 *
 * The client is created lazily instead, so building never depends on Supabase
 * being configured.
 *
 * Key naming: Supabase publishes the public key under two names — the classic
 * `NEXT_PUBLIC_SUPABASE_ANON_KEY` and the newer
 * `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (the name the Supabase↔Vercel
 * integration manages). Either works.
 */
function supabaseKey(): string | undefined {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    undefined
  );
}

export function isSupabaseConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && supabaseKey());
}

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = supabaseKey();

    if (!url || !key) {
      throw new Error(
        "Supabase is not configured — set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)."
      );
    }

    client = createClient(url, key);
  }

  return client;
}

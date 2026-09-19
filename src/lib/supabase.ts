import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase is configured through environment variables.
 *
 * `NEXT_PUBLIC_SUPABASE_*` vars are inlined at build time by Next.js. If a
 * production build (`next build`) runs without them, the inlined value is
 * `undefined` and the running `next start` process can **never** recover —
 * even if `.env` is fixed afterward. This was the root cause of the
 * "Service temporarily unavailable — please try again later" (HTTP 503) error
 * that appeared in the Prayer Wall when a stale production build lacked the
 * Supabase credentials.
 *
 * To prevent stale-production-build 503s, this module also checks the
 * non-prefixed `SUPABASE_URL` / `SUPABASE_ANON_KEY` environment variables.
 * Those are read at **runtime** (from `.env`, the shell, or the deployment
 * platform) and are NOT inlined into the bundle, so a missing `NEXT_PUBLIC_*`
 * value can be rescued by the runtime value without rebuilding.
 *
 * The non-prefixed vars are safe here because this module is only imported by
 * server-side API routes — no client code imports it.
 */

/**
 * Key naming: Supabase publishes the public (anon) key under two names — the
 * classic `*_ANON_KEY` and the newer `*_PUBLISHABLE_KEY`. We accept both
 * prefixes (`NEXT_PUBLIC_` and plain).
 */
function supabaseKey(): string | undefined {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    undefined
  );
}

function supabaseUrl(): string | undefined {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    undefined
  );
}

export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl() && supabaseKey());
}

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!client) {
    const url = supabaseUrl();
    const key = supabaseKey();

    if (!url || !key) {
      throw new Error(
        "Supabase is not configured — set NEXT_PUBLIC_SUPABASE_URL and " +
          "NEXT_PUBLIC_SUPABASE_ANON_KEY (or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) " +
          "in your environment, or the non-prefixed SUPABASE_URL / SUPABASE_ANON_KEY aliases."
      );
    }

    client = createClient(url, key);
  }

  return client;
}

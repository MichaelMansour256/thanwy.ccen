import "server-only";
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

/** Accept current `sb_secret_…` keys and legacy service_role JWTs. */
function isValidServiceSecret(candidate: string): boolean {
  if (candidate.startsWith("sb_secret_")) return true;
  const parts = candidate.split(".");
  if (parts.length !== 3) return false;
  try {
    const payload = JSON.parse(
      Buffer.from(
        parts[1].replace(/-/g, "+").replace(/_/g, "/"),
        "base64"
      ).toString("utf8")
    ) as { role?: unknown };
    return payload.role === "service_role";
  } catch {
    return false;
  }
}

export function isSupabaseAdminConfigured(): boolean {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  return Boolean(supabaseUrl() && key && isValidServiceSecret(key));
}

let adminClient: SupabaseClient | null = null;

/**
 * Server-only service client for protected operations. This deliberately
 * fails closed instead of falling back to a public key.
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (!adminClient) {
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
    if (!key || !isValidServiceSecret(key)) {
      throw new Error(
        "Supabase service access is not configured — set a valid server-only " +
          "SUPABASE_SERVICE_ROLE_KEY (service_role JWT or sb_secret_… key)."
      );
    }
    const url = supabaseUrl();
    if (!url) {
      throw new Error(
        "Supabase is not configured — set NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL."
      );
    }
    adminClient = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return adminClient;
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

    client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  return client;
}

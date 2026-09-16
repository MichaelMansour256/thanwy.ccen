// Verifies the Supabase integration end-to-end against the REAL database:
//   1. credentials present in .env / .env.local
//   2. prayer_requests insert as anon (what POST /api/prayer does)
//   3. read-back of the inserted row
//   4. cleanup (delete) of the diagnostic row
// Prints only masked info — never keys or user data.
import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

function readEnvFile(file) {
  if (!fs.existsSync(file)) return {};
  const out = {};
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m) out[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
  }
  return out;
}

const env = { ...readEnvFile(".env"), ...readEnvFile(".env.local") };
const url = env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log("supabase_url :", url ? `set (${url.replace(/^https:\/\/(.+)\.supabase\.co$/, "$1…")} — length ${url.length})` : "MISSING");
console.log("anon_key     :", key ? `set (${key.length} chars)` : "MISSING");

if (!url || !key) {
  console.error("-> Cannot test: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  process.exit(1);
}

const supabase = createClient(url, key);
const marker = `diagnostic-${Date.now()}`;

// 1. INSERT — exactly what POST /api/prayer does
const { data: inserted, error: insertError } = await supabase
  .from("prayer_requests")
  .insert({ name: "diagnostic", request: marker, status: "pending" })
  .select()
  .single();

if (insertError) {
  console.error("INSERT FAILED —", insertError.message, `(code: ${insertError.code ?? "n/a"})`);
  if (/row-level security/i.test(insertError.message)) {
    console.error("-> RLS is blocking anon inserts. Run supabase-setup.sql in the Supabase SQL Editor.");
  }
  process.exit(1);
}
console.log("INSERT OK    — id", inserted.id, "| status:", inserted.status);

// 2. READ-BACK — what GET /api/admin/prayer does
const { data: rows, error: selectError } = await supabase
  .from("prayer_requests")
  .select("*")
  .eq("request", marker);

if (selectError) {
  console.error("SELECT FAILED —", selectError.message, `(code: ${selectError.code ?? "n/a"})`);
  process.exit(1);
}
console.log(`SELECT OK    — found ${rows.length} row(s)`);

// 3. CLEANUP — what DELETE /api/admin/prayer does
const { error: deleteError } = await supabase
  .from("prayer_requests")
  .delete()
  .eq("id", inserted.id);

if (deleteError) {
  console.error("DELETE FAILED —", deleteError.message, "(diagnostic row left in table!)");
  process.exit(1);
}
console.log("DELETE OK    — diagnostic row removed");
console.log("\nALL SUPABASE CHECKS PASSED ✅");

import { NextResponse } from "next/server";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";

export async function POST(req: Request) {
  let body: { id?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const { id } = body;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
  }

  // Fetch current count first
  const { data, error: fetchError } = await getSupabase()
    .from("prayer_requests")
    .select("pray_count")
    .eq("id", id)
    .eq("status", "approved")
    .single();

  if (fetchError || !data) {
    // PGRST116 = no rows matched (unknown id). Anything else is a real failure.
    if (fetchError && fetchError.code !== "PGRST116") {
      console.error("Supabase SELECT prayer_requests (pray) failed:", { code: fetchError.code, message: fetchError.message });
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { error } = await getSupabase()
    .from("prayer_requests")
    .update({ pray_count: data.pray_count + 1 })
    .eq("id", id)
    .eq("status", "approved");

  if (error) {
    console.error("Supabase UPDATE prayer_requests (pray) failed:", { code: error.code, message: error.message });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ pray_count: data.pray_count + 1 });
}

import { NextResponse } from "next/server";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
  }

  const { data, error } = await getSupabase()
    .from("prayer_requests")
    .select("id, name, request, pray_count, created_at")
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Supabase GET prayer_requests failed:", { code: error.code, message: error.message });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  let body: { name?: string; request?: string };
  try {
    body = await req.json();
  } catch {
    // Malformed JSON used to crash this handler with an empty 500.
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const request = body.request?.trim();
  if (!request) return NextResponse.json({ error: "Request is required" }, { status: 400 });

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
  }

  const { error } = await getSupabase().from("prayer_requests").insert({
    name: body.name?.trim() || "مجهول",
    request,
    status: "pending",
  });

  if (error) {
    console.error("Supabase INSERT prayer_requests failed:", { code: error.code, message: error.message });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}

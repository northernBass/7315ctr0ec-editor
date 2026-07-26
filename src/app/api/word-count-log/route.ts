import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireAuth, pick, dbError } from "@/lib/auth";

const WORD_COUNT_FIELDS = ["date", "count", "manuscript_id"];

export async function GET(req: NextRequest) {
  const denied = await requireAuth(req); if (denied) return denied;
  const { searchParams } = new URL(req.url);
  const manuscriptId = searchParams.get("manuscript_id");

  const { data, error } = await supabaseAdmin
    .from("word_count_log")
    .select("*")
    .eq("manuscript_id", manuscriptId)
    .order("date", { ascending: false })
    .limit(30);

  if (error) return dbError(error);
  return NextResponse.json({ data });
}

export async function PUT(req: NextRequest) {
  const denied = await requireAuth(req); if (denied) return denied;
  const body = pick(await req.json(), WORD_COUNT_FIELDS);
  const { error } = await supabaseAdmin
    .from("word_count_log")
    .upsert(body, { onConflict: "date,manuscript_id" });
  if (error) return dbError(error);
  return NextResponse.json({ ok: true });
}

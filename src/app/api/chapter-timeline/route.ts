import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireAuth, pick, dbError } from "@/lib/auth";

const TIMELINE_FIELDS = ["chapter_id", "manuscript_id", "summary", "notes", "tags"];

export async function GET(req: NextRequest) {
  const denied = await requireAuth(req); if (denied) return denied;
  const { searchParams } = new URL(req.url);
  const manuscriptId = searchParams.get("manuscript_id");

  const { data, error } = await supabaseAdmin
    .from("chapter_timeline")
    .select("*")
    .eq("manuscript_id", manuscriptId);

  if (error) return dbError(error);
  return NextResponse.json({ data });
}

export async function PUT(req: NextRequest) {
  const denied = await requireAuth(req); if (denied) return denied;
  const body = pick(await req.json(), TIMELINE_FIELDS);
  const { error } = await supabaseAdmin
    .from("chapter_timeline")
    .upsert(body, { onConflict: "chapter_id" });
  if (error) return dbError(error);
  return NextResponse.json({ ok: true });
}

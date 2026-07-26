import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireAuth, pick, dbError } from "@/lib/auth";

const CHAPTER_CREATE_FIELDS = ["title", "content", "position", "deleted_at", "manuscript_id"];

export async function GET(req: NextRequest) {
  const denied = await requireAuth(req); if (denied) return denied;
  const { searchParams } = new URL(req.url);
  const manuscriptId = searchParams.get("manuscript_id");
  const activeOnly = searchParams.get("active") === "true";
  const selectFields = searchParams.get("select") || "*";

  let query = supabaseAdmin
    .from("chapters")
    .select(selectFields)
    .eq("manuscript_id", manuscriptId)
    .order("position");

  if (activeOnly) query = query.is("deleted_at", null);

  const { data, error } = await query;
  if (error) return dbError(error);
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const denied = await requireAuth(req); if (denied) return denied;
  const fields = pick(await req.json(), CHAPTER_CREATE_FIELDS);
  const { data, error } = await supabaseAdmin
    .from("chapters")
    .insert(fields)
    .select()
    .single();
  if (error) return dbError(error);
  return NextResponse.json({ data });
}

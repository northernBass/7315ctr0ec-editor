import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireAuth, pick, dbError } from "@/lib/auth";

const CHARACTER_CREATE_FIELDS = ["name", "age", "appearance", "history", "role", "arc", "photo_url", "deleted_at", "manuscript_id"];

export async function GET(req: NextRequest) {
  const denied = await requireAuth(req); if (denied) return denied;
  const { searchParams } = new URL(req.url);
  const manuscriptId = searchParams.get("manuscript_id");

  const { data, error } = await supabaseAdmin
    .from("characters")
    .select("*")
    .eq("manuscript_id", manuscriptId)
    .order("created_at");

  if (error) return dbError(error);
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const denied = await requireAuth(req); if (denied) return denied;
  const fields = pick(await req.json(), CHARACTER_CREATE_FIELDS);
  const { data, error } = await supabaseAdmin
    .from("characters")
    .insert(fields)
    .select()
    .single();
  if (error) return dbError(error);
  return NextResponse.json({ data });
}

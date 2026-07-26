import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireAuth, pick, dbError } from "@/lib/auth";

const MANUSCRIPT_FIELDS = ["title", "author", "cover_url", "status", "deleted_at"];

export async function GET(req: NextRequest) {
  const denied = await requireAuth(req); if (denied) return denied;
  const { data, error } = await supabaseAdmin
    .from("manuscripts")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) return dbError(error);
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const denied = await requireAuth(req); if (denied) return denied;
  const fields = pick(await req.json(), MANUSCRIPT_FIELDS);
  const { data, error } = await supabaseAdmin
    .from("manuscripts")
    .insert(fields)
    .select()
    .single();
  if (error) return dbError(error);
  return NextResponse.json({ data });
}

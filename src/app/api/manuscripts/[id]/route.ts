import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireAuth, pick, dbError } from "@/lib/auth";

const MANUSCRIPT_FIELDS = ["title", "author", "cover_url", "status", "deleted_at"];

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const denied = await requireAuth(req); if (denied) return denied;
  const { data, error } = await supabaseAdmin
    .from("manuscripts")
    .select("*")
    .eq("id", params.id)
    .single();
  if (error) return dbError(error);
  return NextResponse.json({ data });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const denied = await requireAuth(req); if (denied) return denied;
  const fields = pick(await req.json(), MANUSCRIPT_FIELDS);
  const { data, error } = await supabaseAdmin
    .from("manuscripts")
    .update(fields)
    .eq("id", params.id)
    .select()
    .single();
  if (error) return dbError(error);
  return NextResponse.json({ data });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const denied = await requireAuth(req); if (denied) return denied;
  const { error } = await supabaseAdmin
    .from("manuscripts")
    .delete()
    .eq("id", params.id);
  if (error) return dbError(error);
  return NextResponse.json({ ok: true });
}

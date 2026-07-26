import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireAuth, pick, dbError } from "@/lib/auth";

const CHAPTER_UPDATE_FIELDS = ["title", "content", "position", "deleted_at"];

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const denied = await requireAuth(req); if (denied) return denied;
  const fields = pick(await req.json(), CHAPTER_UPDATE_FIELDS);
  const { data, error } = await supabaseAdmin
    .from("chapters")
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
    .from("chapters")
    .delete()
    .eq("id", params.id);
  if (error) return dbError(error);
  return NextResponse.json({ ok: true });
}

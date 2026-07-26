import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireAuth, pick, dbError } from "@/lib/auth";

const CHARACTER_UPDATE_FIELDS = ["name", "age", "appearance", "history", "role", "arc", "photo_url", "deleted_at"];

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const denied = await requireAuth(req); if (denied) return denied;
  const fields = pick(await req.json(), CHARACTER_UPDATE_FIELDS);
  const { error } = await supabaseAdmin
    .from("characters")
    .update(fields)
    .eq("id", params.id);
  if (error) return dbError(error);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const denied = await requireAuth(req); if (denied) return denied;
  const { error } = await supabaseAdmin
    .from("characters")
    .delete()
    .eq("id", params.id);
  if (error) return dbError(error);
  return NextResponse.json({ ok: true });
}

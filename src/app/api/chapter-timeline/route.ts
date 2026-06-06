import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const manuscriptId = searchParams.get("manuscript_id");

  const { data, error } = await supabaseAdmin
    .from("chapter_timeline")
    .select("*")
    .eq("manuscript_id", manuscriptId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { error } = await supabaseAdmin
    .from("chapter_timeline")
    .upsert(body, { onConflict: "chapter_id" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

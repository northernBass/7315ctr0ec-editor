import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const manuscriptId = searchParams.get("manuscript_id");

  const { data, error } = await supabaseAdmin
    .from("characters")
    .select("*")
    .eq("manuscript_id", manuscriptId)
    .order("created_at");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const fields = await req.json();
  const { data, error } = await supabaseAdmin
    .from("characters")
    .insert(fields)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

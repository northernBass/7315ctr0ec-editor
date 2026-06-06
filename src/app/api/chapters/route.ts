import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(req: NextRequest) {
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
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const fields = await req.json();
  const { data, error } = await supabaseAdmin
    .from("chapters")
    .insert(fields)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

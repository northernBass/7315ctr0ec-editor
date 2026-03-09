import { NextRequest, NextResponse } from "next/server";
import htmlDocx from "html-docx-js";

export async function POST(req: NextRequest) {
  const { html } = await req.json();

  const fullHtml = `
    <!DOCTYPE html><html><head><meta charset="utf-8">
    <style>
      body { font-family: Georgia, serif; font-size: 12pt; line-height: 1.8; margin: 1in; }
      h1 { font-size: 18pt; font-weight: bold; margin-top: 2em; margin-bottom: 0.5em; }
      h2 { font-size: 14pt; font-weight: bold; margin-top: 1.5em; }
      h3 { font-size: 12pt; font-weight: bold; margin-top: 1em; }
      blockquote { margin-left: 1em; border-left: 3px solid #ccc; padding-left: 1em; font-style: italic; }
      code { font-family: "Courier New", monospace; font-size: 10pt; background: #f4f4f4; padding: 2px 4px; }
      p { margin-bottom: 0.8em; }
    </style></head><body>${html}</body></html>`;

  const blob: Blob = htmlDocx.asBlob(fullHtml);
  const arrayBuffer = await blob.arrayBuffer();

  return new NextResponse(arrayBuffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": 'attachment; filename="manuscript.docx"',
    },
  });
}
import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

// Defense-in-depth: verify the auth JWT inside each API route, so a middleware
// bypass (e.g. CVE-2025-29927) does not by itself grant database access.
// Returns a 401 response to short-circuit the handler, or null when authorized.
export async function requireAuth(req: NextRequest): Promise<NextResponse | null> {
  const token = req.cookies.get("auth")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    await jwtVerify(token, secret);
    return null;
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

// Allow-list an incoming body to a known set of columns before writing to the
// database — blocks mass assignment (spoofing id/timestamps, reparenting rows).
export function pick(body: Record<string, unknown>, keys: string[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(body, key)) out[key] = body[key];
  }
  return out;
}

// Log the real error server-side, return a generic message to the client so we
// don't leak Supabase schema details.
export function dbError(error: unknown): NextResponse {
  console.error(error);
  return NextResponse.json({ error: "Request failed" }, { status: 500 });
}

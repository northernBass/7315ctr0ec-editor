import { NextRequest, NextResponse } from "next/server";
import { SignJWT } from "jose";
import { createHash, timingSafeEqual } from "crypto";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const MAX_ATTEMPTS = 8;
const WINDOW_MS = 15 * 60 * 1000; // rolling window for counting attempts
const LOCK_MS = 15 * 60 * 1000;   // lockout duration once the cap is hit

// Constant-time comparison over equal-length SHA-256 digests (no length leak).
function constantTimeEqual(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

function clientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  return fwd ? fwd.split(",")[0].trim() : "unknown";
}

// Every limiter helper FAILS OPEN: if the login_attempts table is missing or the
// DB errors, we log and proceed with normal auth rather than lock the user out.
async function checkLock(ip: string): Promise<{ locked: boolean; row: any }> {
  try {
    const { data, error } = await supabaseAdmin
      .from("login_attempts")
      .select("*")
      .eq("ip", ip)
      .maybeSingle();
    if (error) { console.error(error); return { locked: false, row: null }; }
    const locked = !!data?.locked_until && new Date(data.locked_until).getTime() > Date.now();
    return { locked, row: data ?? null };
  } catch (e) {
    console.error(e);
    return { locked: false, row: null };
  }
}

async function recordFailure(ip: string, row: any): Promise<void> {
  try {
    const now = Date.now();
    const prevStart = row?.window_start ? new Date(row.window_start).getTime() : now;
    const inWindow = now - prevStart < WINDOW_MS;
    const attempts = (inWindow ? (row?.attempts ?? 0) : 0) + 1;
    await supabaseAdmin.from("login_attempts").upsert({
      ip,
      attempts,
      window_start: inWindow && row?.window_start ? row.window_start : new Date(now).toISOString(),
      locked_until: attempts >= MAX_ATTEMPTS ? new Date(now + LOCK_MS).toISOString() : null,
    }, { onConflict: "ip" });
  } catch (e) {
    console.error(e);
  }
}

async function clearAttempts(ip: string): Promise<void> {
  try {
    await supabaseAdmin.from("login_attempts").delete().eq("ip", ip);
  } catch (e) {
    console.error(e);
  }
}

export async function POST(req: NextRequest) {
  const ip = clientIp(req);

  const { locked, row } = await checkLock(ip);
  if (locked) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }

  const { password } = await req.json();
  const expected = process.env.APP_PASSWORD ?? "";

  if (!password || !constantTimeEqual(String(password), expected)) {
    await recordFailure(ip, row);
    await new Promise((r) => setTimeout(r, 700)); // slow automated guessing
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await clearAttempts(ip);

  const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
  const token = await new SignJWT({ auth: true })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("30d")
    .sign(secret);

  const res = NextResponse.json({ ok: true });
  res.cookies.set("auth", token, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: "/",
  });
  return res;
}

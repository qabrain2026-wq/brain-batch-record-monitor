import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { createSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const username = String(form.get("username") ?? "").trim();
  const password = String(form.get("password") ?? "");
  const next = String(form.get("next") ?? "/");

  const fail = () =>
    NextResponse.redirect(
      new URL(`/login?error=1&next=${encodeURIComponent(next)}`, req.url),
      { status: 303 }
    );

  if (!username || !password) return fail();

  const user = await prisma.user.findUnique({ where: { username } });
  if (!user || !user.active) return fail();

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return fail();

  await createSession(user.id);

  return NextResponse.redirect(new URL(next || "/", req.url), { status: 303 });
}

import { cookies } from "next/headers";
import crypto from "node:crypto";
import { prisma } from "@/lib/db";

const COOKIE_NAME = "brain_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 12; // 12시간

export type SessionUser = {
  id: string;
  username: string;
  displayName: string;
  role: "admin" | "viewer";
  teamId: string | null;
};

export async function createSession(userId: string) {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await prisma.session.create({
    data: { token, userId, expiresAt }
  });

  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt
  });
}

export async function destroySession() {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { token } }).catch(() => undefined);
  }
  cookies().delete(COOKIE_NAME);
}

export async function getSession(): Promise<SessionUser | null> {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true }
  });

  if (!session || session.expiresAt < new Date() || !session.user.active) {
    return null;
  }

  return {
    id: session.user.id,
    username: session.user.username,
    displayName: session.user.displayName,
    role: session.user.role as "admin" | "viewer",
    teamId: session.user.teamId
  };
}

export async function requireAdmin(): Promise<SessionUser | null> {
  const session = await getSession();
  if (!session || session.role !== "admin") return null;
  return session;
}

import "server-only";
import { cookies } from "next/headers";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { db } from "./db";
import type { Viewer } from "./types";
export const hashToken = (v: string) =>
  createHash("sha256").update(v).digest("hex");
export const token = () => randomBytes(32).toString("hex");
export function sameSecret(a: string, b: string) {
  const aa = Buffer.from(a),
    bb = Buffer.from(b);
  return aa.length === bb.length && timingSafeEqual(aa, bb);
}
export async function currentUser(): Promise<Viewer | null> {
  if (!process.env.DATABASE_URL) return null;
  const t = (await cookies()).get("gm_session")?.value;
  if (!t) return null;
  const session = await db().session.findUnique({
    where: { tokenHash: hashToken(t) },
    include: { user: true },
  });
  if (!session || session.expiresAt < new Date()) return null;
  const u = session.user;
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role as Viewer["role"],
    customerId: u.customerId || undefined,
    workspaceId: u.workspaceId,
  };
}
export async function requireUser() {
  const u = await currentUser();
  if (!u) throw new Error("Please sign in to continue.");
  return u;
}
export async function newSession(userId: string) {
  const t = token();
  await db().session.create({
    data: {
      tokenHash: hashToken(t),
      userId,
      expiresAt: new Date(Date.now() + 7 * 86400000),
    },
  });
  (await cookies()).set("gm_session", t, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 86400,
  });
}
export function checkOrigin(req: Request) {
  const origin = req.headers.get("origin");
  if (!origin || origin !== new URL(req.url).origin)
    throw new Error(
      "This request could not be verified. Refresh the page and try again.",
    );
}
export function apiError(e: unknown) {
  const message = e instanceof Error ? e.message : "Something went wrong.";
  const safe = /Prisma|database|connect|ECONN|fetch failed/i.test(message)
    ? "The database could not be reached. Check the connection and try again."
    : message;
  return Response.json(
    { error: safe },
    {
      status: /sign in/.test(message)
        ? 401
        : /access|Only an admin|verified/.test(message)
          ? 403
          : 400,
    },
  );
}
export function passwordValid(password: string) {
  return (
    password.length > 8 &&
    password.length <= 128 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[^a-zA-Z0-9]/.test(password)
  );
}

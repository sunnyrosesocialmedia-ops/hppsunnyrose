import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, signAdminToken, verifyAdminToken } from "./jwt";

export async function createAdminSession(adminId: string, email: string) {
  const token = await signAdminToken(adminId, email);
  cookies().set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export function clearAdminSession() {
  cookies().delete(SESSION_COOKIE_NAME);
}

export async function getAdminSession() {
  const token = cookies().get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyAdminToken(token);
}

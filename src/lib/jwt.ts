import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE_NAME = "admin_session";
const alg = "HS256";

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET belum diset di environment");
  return new TextEncoder().encode(secret);
}

export async function signAdminToken(adminId: string, email: string) {
  return new SignJWT({ sub: adminId, email })
    .setProtectedHeader({ alg })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());
}

export async function verifyAdminToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return { id: payload.sub as string, email: payload.email as string };
  } catch {
    return null;
  }
}

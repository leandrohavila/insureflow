import { SESSION_MAX_AGE_SECONDS } from "./constants"

export function getAuthSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET
  if (!secret || secret.length < 32) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("AUTH_SECRET must be set (min. 32 characters) in production")
    }
    return new TextEncoder().encode("insureflow-dev-secret-change-in-production-32ch")
  }
  return new TextEncoder().encode(secret)
}

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_MAX_AGE_SECONDS,
}

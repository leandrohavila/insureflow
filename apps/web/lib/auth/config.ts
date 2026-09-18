import { SESSION_MAX_AGE_SECONDS } from "./constants"

const DEV_FALLBACK_SECRET = "insureflow-dev-secret-change-in-production-32ch"

function isNextProductionBuild() {
  return (
    process.env.NEXT_PHASE === "phase-production-build" ||
    process.env.NEXT_PHASE === "phase-export"
  )
}

export function getAuthSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET
  if (!secret || secret.length < 32) {
    if (process.env.NODE_ENV === "production" && !isNextProductionBuild()) {
      throw new Error("AUTH_SECRET must be set (min. 32 characters) in production")
    }
    return new TextEncoder().encode(DEV_FALLBACK_SECRET)
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

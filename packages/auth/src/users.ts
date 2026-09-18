import bcrypt from "bcryptjs"

import type { AuthUser, SessionUser } from "./types"
import { ROLE_LABELS } from "./roles"

export const DEMO_USERS: AuthUser[] = [
  {
    id: "usr_admin",
    email: "admin@insureflow.com",
    name: "Ana Costa",
    initials: "AC",
    role: "admin",
    roleLabel: ROLE_LABELS.admin,
    organizationId: "org_insureflow",
    organizationName: "InsureFlow Corp",
    title: "Head of Operations",
    passwordHash: "$2b$10$RV5fA8fs7PReXxA3nSix2.odL47JNWpWzqRrF84BvWB43cWgBN126",
  },
  {
    id: "usr_viewer",
    email: "viewer@insureflow.com",
    name: "Carlos Viewer",
    initials: "CV",
    role: "viewer",
    roleLabel: ROLE_LABELS.viewer,
    organizationId: "org_insureflow",
    organizationName: "InsureFlow Corp",
    title: "Auditoria",
    passwordHash: "$2b$10$F8YkQzgvqNkHGaQSbjvp8.b/lLTbfyGfC2wrUAKvfpBIaQezBrnrO",
  },
  {
    id: "usr_sales",
    email: "sales@insureflow.com",
    name: "Sofia Sales",
    initials: "SS",
    role: "sales",
    roleLabel: ROLE_LABELS.sales,
    organizationId: "org_insureflow",
    organizationName: "InsureFlow Corp",
    title: "Executiva Comercial",
    passwordHash: "$2b$10$8Fxvklwm.FKtHLuX05ZMZeFLiTfuAK/1I83YBn8Z8.aqsFOjWrsKG",
  },
]

export function toSessionUser(user: AuthUser): SessionUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    initials: user.initials,
    role: user.role,
    roleLabel: user.roleLabel,
    organizationId: user.organizationId,
    organizationName: user.organizationName,
    title: user.title,
  }
}

export async function authenticateUser(
  email: string,
  password: string
): Promise<AuthUser | null> {
  const normalized = email.trim().toLowerCase()
  const user = DEMO_USERS.find((u) => u.email.toLowerCase() === normalized)
  if (!user) return null

  const valid = await bcrypt.compare(password, user.passwordHash)
  return valid ? user : null
}

export function findUserById(id: string): AuthUser | undefined {
  return DEMO_USERS.find((u) => u.id === id)
}

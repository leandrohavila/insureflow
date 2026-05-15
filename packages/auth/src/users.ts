import bcrypt from "bcryptjs"

import type { AuthUser, SessionUser } from "./types"
import { ROLE_LABELS } from "./roles"

export const DEMO_USERS: AuthUser[] = [
  {
    id: "usr_admin",
    email: "admin@insureflow.com",
    name: "Ana Costa",
    initials: "AC",
    role: "super_admin",
    roleLabel: ROLE_LABELS.super_admin,
    organizationId: "org_insureflow",
    organizationName: "InsureFlow Corp",
    title: "Head of Operations",
    passwordHash: "$2b$10$ueSXmD1tnVntm8kuuWnjcuNH1CLz6HCxVDTMk3MKvhZH8Hs2kCLVS",
  },
  {
    id: "usr_broker",
    email: "pedro@insureflow.com",
    name: "Pedro Lima",
    initials: "PL",
    role: "broker",
    roleLabel: ROLE_LABELS.broker,
    organizationId: "org_insureflow",
    organizationName: "InsureFlow Corp",
    title: "Corretor Sênior",
    passwordHash: "$2b$10$tA6TtPxh4lX234HPQSGWSen11Uzex810BAD3ZwfbXIpCj9HPs.o3O",
  },
  {
    id: "usr_underwriter",
    email: "julia@insureflow.com",
    name: "Julia Mendes",
    initials: "JM",
    role: "underwriter",
    roleLabel: ROLE_LABELS.underwriter,
    organizationId: "org_insureflow",
    organizationName: "InsureFlow Corp",
    title: "Subscritora",
    passwordHash: "$2b$10$mHf5DgCrRlgjk5CQyW9qr.w8qwk/18zEtP6VA76MuzSVwdP94q5Ru",
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
    passwordHash: "$2b$10$DAGR/xHrEHGpzYkBk056HeUXaa76i85rKaog7yp/S64L9DxaJRuru",
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

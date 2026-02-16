import "server-only"
import { createNeonAuth } from "@neondatabase/auth/next/server"

const baseUrl = process.env.NEON_AUTH_BASE_URL
const cookieSecret = process.env.NEON_AUTH_COOKIE_SECRET
const adminEmails = (process.env.NEON_AUTH_ADMIN_EMAILS ?? "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean)

export const authEnabled = Boolean(baseUrl && cookieSecret)
const invalidSecret = authEnabled && cookieSecret && cookieSecret.length < 32

if (invalidSecret) {
  console.warn("Neon Auth disabled: NEON_AUTH_COOKIE_SECRET must be at least 32 characters.")
}

export const auth = authEnabled && !invalidSecret
  ? createNeonAuth({
      baseUrl: baseUrl!,
      cookies: {
        secret: cookieSecret!,
      },
    })
  : null

export function getAuth() {
  return auth
}

async function getSessionData() {
  if (!auth) return null
  const { data } = await auth.getSession()
  return data ?? null
}

export async function getSessionUser() {
  const session = await getSessionData()
  return session?.user ?? null
}

export async function getSessionUserId(): Promise<string> {
  const user = await getSessionUser()
  return user?.id ?? "system"
}

export async function isAdminUser(): Promise<boolean> {
  if (process.env.NEXT_PUBLIC_ADMIN_MODE === "true") {
    return true
  }

  const user = await getSessionUser()
  if (!user) return false

  if (user.role === "admin") return true

  if (adminEmails.length && user.email) {
    return adminEmails.includes(user.email.toLowerCase())
  }

  return false
}

"use client"

import { createAuthClient } from "@neondatabase/auth/next"

export const authClient = createAuthClient()

export function useIsAdmin() {
  const session = authClient.useSession()
  const isAdmin =
    process.env.NEXT_PUBLIC_ADMIN_MODE === "true" || session.data?.user?.role === "admin"
  return { ...session, isAdmin }
}

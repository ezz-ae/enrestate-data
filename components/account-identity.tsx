"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { authClient } from "@/lib/auth/client"

export function AccountIdentity() {
  const router = useRouter()
  const { data: session, isPending } = authClient.useSession()

  if (isPending) {
    return (
      <div className="rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">
        Checking your account session…
      </div>
    )
  }

  if (!session?.user) {
    return (
      <div className="rounded-xl border border-border bg-card p-5 flex flex-col gap-3">
        <div>
          <p className="text-sm font-medium text-foreground">Sign in to manage your account</p>
          <p className="text-xs text-muted-foreground">Your organization profile and access controls live here.</p>
        </div>
        <Link href="/login" className="text-sm text-accent hover:underline font-medium">
          Go to sign in
        </Link>
      </div>
    )
  }

  const handleSignOut = async () => {
    await authClient.signOut()
    router.push("/login")
    router.refresh()
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5 flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-foreground">Signed in as {session.user.name || session.user.email}</p>
        <p className="text-xs text-muted-foreground">{session.user.email}</p>
      </div>
      <Button variant="outline" onClick={handleSignOut} className="border-border">
        Sign out
      </Button>
    </div>
  )
}

"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User, Shield, CreditCard, Users, Boxes, LogOut } from "lucide-react"
import { authClient } from "@/lib/auth/client"

const FALLBACK_USER = {
  name: "Entrestate Member",
  email: "account@entrestate.com",
  avatar: "/avatars/avatar-01.svg",
}

export function AccountMenu() {
  const router = useRouter()
  const { data: session, isPending } = authClient.useSession()

  if (!session?.user && !isPending) {
    return (
      <Link
        href="/login"
        className="flex items-center gap-2 rounded-full border border-border bg-secondary px-4 py-1.5 text-sm text-foreground hover:bg-secondary/80 transition-colors"
      >
        Sign in
      </Link>
    )
  }

  const user = session?.user
  const displayName = user?.name || user?.email || FALLBACK_USER.name
  const displayEmail = user?.email || FALLBACK_USER.email
  const avatar = user?.image || FALLBACK_USER.avatar
  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()

  const handleSignOut = async () => {
    await authClient.signOut()
    router.push("/login")
    router.refresh()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 rounded-full border border-border bg-secondary px-3 py-1.5 text-sm text-foreground hover:bg-secondary/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary">
        <Avatar className="h-7 w-7">
          <AvatarImage src={avatar} alt={displayName} />
          <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
        </Avatar>
        <span className="hidden sm:inline">Account</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="space-y-1">
          <p className="text-sm font-medium leading-none">{displayName}</p>
          <p className="text-xs text-muted-foreground">{displayEmail}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/account" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Account overview
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/account#team" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Team access
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/account#billing" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Billing
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/account#security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/account#apps" className="flex items-center gap-2">
            <Boxes className="h-4 w-4" />
            Connected apps
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={(event) => {
            event.preventDefault()
            handleSignOut()
          }}
          className="flex items-center gap-2"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

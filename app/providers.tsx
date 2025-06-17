"use client"

import { type ReactNode } from "react"
import { UserProvider } from "@/contexts/user-context"

export function Providers({ children }: { children: ReactNode }) {
  return <UserProvider>{children}</UserProvider>
} 
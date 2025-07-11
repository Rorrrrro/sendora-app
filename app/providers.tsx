"use client"

import { UserProvider } from "@/contexts/user-context"
import { Toaster } from "@/components/ui/toaster"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <UserProvider>
      {children}
      <Toaster />
    </UserProvider>
  )
} 
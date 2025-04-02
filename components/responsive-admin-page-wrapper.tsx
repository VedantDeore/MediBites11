"use client"

import type { ReactNode } from "react"
import { AdminNav } from "@/components/admin-nav"
import { AdminBottomNav } from "@/components/admin-bottom-nav"
import { AdminMobileHeader } from "@/components/admin-mobile-header"
import { useMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"

interface ResponsiveAdminPageWrapperProps {
  children: ReactNode
  title: string
}

export function ResponsiveAdminPageWrapper({ children, title }: ResponsiveAdminPageWrapperProps) {
  const isMobile = useMobile()

  return (
    <div className="flex min-h-screen flex-col">
      {!isMobile && <AdminNav />}
      <div className={cn("flex-1 flex flex-col", isMobile ? "" : "ml-64")}>
        {isMobile && <AdminMobileHeader title={title} />}
        <main className={cn("flex-1 p-4", isMobile ? "pb-20" : "")}>{children}</main>
      </div>
      {isMobile && <AdminBottomNav />}
    </div>
  )
}


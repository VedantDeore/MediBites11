"use client"

import type { ReactNode } from "react"
import { DashboardNav } from "@/components/dashboard-nav"
import { BottomNav } from "@/components/bottom-nav"
import { MobileHeader } from "@/components/mobile-header"
import { useMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"

interface ResponsivePageWrapperProps {
  children: ReactNode
  title: string
}

export function ResponsivePageWrapper({ children, title }: ResponsivePageWrapperProps) {
  const isMobile = useMobile()

  return (
    <div className="flex min-h-screen flex-col">
      {!isMobile && <DashboardNav />}
      <div className={cn("flex-1 flex flex-col", isMobile ? "" : "ml-64")}>
        {isMobile && <MobileHeader title={title} />}
        <main className={cn("flex-1 p-4", isMobile ? "pb-20" : "")}>{children}</main>
      </div>
      {isMobile && <BottomNav />}
    </div>
  )
}


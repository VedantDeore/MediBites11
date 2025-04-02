"use client"

import type { ReactNode } from "react"
import { DoctorNav } from "@/components/doctor-nav"
import { DoctorBottomNav } from "@/components/doctor-bottom-nav"
import { DoctorMobileHeader } from "@/components/doctor-mobile-header"
import { useMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"

interface ResponsiveDoctorPageWrapperProps {
  children: ReactNode
  title: string
}

export function ResponsiveDoctorPageWrapper({ children, title }: ResponsiveDoctorPageWrapperProps) {
  const isMobile = useMobile()

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {!isMobile && <DoctorNav />}
      <div className={cn("flex-1 flex flex-col", isMobile ? "" : "md:ml-64")}>
        {isMobile && <DoctorMobileHeader title={title} />}
        <main className={cn("flex-1 p-4", isMobile ? "pb-20" : "p-4 md:p-6")}>{children}</main>
      </div>
      {isMobile && <DoctorBottomNav />}
    </div>
  )
}


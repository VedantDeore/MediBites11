"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useDoctorAuth } from "@/lib/doctor-auth-context"
import { DoctorNav } from "@/components/doctor-nav"
import { DoctorHeader } from "@/components/doctor-header"
import { DoctorBottomNav } from "@/components/doctor-bottom-nav"
import { DoctorMobileHeader } from "@/components/doctor-mobile-header"
import { useMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"

export default function DoctorDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { doctor, loading } = useDoctorAuth()
  const router = useRouter()
  const isMobile = useMobile()

  useEffect(() => {
    if (!loading && !doctor) {
      router.push("/doctor/login")
    }
  }, [doctor, loading, router])

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-t-transparent"></div>
      </div>
    )
  }

  if (!doctor) {
    return null
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row bg-gray-50">
      {!isMobile && <DoctorNav />}
      <div className={cn("flex-1 flex flex-col", isMobile ? "" : "md:ml-64")}>
        {isMobile ? <DoctorMobileHeader title="Doctor Dashboard" /> : <DoctorHeader />}
        <main className={cn("flex-1", isMobile ? "p-4 pb-20" : "p-4 md:p-6")}>{children}</main>
      </div>
      {isMobile && <DoctorBottomNav />}
    </div>
  )
}


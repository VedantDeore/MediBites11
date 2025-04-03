import type React from "react"
import type { Metadata } from "next"
import { AdminAuthProvider } from "@/lib/admin-auth-context"

export const metadata: Metadata = {
  title: "Admin Dashboard - MediBites",
  description: "MediBites Admin Dashboard",
}

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <AdminAuthProvider>{children}</AdminAuthProvider>
}


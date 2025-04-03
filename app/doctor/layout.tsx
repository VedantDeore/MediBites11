import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "../globals.css"
import { DoctorAuthProvider } from "@/lib/doctor-auth-context"
import { ThemeProvider } from "@/components/theme-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "MediBites - Doctor Portal",
  description: "Manage your patients and appointments",
}

export default function DoctorLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <DoctorAuthProvider>{children}</DoctorAuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}


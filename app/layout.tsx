import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/lib/auth-context"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from 'react-hot-toast'
import { toast } from 'react-hot-toast'

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "MediBites - Your Health, Our Priority",
  description: "Advanced healthcare solutions with personalized care",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
        <Toaster position="top-right" />
      </body>
    </html>
  )
}

// Now these will work correctly
const handleSuccess = () => {
  toast.success('Successfully created!')
}

const handleError = () => {
  toast.error('An error occurred!')
}

const handlePromise = async () => {
  toast.promise(
    saveData(),
    {
      loading: 'Saving...',
      success: 'Saved successfully',
      error: 'Could not save',
    }
  )
}

import './globals.css'
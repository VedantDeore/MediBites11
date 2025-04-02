"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { auth, db } from "@/lib/firebase"
import { onAuthStateChanged, type User } from "firebase/auth"
import { doc, getDoc } from "firebase/firestore"
import { useRouter } from "next/navigation"

interface AdminUser extends User {
  role: string
  name: string
  email: string
}

interface AdminAuthContextType {
  admin: AdminUser | null
  loading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AdminAuthContext = createContext<AdminAuthContextType>({
  admin: null,
  loading: true,
  error: null,
  login: async () => {},
  logout: async () => {},
})

export const useAdminAuth = () => useContext(AdminAuthContext)

interface AdminAuthProviderProps {
  children: ReactNode
}

export function AdminAuthProvider({ children }: AdminAuthProviderProps) {
  const [admin, setAdmin] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Check if user is an admin
          const adminDoc = await getDoc(doc(db, "admins", user.uid))

          if (adminDoc.exists()) {
            const adminData = adminDoc.data()
            setAdmin({
              ...user,
              role: adminData.role || "admin",
              name: adminData.name || "Admin",
              email: user.email || "",
            })
          } else {
            // Not an admin, log them out
            await auth.signOut()
            setAdmin(null)
            router.push("/admin/login")
          }
        } catch (err) {
          console.error("Error fetching admin data:", err)
          setError("Failed to authenticate as admin")
        }
      } else {
        setAdmin(null)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [router])

  const login = async (email: string, password: string) => {
    try {
      setLoading(true)
      setError(null)

      // This will be handled by the login page component
      // We'll just set up the context structure here
    } catch (err: any) {
      setError(err.message || "Failed to login")
      throw err
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      setLoading(true)
      await auth.signOut()
      router.push("/admin/login")
    } catch (err: any) {
      setError(err.message || "Failed to logout")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AdminAuthContext.Provider value={{ admin, loading, error, login, logout }}>{children}</AdminAuthContext.Provider>
  )
}


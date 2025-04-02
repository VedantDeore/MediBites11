"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import type { User } from "firebase/auth"
import { auth, loginDoctor, registerDoctor, signOut, getDoctorProfile, updateDoctorProfile, uploadProfilePicture } from "@/lib/firebase"
import { useRouter, usePathname } from "next/navigation"
import { onAuthStateChanged } from "firebase/auth"

export type Patient = {
  id: string
  name: string
  email: string
  dayOfAppointment: string
  timeSlot: string
  age?: number
  status: "pending" | "completed" | "cancelled"
}

export type Doctor = {
  id: string
  name: string
  email: string
  specialty: string
  profilePicture?: string
  totalPatients: number
  pendingAppointments: number
  completedAppointments: number
  recentPatients: Patient[]
  // Additional fields from registration
  gender?: string
  age?: string
  phone?: string
  experience?: string
  qualifications?: string[]
  registrationNumber?: string
  clinicName?: string
  clinicAddress?: string
  workingHours?: string
  consultationFeeInPerson?: string
  consultationFeeTelemedicine?: string
  languages?: string[]
}

type DoctorAuthContextType = {
  doctor: Doctor | null
  user: User | null
  loading: boolean
  error: string | null
  register: (email: string, password: string, doctorData: any) => Promise<void>
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  updateProfile: (data: Partial<Doctor>) => Promise<void>
  uploadPicture: (file: File) => Promise<string>
}

const DoctorAuthContext = createContext<DoctorAuthContextType | undefined>({
  doctor: null,
  user: null,
  loading: true,
  error: null,
  register: async () => {},
  login: async () => {},
  logout: () => {},
  updateProfile: async () => {},
  uploadPicture: async () => {},
})

export const useDoctorAuth = () => {
  const context = useContext(DoctorAuthContext)
  if (context === undefined) {
    throw new Error("useDoctorAuth must be used within a DoctorAuthProvider")
  }
  return context
}

// Mock data for demo purposes
const mockDoctor: Doctor = {
  id: "1",
  name: "Dr. Sarah Smith",
  email: "doctor@example.com",
  specialty: "Cardiology",
  profilePicture: "/placeholder.svg?height=200&width=200",
  totalPatients: 13,
  pendingAppointments: 13,
  completedAppointments: 0,
  recentPatients: [
    {
      id: "1",
      name: "Patient A",
      email: "a@gmail.com",
      dayOfAppointment: "Friday",
      timeSlot: "9-12",
      status: "pending",
    },
    {
      id: "2",
      name: "Patient B",
      email: "b@gmail.com",
      dayOfAppointment: "Friday",
      timeSlot: "1-3",
      status: "pending",
    },
    {
      id: "3",
      name: "Patient C",
      email: "c@gmail.com",
      dayOfAppointment: "Monday",
      timeSlot: "4-6",
      status: "pending",
    },
    {
      id: "4",
      name: "Patient D",
      email: "d@gmail.com",
      dayOfAppointment: "Wednesday",
      timeSlot: "4-6",
      status: "pending",
    },
  ],
}

export const DoctorAuthProvider = ({ children }: { children: ReactNode }) => {
  const [doctor, setDoctor] = useState<Doctor | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const pathname = usePathname()

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          console.log("Doctor authenticated with UID:", user.uid)
          const doctorData = await getDoctorProfile(user.uid)

          if (doctorData) {
            console.log("Doctor profile loaded:", doctorData)
            setDoctor(doctorData as Doctor)
            setUser(user)
          } else {
            console.log("No doctor profile found for UID:", user.uid)
            setDoctor(null)
            setUser(null)
            if (pathname?.startsWith("/doctor/dashboard")) {
              router.push("/doctor/login")
            }
          }
        } catch (error) {
          console.error("Error fetching doctor profile:", error)
          setDoctor(null)
          setUser(null)
        }
      } else {
        console.log("No authenticated doctor")
        setDoctor(null)
        setUser(null)
        if (pathname?.startsWith("/doctor/dashboard")) {
          router.push("/doctor/login")
        }
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [router, pathname])

  const login = async (email: string, password: string) => {
    setLoading(true)
    setError(null)

    try {
      // Check if this is the demo account
      if (email === "doctor@example.com" && password === "password") {
        // Use mock data for demo
        setDoctor(mockDoctor)
        localStorage.setItem("doctor", JSON.stringify(mockDoctor))
        setUser({ uid: "1" } as User) // Mock user for demo
        setLoading(false)
        return
      }

      // Real Firebase authentication
      const userCredential = await loginDoctor(email, password)
      setUser(userCredential)

      // Get doctor profile from Firestore
      const doctorProfile = await getDoctorProfile(userCredential.uid)

      if (doctorProfile) {
        setDoctor(doctorProfile as Doctor)
      }
    } catch (err) {
      console.error("Login error:", err)
      setError(err instanceof Error ? err.message : "An error occurred during login")
      throw err
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      // Check if we're in demo mode
      if (doctor && doctor.id === "1") {
        // Just clear localStorage for demo
        localStorage.removeItem("doctor")
        setDoctor(null)
        setUser(null)
        return
      }

      // Real Firebase logout
      await signOut()
      setDoctor(null)
      setUser(null)
    } catch (err) {
      console.error("Logout error:", err)
      setError(err instanceof Error ? err.message : "An error occurred during logout")
    }
  }

  const updateProfile = async (data: Partial<Doctor>) => {
    setLoading(true)
    setError(null)

    try {
      // Check if we're in demo mode
      if (doctor && doctor.id === "1") {
        // Update local state for demo
        const updatedDoctor = { ...doctor, ...data }
        setDoctor(updatedDoctor)
        localStorage.setItem("doctor", JSON.stringify(updatedDoctor))
        setLoading(false)
        return
      }

      // Real Firebase update
      if (user && doctor) {
        await updateDoctorProfile(user.uid, data)
        // Update local state
        setDoctor({ ...doctor, ...data })
      } else {
        throw new Error("No authenticated user")
      }
    } catch (err) {
      console.error("Profile update error:", err)
      setError(err instanceof Error ? err.message : "An error occurred updating profile")
      throw err
    } finally {
      setLoading(false)
    }
  }

  const uploadPicture = async (file: File) => {
    setLoading(true)
    setError(null)

    try {
      // Check if we're in demo mode
      if (doctor && doctor.id === "1") {
        // Create a fake URL for demo
        const fakeUrl = URL.createObjectURL(file)
        const updatedDoctor = { ...doctor, profilePicture: fakeUrl }
        setDoctor(updatedDoctor)
        localStorage.setItem("doctor", JSON.stringify(updatedDoctor))
        setLoading(false)
        return fakeUrl
      }

      // Real Firebase upload
      if (user && doctor) {
        const downloadURL = await uploadProfilePicture(user.uid, file)
        // Update local state
        setDoctor({ ...doctor, profilePicture: downloadURL })
        return downloadURL
      } else {
        throw new Error("No authenticated user")
      }
    } catch (err) {
      console.error("Profile picture upload error:", err)
      setError(err instanceof Error ? err.message : "An error occurred uploading picture")
      throw err
    } finally {
      setLoading(false)
    }
  }

  const register = async (email: string, password: string, doctorData: any) => {
    try {
      await registerDoctor(email, password, doctorData)
    } catch (error: any) {
      setError(error.message)
      throw error
    }
  }

  return (
    <DoctorAuthContext.Provider
      value={{
        doctor,
        user,
        loading,
        error,
        register,
        login,
        logout,
        updateProfile,
        uploadPicture,
      }}
    >
      {children}
    </DoctorAuthContext.Provider>
  )
}


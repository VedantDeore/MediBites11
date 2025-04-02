"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import type { User as FirebaseUser } from "firebase/auth"
import {
  auth,
  loginPatient,
  registerPatient,
  signOut,
  getPatientProfile,
  updatePatientProfile,
  uploadProfilePicture,
} from "./patient-firebase"

export type User = {
  id: string
  name: string
  email: string
  profilePicture?: string
  dateOfBirth?: string
  gender?: string
  bloodGroup?: string
  phone?: string
  address?: string
  allergies?: string[]
  chronicConditions?: string[]
  medications?: string[]
  pastSurgeries?: string[]
  familyHistory?: string[]
  upcomingAppointments?: {
    id: string
    date: string
    time: string
    doctorName: string
    specialty: string
  }[]
  pastAppointments?: {
    id: string
    date: string
    time: string
    doctorName: string
    specialty: string
    notes?: string
  }[]
  labReports?: {
    id: string
    name: string
    date: string
    type: string
    url: string
  }[]
  prescriptions?: {
    id: string
    date: string
    doctorName: string
    medications: string[]
    url?: string
  }[]
  vaccinations?: {
    id: string
    name: string
    date: string
    nextDue?: string
  }[]
  healthPredictions?: {
    id: string
    condition: string
    riskLevel: "low" | "medium" | "high"
    date: string
    recommendations?: string[]
  }[]
  healthScore?: number
  symptoms?: {
    id: string
    name: string
    severity: "mild" | "moderate" | "severe"
    startDate: string
    endDate?: string
  }[]
  preferredDoctors?: {
    id: string
    name: string
    specialty: string
    contact: string
  }[]
  emergencyContacts?: {
    id: string
    name: string
    relationship: string
    phone: string
  }[]
  notificationPreferences?: {
    appointments: boolean
    medications: boolean
    labResults: boolean
    newsletters: boolean
  }
  privacySettings?: {
    shareRecordsWithDoctors: boolean
    allowResearchUse: boolean
    showProfileToOthers: boolean
  }
}

type AuthContextType = {
  user: User | null
  firebaseUser: FirebaseUser | null
  login: (email: string, password: string) => Promise<void>
  register: (userData: Partial<User>, password: string) => Promise<void>
  logout: () => void
  updateUser: (data: Partial<User>) => Promise<void>
  uploadPicture: (file: File) => Promise<string>
  loading: boolean
  error: string | null
  isDemo: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  
  // Log the user object to debug
  console.log("Current user in auth context:", context.user)
  
  return context
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDemo, setIsDemo] = useState(false)

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      setLoading(true)

      if (firebaseUser) {
        setFirebaseUser(firebaseUser)
        try {
          // Get user data from Firestore
          const userData = await getPatientProfile(firebaseUser.uid)
          if (userData) {
            setUser(userData as User)
            setIsDemo(false)
          }
        } catch (err) {
          console.error("Error fetching user data:", err)
        }
      } else {
        // Check if we have a demo user in localStorage
        const storedUser = localStorage.getItem("demoUser")
        if (storedUser) {
          setUser(JSON.parse(storedUser))
          setIsDemo(true)
        } else {
          setUser(null)
          setIsDemo(false)
        }
        setFirebaseUser(null)
      }

      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const login = async (email: string, password: string) => {
    setLoading(true)
    setError(null)

    try {
      // Demo login for testing
      if (email === "demo@example.com" && password === "password") {
        const mockUser: User = {
          id: "demo-user-id",
          name: "John Doe",
          email: "demo@example.com",
          profilePicture: "/placeholder.svg?height=200&width=200",
          dateOfBirth: "1985-05-15",
          gender: "Male",
          bloodGroup: "O+",
          phone: "(555) 123-4567",
          address: "123 Main St, Anytown, USA",
          allergies: ["Penicillin", "Peanuts"],
          chronicConditions: ["Hypertension"],
          medications: ["Lisinopril 10mg", "Aspirin 81mg"],
          pastSurgeries: ["Appendectomy (2010)"],
          familyHistory: ["Diabetes (Father)", "Heart Disease (Grandfather)"],
          upcomingAppointments: [
            {
              id: "apt1",
              date: "2023-05-15",
              time: "10:00 AM",
              doctorName: "Dr. Sarah Smith",
              specialty: "Cardiology",
            },
            {
              id: "apt2",
              date: "2023-06-02",
              time: "2:30 PM",
              doctorName: "Dr. Michael Johnson",
              specialty: "General Checkup",
            },
          ],
          pastAppointments: [
            {
              id: "past1",
              date: "2023-01-10",
              time: "9:00 AM",
              doctorName: "Dr. Sarah Smith",
              specialty: "Cardiology",
              notes: "Blood pressure slightly elevated. Continue medication.",
            },
          ],
          labReports: [
            {
              id: "lab1",
              name: "Complete Blood Count",
              date: "2023-04-28",
              type: "Blood Work",
              url: "#",
            },
            {
              id: "lab2",
              name: "Chest X-Ray",
              date: "2023-03-15",
              type: "Radiology",
              url: "#",
            },
          ],
          healthPredictions: [
            {
              id: "pred1",
              condition: "Type 2 Diabetes",
              riskLevel: "medium",
              date: "2023-04-01",
              recommendations: ["Reduce sugar intake", "Exercise regularly", "Monitor blood glucose"],
            },
          ],
          healthScore: 78,
          preferredDoctors: [
            {
              id: "doc1",
              name: "Dr. Sarah Smith",
              specialty: "Cardiology",
              contact: "(555) 987-6543",
            },
          ],
          emergencyContacts: [
            {
              id: "emg1",
              name: "Jane Doe",
              relationship: "Spouse",
              phone: "(555) 234-5678",
            },
          ],
          notificationPreferences: {
            appointments: true,
            medications: true,
            labResults: true,
            newsletters: false,
          },
          privacySettings: {
            shareRecordsWithDoctors: true,
            allowResearchUse: false,
            showProfileToOthers: false,
          },
        }

        setUser(mockUser)
        localStorage.setItem("demoUser", JSON.stringify(mockUser))
        setIsDemo(true)
      } else {
        // Firebase login
        const userCredential = await loginPatient(email, password)
        setFirebaseUser(userCredential)

        // Get user data from Firestore
        const userData = await getPatientProfile(userCredential.uid)
        if (userData) {
          setUser(userData as User)
          setIsDemo(false)
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred during login")
    } finally {
      setLoading(false)
    }
  }

  const register = async (userData: Partial<User>, password: string) => {
    setLoading(true)
    setError(null)

    try {
      if (!userData.email) throw new Error("Email is required")

      // Register with Firebase
      const userCredential = await registerPatient(userData.email, password, userData)
      setFirebaseUser(userCredential)

      // Get the newly created user data
      const newUserData = await getPatientProfile(userCredential.uid)
      if (newUserData) {
        setUser(newUserData as User)
        setIsDemo(false)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred during registration")
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      if (isDemo) {
        // Clear demo user
        localStorage.removeItem("demoUser")
        setIsDemo(false)
      } else {
        // Firebase logout
        await signOut()
      }
      setUser(null)
      setFirebaseUser(null)
    } catch (err) {
      console.error("Error during logout:", err)
    }
  }

  const updateUser = async (data: Partial<User>) => {
    setLoading(true)
    setError(null)

    try {
      if (isDemo && user) {
        // Update demo user
        const updatedUser = { ...user, ...data }
        setUser(updatedUser)
        localStorage.setItem("demoUser", JSON.stringify(updatedUser))
      } else if (firebaseUser) {
        // Update Firebase user
        await updatePatientProfile(firebaseUser.uid, data)

        // Get updated user data
        const updatedUserData = await getPatientProfile(firebaseUser.uid)
        if (updatedUserData) {
          setUser(updatedUserData as User)
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred while updating profile")
    } finally {
      setLoading(false)
    }
  }

  const uploadPicture = async (file: File) => {
    setLoading(true)
    setError(null)

    try {
      if (isDemo && user) {
        // For demo, just create a fake URL
        const fakeUrl = URL.createObjectURL(file)
        const updatedUser = { ...user, profilePicture: fakeUrl }
        setUser(updatedUser)
        localStorage.setItem("demoUser", JSON.stringify(updatedUser))
        return fakeUrl
      } else if (firebaseUser) {
        // Upload to Firebase Storage
        const downloadURL = await uploadProfilePicture(firebaseUser.uid, file)

        // Update user state with new profile picture
        if (user) {
          setUser({ ...user, profilePicture: downloadURL })
        }

        return downloadURL
      }
      throw new Error("User not authenticated")
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred while uploading picture")
      throw err
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        login,
        register,
        logout,
        updateUser,
        uploadPicture,
        loading,
        error,
        isDemo,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}


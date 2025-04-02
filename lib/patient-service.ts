import { db, storage } from "./firebase"
import { collection, doc, getDoc, getDocs, query, where, updateDoc, setDoc, runTransaction, serverTimestamp, writeBatch } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"

// Define types for our appointment system
export type AppointmentStatus = "scheduled" | "completed" | "cancelled" | "no-show"
export type AppointmentType = "in-person" | "telemedicine"

export interface Appointment {
  id?: string
  patientId: string
  patientName: string
  patientEmail: string
  doctorId: string
  doctorName: string
  specialty: string
  date: string // ISO date string (YYYY-MM-DD)
  startTime: string // 24-hour format (HH:MM)
  endTime: string // 24-hour format (HH:MM)
  status: AppointmentStatus
  type: AppointmentType
  timeSlotId?: string
  notes?: string
  reason?: string
  createdAt: string
  updatedAt: string
}

// Add these new interfaces to the existing interfaces section

// Add this interface for medical images
export interface PatientMedicalImage {
  id: string
  url: string
  name: string
  type: string
  category: string
  description?: string
  uploadedAt: string
  uploadedBy: string
  doctorId: string
}

export interface PatientNote {
  content: string
  createdAt: string
  createdBy: string
  doctorId: string
}

export interface PatientDocument {
  name: string
  type: string
  url?: string
  uploadedAt: string
  uploadedBy: string
  doctorId: string
}

// Update the PatientData interface to include medicalImages
export interface PatientData {
  id: string
  name: string
  email: string
  phone?: string
  age?: number
  gender?: string
  address?: string
  profilePicture?: string
  registrationDate?: string
  lastVisit?: string
  medicalInfo?: PatientMedicalInfo
  appointments?: Appointment[]
  notes?: PatientNote[]
  documents?: PatientDocument[]
  medicalImages?: PatientMedicalImage[] // Add this line
  status?: "active" | "inactive" | "new"
  nextAppointment?: {
    date: string
    time: string
  }
  treatmentPlan?: string
}

// Update the PatientMedicalInfo interface to include more fields
export interface PatientMedicalInfo {
  bloodGroup?: string
  allergies: string[]
  chronicConditions: string[]
  medications: string[]
  medicalHistory?: string[]
  emergencyContact?: {
    name: string
    phone: string
    relationship: string
  }
  insuranceDetails?: {
    provider: string
    policyNumber: string
    coverageType: string
  }
  preferredLanguage?: string
  primaryPhysician?: string
  surgeryHistory?: {
    procedure: string
    date: string
    surgeon: string
    hospital: string
    outcome: string
  }[]
  vitals?: {
    date: string
    bloodPressure?: string
    heartRate?: number
    temperature?: number
    respiratoryRate?: number
    oxygenSaturation?: number
    weight?: number
    height?: number
    bmi?: number
    bloodGlucose?: number
  }[]
  labReports?: {
    type: string
    date: string
    results: {
      name: string
      value: string
      isAbnormal: boolean
      normalRange?: string
    }[]
    summary?: string
    documentUrl?: string
  }[]
  diagnosticReports?: {
    type: string
    date: string
    findings: string
    documentUrl?: string
  }[]
  riskAssessments?: {
    condition: string
    riskLevel: "Low" | "Medium" | "High"
    probability: number
    factors: string[]
    recommendations: string[]
    lastAssessed: string
  }[]
  allergyManagement?: {
    severity: string
    frequency: string
    emergencyPlan: string
    recentReactions: {
      date: string
      description: string
      treatment: string
    }[]
    preventiveMeasures: string[]
  }
}

// Get patients for a specific doctor
export const getPatientsByDoctor = async (doctorId: string): Promise<PatientData[]> => {
  try {
    console.log("Fetching patients for doctor:", doctorId)

    // First, get all appointments for this doctor
    const appointmentsRef = collection(db, "appointments")
    const appointmentsQuery = query(appointmentsRef, where("doctorId", "==", doctorId))
    const appointmentsSnapshot = await getDocs(appointmentsQuery)

    // Extract unique patient IDs from appointments
    const patientIds = new Set<string>()
    const patientEmails = new Set<string>()
    const patientAppointments = new Map<string, Appointment[]>()

    appointmentsSnapshot.forEach((doc) => {
      const appointment = { id: doc.id, ...doc.data() } as Appointment

      if (appointment.patientId) {
        patientIds.add(appointment.patientId)
      }

      if (appointment.patientEmail) {
        patientEmails.add(appointment.patientEmail)
      }

      // Group appointments by patient email
      if (appointment.patientEmail) {
        const existingAppointments = patientAppointments.get(appointment.patientEmail) || []
        patientAppointments.set(appointment.patientEmail, [...existingAppointments, appointment])
      }
    })

    console.log("Found patient IDs:", Array.from(patientIds))
    console.log("Found patient emails:", Array.from(patientEmails))

    // Get patient data from users collection
    const patients: PatientData[] = []

    // Try to get patients by ID first
    for (const patientId of patientIds) {
      try {
        const patientDoc = await getDoc(doc(db, "patients", patientId))

        if (patientDoc.exists()) {
          const patientData = patientDoc.data()
          const patientEmail = patientData.email

          // Add appointments to patient data
          const appointments = patientAppointments.get(patientEmail) || []

          // Sort appointments by date
          appointments.sort((a, b) => {
            const dateA = new Date(`${a.date}T${a.startTime}`)
            const dateB = new Date(`${b.date}T${b.startTime}`)
            return dateB.getTime() - dateA.getTime() // Most recent first
          })

          // Get next appointment (first scheduled appointment in the future)
          const now = new Date()
          const nextAppointment = appointments.find((apt) => {
            const aptDate = new Date(`${apt.date}T${apt.startTime}`)
            return aptDate > now && apt.status === "scheduled"
          })

          // Get last visit date (most recent completed appointment)
          const lastCompletedAppointment = appointments.find((apt) => apt.status === "completed")

          patients.push({
            id: patientDoc.id,
            ...patientData,
            appointments,
            lastVisit: lastCompletedAppointment?.date || patientData.lastVisit,
            nextAppointment: nextAppointment
              ? {
                  date: nextAppointment.date,
                  time: nextAppointment.startTime,
                }
              : undefined,
            status: getPatientStatus(appointments),
          })
        }
      } catch (error) {
        console.error(`Error fetching patient ${patientId}:`, error)
      }
    }

    // If we couldn't find patients by ID, try by email
    if (patients.length === 0) {
      for (const email of patientEmails) {
        try {
          const usersRef = collection(db, "patients")
          const q = query(usersRef, where("email", "==", email))
          const querySnapshot = await getDocs(q)

          if (!querySnapshot.empty) {
            const patientDoc = querySnapshot.docs[0]
            const patientData = patientDoc.data()

            // Add appointments to patient data
            const appointments = patientAppointments.get(email) || []

            // Sort appointments by date
            appointments.sort((a, b) => {
              const dateA = new Date(`${a.date}T${a.startTime}`)
              const dateB = new Date(`${b.date}T${b.startTime}`)
              return dateB.getTime() - dateA.getTime() // Most recent first
            })

            // Get next appointment (first scheduled appointment in the future)
            const now = new Date()
            const nextAppointment = appointments.find((apt) => {
              const aptDate = new Date(`${apt.date}T${apt.startTime}`)
              return aptDate > now && apt.status === "scheduled"
            })

            // Get last visit date (most recent completed appointment)
            const lastCompletedAppointment = appointments.find((apt) => apt.status === "completed")

            patients.push({
              id: patientDoc.id,
              ...patientData,
              appointments,
              lastVisit: lastCompletedAppointment?.date || patientData.lastVisit,
              nextAppointment: nextAppointment
                ? {
                    date: nextAppointment.date,
                    time: nextAppointment.startTime,
                  }
                : undefined,
              status: getPatientStatus(appointments),
            })
          } else {
            // Create a minimal patient record from appointment data
            const patientAppointment = patientAppointments.get(email)?.[0]

            if (patientAppointment) {
              const appointments = patientAppointments.get(email) || []

              // Sort appointments by date
              appointments.sort((a, b) => {
                const dateA = new Date(`${a.date}T${a.startTime}`)
                const dateB = new Date(`${b.date}T${b.startTime}`)
                return dateB.getTime() - dateA.getTime() // Most recent first
              })

              // Get next appointment (first scheduled appointment in the future)
              const now = new Date()
              const nextAppointment = appointments.find((apt) => {
                const aptDate = new Date(`${apt.date}T${apt.startTime}`)
                return aptDate > now && apt.status === "scheduled"
              })

              patients.push({
                id: email, // Use email as ID for now
                name: patientAppointment.patientName,
                email: email,
                appointments,
                nextAppointment: nextAppointment
                  ? {
                      date: nextAppointment.date,
                      time: nextAppointment.startTime,
                    }
                  : undefined,
                status: "new",
              })
            }
          }
        } catch (error) {
          console.error(`Error fetching patient with email ${email}:`, error)
        }
      }
    }

    return patients
  } catch (error) {
    console.error("Error getting patients by doctor:", error)
    throw error
  }
}

// Determine patient status based on appointments
const getPatientStatus = (appointments: Appointment[]): "active" | "inactive" | "new" => {
  if (!appointments || appointments.length === 0) {
    return "new"
  }

  const now = new Date()
  const threeMonthsAgo = new Date()
  threeMonthsAgo.setMonth(now.getMonth() - 3)

  // Check if there are any recent or upcoming appointments
  const hasRecentOrUpcomingAppointments = appointments.some((apt) => {
    const aptDate = new Date(`${apt.date}T${apt.startTime}`)
    return aptDate > threeMonthsAgo || apt.status === "scheduled"
  })

  return hasRecentOrUpcomingAppointments ? "active" : "inactive"
}

// Get detailed patient information
export const getPatientDetails = async (patientId: string): Promise<PatientData> => {
  try {
    // First try to get from patients collection
    const patientDoc = await getDoc(doc(db, "patients", patientId))

    let patientData: PatientData

    if (patientDoc.exists()) {
      patientData = patientDoc.data() as PatientData
    } else {
      // If not found, return minimal data
      return {
        id: patientId,
        name: "Unknown Patient",
        email: patientId,
        status: "new",
      }
    }

    return {
      id: patientDoc.id,
      ...patientData,
    }
  } catch (error) {
    console.error("Error getting patient details:", error)
    throw error
  }
}

// Update patient medical information
export const updatePatientMedicalInfo = async (patientId: string, medicalInfo: PatientMedicalInfo): Promise<void> => {
  try {
    // Check if patient exists in patients collection
    const patientDoc = await getDoc(doc(db, "patients", patientId))

    if (patientDoc.exists()) {
      // Update existing patient
      await updateDoc(doc(db, "patients", patientId), {
        medicalInfo,
        updatedAt: new Date().toISOString(),
      })
    } else {
      // Create new patient document if it doesn't exist
      await setDoc(
        doc(db, "patients", patientId),
        {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        { merge: true },
      )
    }
  } catch (error) {
    console.error("Error updating patient medical info:", error)
    throw error
  }
}

// Add a note to patient record
export const addPatientNote = async (patientId: string, note: PatientNote): Promise<void> => {
  try {
    // Check if patient exists in patients collection
    const patientDoc = await getDoc(doc(db, "patients", patientId))

    if (!patientDoc.exists()) {
      // Create patient document if it doesn't exist
      await setDoc(
        doc(db, "patients", patientId),
        {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        { merge: true },
      )
    }

    // Add note to patient's notes subcollection
    const noteRef = doc(collection(db, `patients/${patientId}/notes`))
    await setDoc(noteRef, note)

    // Update patient's last updated timestamp
    await updateDoc(doc(db, "patients", patientId), {
      updatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error adding patient note:", error)
    throw error
  }
}

// Upload a document for a patient
export const uploadPatientDocument = async (
  patientId: string,
  document: PatientDocument,
  file?: File,
): Promise<PatientDocument> => {
  try {
    // Validate inputs
    if (!patientId) throw new Error("Patient ID is required")
    if (!document) throw new Error("Document metadata is required")
    if (!document.url && !file) throw new Error("Either document URL or file is required")
    
    const patientDoc = await getDoc(doc(db, "patients", patientId))
    
    // Use transaction for atomic operations
    return await runTransaction(db, async (transaction) => {
      if (!patientDoc.exists()) {
        transaction.set(doc(db, "patients", patientId), {
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }, { merge: true })
      }
      
      let documentWithUrl = document
      
      if (!document.url && file) {
        const storageRef = ref(storage, `patients/${patientId}/documents/${Date.now()}_${file.name}`)
        await uploadBytes(storageRef, file)
        const downloadURL = await getDownloadURL(storageRef)
        
        documentWithUrl = {
          ...document,
          url: downloadURL,
          uploadedAt: serverTimestamp(),
        }
      }
      
      const documentRef = doc(collection(db, `patients/${patientId}/documents`))
      transaction.set(documentRef, documentWithUrl)
      
      transaction.update(doc(db, "patients", patientId), {
        updatedAt: serverTimestamp(),
      })
      
      return documentWithUrl
    })
  } catch (error) {
    console.error("Error uploading patient document:", error)
    throw error
  }
}

// Add this new function after the uploadPatientDocument function

// Upload a medical image for a patient
export const uploadPatientMedicalImage = async (
  patientId: string,
  imageData: Omit<PatientMedicalImage, "id">,
): Promise<PatientMedicalImage> => {
  try {
    // Check if patient exists in patients collection
    const patientDoc = await getDoc(doc(db, "patients", patientId))

    if (!patientDoc.exists()) {
      // Create patient document if it doesn't exist
      await setDoc(
        doc(db, "patients", patientId),
        {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        { merge: true },
      )
    }

    // Create a unique ID for the image
    const imageId = Date.now().toString()

    // Create the complete image object
    const completeImageData: PatientMedicalImage = {
      id: imageId,
      ...imageData,
    }

    // Get current medical images array or create a new one
    const patientData = patientDoc.data() as PatientData
    const currentImages = patientData.medicalImages || []

    // Add the new image to the array
    const updatedImages = [...currentImages, completeImageData]

    // Update the patient document with the new images array
    await updateDoc(doc(db, "patients", patientId), {
      medicalImages: updatedImages,
      updatedAt: new Date().toISOString(),
    })

    // Return the complete image data
    return completeImageData
  } catch (error) {
    console.error("Error uploading patient medical image:", error)
    throw error
  }
}

// Add this function to delete a medical image
export const deletePatientMedicalImage = async (patientId: string, imageId: string): Promise<void> => {
  try {
    // Get the patient document
    const patientDoc = await getDoc(doc(db, "patients", patientId))

    if (!patientDoc.exists()) {
      throw new Error("Patient not found")
    }

    // Get current medical images array
    const patientData = patientDoc.data() as PatientData
    const currentImages = patientData.medicalImages || []

    // Filter out the image to delete
    const updatedImages = currentImages.filter((img) => img.id !== imageId)

    // Update the patient document with the filtered images array
    await updateDoc(doc(db, "patients", patientId), {
      medicalImages: updatedImages,
      updatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error deleting patient medical image:", error)
    throw error
  }
}


import { db } from "./firebase"
import { collection, addDoc, query, where, getDocs, doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore"
import type { WorkingHoursData } from "@/components/working-hours-editor"
import {
  bookTimeSlot,
  releaseTimeSlotByAppointmentId,
  initializeTimeSlotsForDoctor,
  getAvailableTimeSlotsForDoctorAndDate,
  type TimeSlot,
} from "./time-slot-service"

// Define types for our appointment system
export type AppointmentStatus = "scheduled" | "completed" | "cancelled" | "no-show"
export type AppointmentType = "in-person" | "telemedicine"

// Add these fields to the Appointment interface
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
  // New fields for payment and rating
  isPaid?: boolean
  paymentAmount?: number
  paymentDate?: string
  rating?: number
  feedback?: string
  ratedAt?: string
}

// Get all specialties from doctors collection
export const getSpecialties = async (): Promise<string[]> => {
  try {
    const doctorsRef = collection(db, "doctors")
    const querySnapshot = await getDocs(doctorsRef)

    const specialties = new Set<string>()
    querySnapshot.forEach((doc) => {
      const doctorData = doc.data()
      if (doctorData.specialty) {
        specialties.add(doctorData.specialty)
      }
    })

    return Array.from(specialties).sort()
  } catch (error) {
    console.error("Error getting specialties:", error)
    throw error
  }
}

// Get doctors by specialty
export const getDoctorsBySpecialty = async (specialty: string): Promise<any[]> => {
  try {
    const doctorsRef = collection(db, "doctors")
    const q = query(doctorsRef, where("specialty", "==", specialty))
    const querySnapshot = await getDocs(q)

    const doctors: any[] = []
    querySnapshot.forEach((doc) => {
      doctors.push({ id: doc.id, ...doc.data() })
    })

    return doctors
  } catch (error) {
    console.error("Error getting doctors by specialty:", error)
    throw error
  }
}

// Get doctor by ID
export const getDoctorById = async (doctorId: string): Promise<any> => {
  try {
    const docRef = doc(db, "doctors", doctorId)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() }
    } else {
      return null
    }
  } catch (error) {
    console.error("Error getting doctor:", error)
    throw error
  }
}

// Get available days for a doctor based on their working hours
export const getAvailableDaysForDoctor = (workingHours: WorkingHoursData): string[] => {
  const availableDays: string[] = []

  for (const [day, data] of Object.entries(workingHours)) {
    if (data.enabled && data.timeSlots.length > 0) {
      availableDays.push(day)
    }
  }

  return availableDays
}

// Get available time slots for a doctor on a specific day
export const getAvailableTimeSlots = async (
  doctorId: string,
  date: string,
  dayOfWeek: string,
  workingHours: WorkingHoursData,
): Promise<string[]> => {
  try {
    // Initialize time slots for this doctor and date if they don't exist
    await initializeTimeSlotsForDoctor(doctorId, date, dayOfWeek, workingHours)

    // Get available time slots
    const availableSlots = await getAvailableTimeSlotsForDoctorAndDate(doctorId, date)

    // Return just the start times
    return availableSlots.map((slot) => slot.startTime)
  } catch (error) {
    console.error("Error getting available time slots:", error)
    return []
  }
}

// Get time slot by doctor, date, and start time
export const getTimeSlot = async (doctorId: string, date: string, startTime: string): Promise<TimeSlot | null> => {
  try {
    const timeSlotsRef = collection(db, "timeSlots")
    const q = query(
      timeSlotsRef,
      where("doctorId", "==", doctorId),
      where("date", "==", date),
      where("startTime", "==", startTime),
    )
    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      return null
    }

    const doc = querySnapshot.docs[0]
    return { id: doc.id, ...doc.data() } as TimeSlot
  } catch (error) {
    console.error("Error getting time slot:", error)
    return null
  }
}

// Add this function to get appointment cost
export const getAppointmentCost = (appointmentType: AppointmentType, specialty: string): number => {
  // Base costs
  const baseCosts: Record<AppointmentType, number> = {
    "in-person": 150,
    telemedicine: 100,
  }

  // Specialty premiums (additional cost for specialized care)
  const specialtyPremiums: Record<string, number> = {
    Cardiology: 50,
    Neurology: 60,
    Orthopedics: 45,
    Dermatology: 30,
    Psychiatry: 40,
    Oncology: 70,
    "General Practice": 0,
  }

  // Calculate total cost
  const baseCost = baseCosts[appointmentType]
  const premium = specialtyPremiums[specialty] || 0

  return baseCost + premium
}

// Update the createAppointment function to include cost
export const createAppointment = async (
  appointmentData: Omit<Appointment, "id" | "createdAt" | "updatedAt">,
): Promise<string> => {
  try {
    // Validate required fields
    if (!appointmentData.patientId) {
      throw new Error("Patient ID is required")
    }
    if (!appointmentData.doctorId) {
      throw new Error("Doctor ID is required")
    }
    if (!appointmentData.date) {
      throw new Error("Appointment date is required")
    }
    if (!appointmentData.startTime) {
      throw new Error("Start time is required")
    }

    const now = new Date().toISOString()

    // Calculate appointment cost
    const appointmentCost = getAppointmentCost(
      appointmentData.type || "in-person",
      appointmentData.specialty || "General Practice",
    )

    // Ensure all required fields are present and properly formatted
    const appointmentWithTimestamps = {
      patientId: appointmentData.patientId,
      patientName: appointmentData.patientName || "",
      patientEmail: appointmentData.patientEmail || "",
      doctorId: appointmentData.doctorId,
      doctorName: appointmentData.doctorName || "",
      specialty: appointmentData.specialty || "",
      date: appointmentData.date,
      startTime: appointmentData.startTime,
      endTime: appointmentData.endTime,
      status: appointmentData.status || "scheduled",
      type: appointmentData.type || "in-person",
      reason: appointmentData.reason || "",
      notes: appointmentData.notes || "",
      cost: appointmentCost,
      isPaid: false,
      createdAt: now,
      updatedAt: now,
    }

    // First, get the time slot
    const timeSlot = await getTimeSlot(appointmentData.doctorId, appointmentData.date, appointmentData.startTime)

    if (!timeSlot) {
      throw new Error("Time slot not found or already booked")
    }

    if (timeSlot.isBooked) {
      throw new Error("This time slot is already booked")
    }

    // Create the appointment
    const docRef = await addDoc(collection(db, "appointments"), {
      ...appointmentWithTimestamps,
      timeSlotId: timeSlot.id,
    })

    // Book the time slot
    await bookTimeSlot(timeSlot.id!, docRef.id)

    return docRef.id
  } catch (error) {
    console.error("Error creating appointment:", error)
    throw error
  }
}

// Get appointments for a patient
export const getPatientAppointments = async (patientEmail: string): Promise<Appointment[]> => {
  try {
    const appointmentsRef = collection(db, "appointments")
    // Use patientEmail instead of patientId
    const q = query(appointmentsRef, where("patientEmail", "==", patientEmail))
    const querySnapshot = await getDocs(q)

    const appointments: Appointment[] = []
    querySnapshot.forEach((doc) => {
      appointments.push({ id: doc.id, ...doc.data() } as Appointment)
    })

    // Sort by date and time
    return appointments.sort((a, b) => {
      const dateComparison = a.date.localeCompare(b.date)
      if (dateComparison !== 0) return dateComparison
      return a.startTime.localeCompare(b.startTime)
    })
  } catch (error) {
    console.error("Error getting patient appointments:", error)
    throw error
  }
}

// Get appointments for a doctor
export const getDoctorAppointments = async (doctorId: string): Promise<Appointment[]> => {
  try {
    if (!doctorId) {
      console.error("getDoctorAppointments called with no doctorId")
      return []
    }

    console.log("Fetching appointments for doctor ID:", doctorId)
    const appointmentsRef = collection(db, "appointments")
    const q = query(appointmentsRef, where("doctorId", "==", doctorId))
    const querySnapshot = await getDocs(q)

    console.log("Query snapshot size:", querySnapshot.size)

    const appointments: Appointment[] = []
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      console.log("Appointment data:", data)
      appointments.push({ id: doc.id, ...data } as Appointment)
    })

    // Sort by date and time
    return appointments.sort((a, b) => {
      const dateComparison = a.date.localeCompare(b.date)
      if (dateComparison !== 0) return dateComparison
      return a.startTime.localeCompare(b.startTime)
    })
  } catch (error) {
    console.error("Error getting doctor appointments:", error)
    throw error
  }
}

// Update appointment status
export const updateAppointmentStatus = async (appointmentId: string, status: AppointmentStatus): Promise<void> => {
  try {
    const appointmentRef = doc(db, "appointments", appointmentId)

    // If cancelling, release the time slot
    if (status === "cancelled") {
      await releaseTimeSlotByAppointmentId(appointmentId)
    }

    await updateDoc(appointmentRef, {
      status,
      updatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error updating appointment status:", error)
    throw error
  }
}

// Cancel appointment
export const cancelAppointment = async (appointmentId: string): Promise<void> => {
  try {
    await updateAppointmentStatus(appointmentId, "cancelled")
  } catch (error) {
    console.error("Error cancelling appointment:", error)
    throw error
  }
}

// Delete appointment (admin only)
export const deleteAppointment = async (appointmentId: string): Promise<void> => {
  try {
    // Release the time slot first
    await releaseTimeSlotByAppointmentId(appointmentId)

    // Then delete the appointment
    const appointmentRef = doc(db, "appointments", appointmentId)
    await deleteDoc(appointmentRef)
  } catch (error) {
    console.error("Error deleting appointment:", error)
    throw error
  }
}

// Rate appointment
export const rateAppointment = async (
  appointmentId: string,
  patientId: string,
  doctorId: string,
  rating: number,
  feedback: string,
): Promise<void> => {
  try {
    const appointmentRef = doc(db, "appointments", appointmentId)
    await updateDoc(appointmentRef, {
      rating: rating,
      feedback: feedback,
      ratedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error rating appointment:", error)
    throw error
  }
}


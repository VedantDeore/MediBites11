import { db } from "./firebase"
import { collection, addDoc, query, where, getDocs, doc, updateDoc, writeBatch } from "firebase/firestore"
import type { WorkingHoursData } from "@/components/working-hours-editor"

export interface TimeSlot {
  id?: string
  doctorId: string
  date: string // ISO date string (YYYY-MM-DD)
  startTime: string // 24-hour format (HH:MM)
  endTime: string // 24-hour format (HH:MM)
  isBooked: boolean
  appointmentId?: string
}

// Convert time string (HH:MM) to minutes since midnight
const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(":").map(Number)
  return hours * 60 + minutes
}

// Convert minutes since midnight to time string (HH:MM)
const minutesToTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`
}

// Convert 12-hour format to 24-hour format
const convertTo24Hour = (time: string, period: "AM" | "PM"): string => {
  let [hours, minutes] = time.split(":").map(Number)

  if (period === "PM" && hours < 12) {
    hours += 12
  } else if (period === "AM" && hours === 12) {
    hours = 0
  }

  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`
}

// Generate time slots for a doctor based on their working hours
export const generateTimeSlotsForDoctor = async (
  doctorId: string,
  date: string,
  dayOfWeek: string,
  workingHours: WorkingHoursData,
): Promise<TimeSlot[]> => {
  try {
    // Convert dayOfWeek to lowercase for consistency
    const dayLower = dayOfWeek.toLowerCase()

    // Check if the doctor works on this day
    const dayData = workingHours[dayLower]
    if (!dayData || !dayData.enabled || !dayData.timeSlots || dayData.timeSlots.length === 0) {
      console.log(`No working hours for ${dayLower}`, workingHours)
      return []
    }

    const timeSlots: TimeSlot[] = []

    // Process each time slot in the doctor's working hours
    for (const slot of dayData.timeSlots) {
      if (!slot || !slot.start || !slot.end || !slot.startPeriod || !slot.endPeriod) {
        console.log("Invalid time slot:", slot)
        continue
      }

      // Convert to 24-hour format
      const startTime = convertTo24Hour(slot.start, slot.startPeriod as "AM" | "PM")
      const endTime = convertTo24Hour(slot.end, slot.endPeriod as "AM" | "PM")

      // Convert to minutes for easier calculation
      let startMinutes = timeToMinutes(startTime)
      const endMinutes = timeToMinutes(endTime)

      // Generate 30-minute slots
      while (startMinutes + 30 <= endMinutes) {
        const slotStart = minutesToTime(startMinutes)
        const slotEnd = minutesToTime(startMinutes + 30)

        timeSlots.push({
          doctorId,
          date,
          startTime: slotStart,
          endTime: slotEnd,
          isBooked: false,
        })

        startMinutes += 30
      }
    }

    return timeSlots
  } catch (error) {
    console.error("Error generating time slots:", error)
    return []
  }
}

// Create or update time slots for a doctor on a specific date
export const createOrUpdateTimeSlots = async (doctorId: string, date: string, timeSlots: TimeSlot[]): Promise<void> => {
  try {
    const batch = writeBatch(db)
    const existingSlots = await getTimeSlotsForDoctorAndDate(doctorId, date)
    
    const existingSlotMap = new Map<string, TimeSlot>()
    existingSlots.forEach((slot) => {
      existingSlotMap.set(slot.startTime, slot)
    })
    
    for (const slot of timeSlots) {
      const existingSlot = existingSlotMap.get(slot.startTime)
      
      if (existingSlot) {
        if (existingSlot.isBooked) continue
        
        const slotRef = doc(db, "timeSlots", existingSlot.id!)
        batch.update(slotRef, {
          endTime: slot.endTime,
          isBooked: slot.isBooked,
        })
      } else {
        const newSlotRef = doc(collection(db, "timeSlots"))
        batch.set(newSlotRef, slot)
      }
    }
    
    await batch.commit()
  } catch (error) {
    console.error("Error creating or updating time slots:", error)
    throw error
  }
}

// Get all time slots for a doctor on a specific date
export const getTimeSlotsForDoctorAndDate = async (doctorId: string, date: string): Promise<TimeSlot[]> => {
  try {
    const timeSlotsRef = collection(db, "timeSlots")
    const q = query(timeSlotsRef, where("doctorId", "==", doctorId), where("date", "==", date))
    const querySnapshot = await getDocs(q)

    const timeSlots: TimeSlot[] = []
    querySnapshot.forEach((doc) => {
      timeSlots.push({ id: doc.id, ...doc.data() } as TimeSlot)
    })

    // Sort by start time
    return timeSlots.sort((a, b) => a.startTime.localeCompare(b.startTime))
  } catch (error) {
    console.error("Error getting time slots:", error)
    throw error
  }
}

// Get available (not booked) time slots for a doctor on a specific date
export const getAvailableTimeSlotsForDoctorAndDate = async (doctorId: string, date: string): Promise<TimeSlot[]> => {
  try {
    const timeSlots = await getTimeSlotsForDoctorAndDate(doctorId, date)
    return timeSlots.filter((slot) => !slot.isBooked)
  } catch (error) {
    console.error("Error getting available time slots:", error)
    throw error
  }
}

// Book a time slot
export const bookTimeSlot = async (slotId: string, appointmentId: string): Promise<void> => {
  try {
    const slotRef = doc(db, "timeSlots", slotId)
    await updateDoc(slotRef, {
      isBooked: true,
      appointmentId,
    })
  } catch (error) {
    console.error("Error booking time slot:", error)
    throw error
  }
}

// Release a time slot (when an appointment is cancelled)
export const releaseTimeSlot = async (slotId: string): Promise<void> => {
  try {
    const slotRef = doc(db, "timeSlots", slotId)
    await updateDoc(slotRef, {
      isBooked: false,
      appointmentId: null,
    })
  } catch (error) {
    console.error("Error releasing time slot:", error)
    throw error
  }
}

// Release a time slot by appointment ID
export const releaseTimeSlotByAppointmentId = async (appointmentId: string): Promise<void> => {
  try {
    const timeSlotsRef = collection(db, "timeSlots")
    const q = query(timeSlotsRef, where("appointmentId", "==", appointmentId))
    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      console.log("No time slot found for appointment:", appointmentId)
      return
    }

    // There should only be one time slot per appointment
    const slotDoc = querySnapshot.docs[0]
    await updateDoc(doc(db, "timeSlots", slotDoc.id), {
      isBooked: false,
      appointmentId: null,
    })
  } catch (error) {
    console.error("Error releasing time slot by appointment ID:", error)
    throw error
  }
}

// Initialize time slots for a doctor on a specific date
export const initializeTimeSlotsForDoctor = async (
  doctorId: string,
  date: string,
  dayOfWeek: string,
  workingHours: WorkingHoursData,
): Promise<TimeSlot[]> => {
  try {
    // Generate time slots based on working hours
    const timeSlots = await generateTimeSlotsForDoctor(doctorId, date, dayOfWeek, workingHours)

    // Create or update the time slots in Firestore
    await createOrUpdateTimeSlots(doctorId, date, timeSlots)

    // Return the available time slots
    return await getAvailableTimeSlotsForDoctorAndDate(doctorId, date)
  } catch (error) {
    console.error("Error initializing time slots:", error)
    return []
  }
}


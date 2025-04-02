"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, FileText, MoreHorizontal, Video, User, AlertCircle, DollarSign, Star } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"
import { parseWorkingHours } from "@/components/working-hours-editor"
import { AppointmentRating } from "@/components/appointment-rating"
import {
  getSpecialties,
  getDoctorsBySpecialty,
  getDoctorById,
  getAvailableDaysForDoctor,
  getAvailableTimeSlots,
  createAppointment,
  getPatientAppointments,
  cancelAppointment,
  getAppointmentCost,
  type Appointment,
  type AppointmentType,
} from "@/lib/appointment-service"
import { getPatientBalance, processAppointmentPayment } from "@/lib/patient-firebase"
import { useToast } from "@/hooks/use-toast"
import { useMobile } from "@/hooks/use-mobile"
import { getDoc, doc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink } from '@react-pdf/renderer'
import { useRouter } from 'next/navigation'

// Add PDF styles after existing code and before the component
const pdfStyles = StyleSheet.create({
  page: {
    padding: 30,
  },
  header: {
    fontSize: 20,
    marginBottom: 20,
    textAlign: 'center',
    color: '#16a34a', // green-600
  },
  section: {
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  label: {
    fontSize: 12,
    color: '#666666',
  },
  value: {
    fontSize: 12,
  },
  total: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: '#e5e5e5',
  },
  totalText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});

// Add ReceiptPDF component before the main component
const ReceiptPDF = ({ appointment }) => (
  <Document>
    <Page size="A4" style={pdfStyles.page}>
      <Text style={pdfStyles.header}>Appointment Receipt</Text>
      
      <View style={pdfStyles.section}>
        <View style={pdfStyles.row}>
          <Text style={pdfStyles.label}>Doctor:</Text>
          <Text style={pdfStyles.value}>{appointment.doctorName}</Text>
        </View>
        <View style={pdfStyles.row}>
          <Text style={pdfStyles.label}>Specialty:</Text>
          <Text style={pdfStyles.value}>{appointment.specialty}</Text>
        </View>
        <View style={pdfStyles.row}>
          <Text style={pdfStyles.label}>Date:</Text>
          <Text style={pdfStyles.value}>
            {new Date(appointment.date).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </View>
        <View style={pdfStyles.row}>
          <Text style={pdfStyles.label}>Time:</Text>
          <Text style={pdfStyles.value}>
            {appointment.startTime} - {appointment.endTime}
          </Text>
        </View>
        <View style={pdfStyles.row}>
          <Text style={pdfStyles.label}>Type:</Text>
          <Text style={pdfStyles.value}>
            {appointment.type === 'telemedicine' ? 'Telemedicine' : 'In-person Visit'}
          </Text>
        </View>
        <View style={[pdfStyles.row, pdfStyles.total]}>
          <Text style={pdfStyles.totalText}>Total Amount:</Text>
          <Text style={pdfStyles.totalText}>
            ${appointment.cost.toFixed(2)}
          </Text>
        </View>
      </View>
    </Page>
  </Document>
);

// Update the helper function to handle the balance fetch correctly
const getPatientBalanceFromFirebase = async (patientId: string): Promise<number> => {
  try {
    console.log("Fetching balance for patient ID:", patientId); // Debug log
    const patientRef = doc(db, "patients", patientId);
    const patientDoc = await getDoc(patientRef);
    
    if (!patientDoc.exists()) {
      console.log("Patient document not found"); // Debug log
      return 0;
    }

    const patientData = patientDoc.data();
    console.log("Patient data:", patientData); // Debug log
    
    // Ensure we're getting a number value for balance
    const balance = Number(patientData.balance) || 0;
    console.log("Parsed balance:", balance); // Debug log
    
    return balance;
  } catch (error) {
    console.error("Error fetching patient balance:", error);
    return 0;
  }
}

// Inside the component, add the isMobile hook
export default function AppointmentsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isBookingOpen, setIsBookingOpen] = useState(false)
  const [isPaymentOpen, setIsPaymentOpen] = useState(false)
  const [isRatingOpen, setIsRatingOpen] = useState(false)
  const [appointmentType, setAppointmentType] = useState<AppointmentType>("in-person")
  const [balance, setBalance] = useState<number>(0)
  const [appointmentCost, setAppointmentCost] = useState<number>(0)
  const isMobile = useMobile()
  const router = useRouter()

  // Booking form state
  const [specialties, setSpecialties] = useState<string[]>([])
  const [doctors, setDoctors] = useState<any[]>([])
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>("")
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null)
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>("")
  const [availableDays, setAvailableDays] = useState<string[]>([])
  const [selectedDate, setSelectedDate] = useState<string>("")
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([])
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>("")
  const [reason, setReason] = useState<string>("")

  // Loading states
  const [loadingSpecialties, setLoadingSpecialties] = useState(false)
  const [loadingDoctors, setLoadingDoctors] = useState(false)
  const [loadingTimeSlots, setLoadingTimeSlots] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [loadingBalance, setLoadingBalance] = useState(false)
  const [processingPayment, setProcessingPayment] = useState(false)

  // Appointments state
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([])
  const [pastAppointments, setPastAppointments] = useState<Appointment[]>([])
  const [loadingAppointments, setLoadingAppointments] = useState(false)
  const [bookingError, setBookingError] = useState<string | null>(null)

  // Load specialties on mount
  useEffect(() => {
    const fetchSpecialties = async () => {
      if (user) {
        setLoadingSpecialties(true)
        try {
          const fetchedSpecialties = await getSpecialties()
          setSpecialties(fetchedSpecialties)
        } catch (error) {
          console.error("Error fetching specialties:", error)
        } finally {
          setLoadingSpecialties(false)
        }
      }
    }

    fetchSpecialties()
  }, [user])

  // Load appointments on mount
  useEffect(() => {
    const fetchAppointments = async () => {
      if (user) {
        setLoadingAppointments(true)
        try {
          // Use email as patient ID
          const appointments = await getPatientAppointments(user.email)

          const now = new Date()
          const upcoming = appointments.filter((appointment) => {
            const appointmentDate = new Date(`${appointment.date}T${appointment.startTime}`)
            return appointmentDate >= now && appointment.status !== "cancelled"
          })

          const past = appointments.filter((appointment) => {
            const appointmentDate = new Date(`${appointment.date}T${appointment.startTime}`)
            return appointmentDate < now || appointment.status === "cancelled"
          })

          setUpcomingAppointments(upcoming)
          setPastAppointments(past)
        } catch (error) {
          console.error("Error fetching appointments:", error)
        } finally {
          setLoadingAppointments(false)
        }
      }
    }

    fetchAppointments()
  }, [user])

  // Update the balance fetching useEffect
  useEffect(() => {
    const fetchBalance = async () => {
      if (!user?.id) {
        console.log("No user ID available"); // Debug log
        return;
      }

      setLoadingBalance(true);
      try {
        console.log("Fetching balance for user ID:", user.id); // Debug log
        const currentBalance = await getPatientBalanceFromFirebase(user.id);
        console.log("Fetched balance:", currentBalance); // Debug log
        setBalance(currentBalance);
      } catch (error) {
        console.error("Error fetching balance:", error);
        toast({
          title: "Error",
          description: "Failed to fetch your current balance",
          variant: "destructive",
        });
      } finally {
        setLoadingBalance(false);
      }
    };

    fetchBalance();
  }, [user?.id, toast]); // Add proper dependency

  // Update appointment cost when specialty or type changes
  useEffect(() => {
    if (selectedSpecialty) {
      const cost = getAppointmentCost(appointmentType, selectedSpecialty)
      setAppointmentCost(cost)
    }
  }, [appointmentType, selectedSpecialty])

  // Load doctors when specialty changes
  useEffect(() => {
    const fetchDoctors = async () => {
      if (selectedSpecialty) {
        setLoadingDoctors(true)
        try {
          const fetchedDoctors = await getDoctorsBySpecialty(selectedSpecialty)
          setDoctors(fetchedDoctors)
        } catch (error) {
          console.error("Error fetching doctors:", error)
        } finally {
          setLoadingDoctors(false)
        }
      } else {
        setDoctors([])
      }
    }

    fetchDoctors()
  }, [selectedSpecialty])

  // Load doctor details and available days when doctor changes
  useEffect(() => {
    const fetchDoctorDetails = async () => {
      if (selectedDoctorId) {
        try {
          const doctor = await getDoctorById(selectedDoctorId)
          setSelectedDoctor(doctor)

          // Parse working hours - handle both string and object formats
          let workingHours
          try {
            workingHours = parseWorkingHours(doctor.workingHours)
            console.log("Parsed working hours:", workingHours)
            const days = getAvailableDaysForDoctor(workingHours)
            setAvailableDays(days)
          } catch (error) {
            console.error("Error parsing working hours:", error)
            setAvailableDays([])
          }
        } catch (error) {
          console.error("Error fetching doctor details:", error)
          setSelectedDoctor(null)
          setAvailableDays([])
        }
      } else {
        setSelectedDoctor(null)
        setAvailableDays([])
      }
    }

    fetchDoctorDetails()
  }, [selectedDoctorId])

  // Load available time slots when date changes
  useEffect(() => {
    const fetchTimeSlots = async () => {
      if (selectedDoctor && selectedDate) {
        setLoadingTimeSlots(true)
        try {
          // Get day of week from selected date
          const date = new Date(selectedDate)
          const dayOfWeek = date.toLocaleDateString("en-US", { weekday: "long" })
          console.log("Selected day:", dayOfWeek)

          // Parse working hours
          let workingHours
          try {
            workingHours = parseWorkingHours(selectedDoctor.workingHours)

            // Get available time slots
            const slots = await getAvailableTimeSlots(selectedDoctor.id, selectedDate, dayOfWeek, workingHours)

            setAvailableTimeSlots(slots)
          } catch (error) {
            console.error("Error with working hours:", error)
            setAvailableTimeSlots([])
          }
        } catch (error) {
          console.error("Error fetching time slots:", error)
          setAvailableTimeSlots([])
        } finally {
          setLoadingTimeSlots(false)
        }
      } else {
        setAvailableTimeSlots([])
      }
    }

    fetchTimeSlots()
  }, [selectedDoctor, selectedDate])

  // Handle booking form submission
  const handleBookAppointment = async () => {
    if (!user) {
      setBookingError("You must be logged in to book an appointment")
      return
    }

    if (!selectedDoctor) {
      setBookingError("Please select a doctor")
      return
    }

    if (!selectedDate) {
      setBookingError("Please select a date")
      return
    }

    if (!selectedTimeSlot) {
      setBookingError("Please select a time slot")
      return
    }

    setSubmitting(true)
    setBookingError(null)

    try {
      // Calculate end time (30 minutes after start time)
      const [hours, minutes] = selectedTimeSlot.split(":").map(Number)
      const startDate = new Date()
      startDate.setHours(hours, minutes, 0, 0)

      const endDate = new Date(startDate)
      endDate.setMinutes(endDate.getMinutes() + 30)

      const endTime = `${endDate.getHours().toString().padStart(2, "0")}:${endDate.getMinutes().toString().padStart(2, "0")}`

      // Log user information for debugging
      console.log("User:", user)
      console.log("User email:", user.email)
      console.log("Doctor ID:", selectedDoctor.id)

      // Create appointment using email as patient ID
      const appointmentData = {
        patientId: user.email, // Use email as patient ID
        patientName: user.name || user.email.split("@")[0],
        patientEmail: user.email,
        doctorId: selectedDoctor.id,
        doctorName: selectedDoctor.name || "Dr. Unknown", // Fallback if name is missing
        specialty: selectedDoctor.specialty || selectedSpecialty, // Use selected specialty as fallback
        date: selectedDate,
        startTime: selectedTimeSlot,
        endTime,
        status: "scheduled" as const,
        type: appointmentType,
        reason: reason || "General consultation",
        notes: "", // Initialize empty notes
      }

      console.log("Creating appointment with data:", appointmentData)

      const appointmentId = await createAppointment(appointmentData)
      console.log("Appointment created with ID:", appointmentId)

      // Close booking dialog and open payment dialog
      setIsBookingOpen(false)

      // Set the selected appointment for payment
      const newAppointment = {
        ...appointmentData,
        id: appointmentId,
        cost: getAppointmentCost(appointmentType, selectedSpecialty),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      setSelectedAppointment(newAppointment as Appointment)
      setIsPaymentOpen(true)

      // Reset booking form
      resetBookingForm()
    } catch (error) {
      console.error("Error booking appointment:", error)
      setBookingError(`Failed to book appointment: ${error.message || "Please try again."}`)
      setSubmitting(false)
    }
  }

  // Update the payment handler
  const handlePayForAppointment = async () => {
    if (!user?.id || !selectedAppointment?.id) {
      toast({
        title: "Error",
        description: "Missing user or appointment information",
        variant: "destructive",
      });
      return;
    }

    const cost = selectedAppointment.cost || 
      getAppointmentCost(selectedAppointment.type, selectedAppointment.specialty);

    setProcessingPayment(true);
    try {
      // Get current balance
      const patientRef = doc(db, "patients", user.id);
      const patientDoc = await getDoc(patientRef);
      
      if (!patientDoc.exists()) {
        throw new Error("Patient not found");
      }

      const currentBalance = patientDoc.data().balance || 0;

      if (currentBalance < cost) {
        toast({
          title: "Insufficient funds",
          description: `Your balance of $${currentBalance.toFixed(2)} is less than the appointment cost of $${cost.toFixed(2)}`,
          variant: "destructive",
        });
        return;
      }

      // Calculate new balance
      const newBalance = currentBalance - cost;

      // Update patient's balance
      await updateDoc(patientRef, {
        balance: newBalance
      });

      // Update appointment as paid
      const appointmentRef = doc(db, "appointments", selectedAppointment.id);
      await updateDoc(appointmentRef, {
        isPaid: true,
        paymentDate: new Date().toISOString()
      });

      // Update local state
      setBalance(newBalance);
      setUpcomingAppointments(prev => 
        prev.map(apt => apt.id === selectedAppointment.id ? { ...apt, isPaid: true } : apt)
      );

      toast({
        title: "Payment successful",
        description: `Payment completed. Your new balance is $${newBalance.toFixed(2)}`,
      });

      setIsPaymentOpen(false);
    } catch (error: any) {
      console.error("Payment processing error:", error);
      toast({
        title: "Payment failed",
        description: error.message || "There was an error processing your payment",
        variant: "destructive",
      });
    } finally {
      setProcessingPayment(false);
    }
  };

  // Handle appointment cancellation
  const handleCancelAppointment = async (appointmentId: string) => {
    if (!appointmentId || !user) return

    try {
      await cancelAppointment(appointmentId)

      // Refresh appointments using email as patient ID
      const appointments = await getPatientAppointments(user.email)

      const now = new Date()
      const upcoming = appointments.filter((appointment) => {
        const appointmentDate = new Date(`${appointment.date}T${appointment.startTime}`)
        return appointmentDate >= now && appointment.status !== "cancelled"
      })

      const past = appointments.filter((appointment) => {
        const appointmentDate = new Date(`${appointment.date}T${appointment.startTime}`)
        return appointmentDate < now || appointment.status === "cancelled"
      })

      setUpcomingAppointments(upcoming)
      setPastAppointments(past)
    } catch (error) {
      console.error("Error cancelling appointment:", error)
    }
  }

  // Reset booking form
  const resetBookingForm = () => {
    setSelectedSpecialty("")
    setSelectedDoctorId("")
    setSelectedDoctor(null)
    setSelectedDate("")
    setSelectedTimeSlot("")
    setAppointmentType("in-person")
    setReason("")
    setBookingError(null)
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date)
  }

  // Format time for display
  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(":").map(Number)
    const period = hours >= 12 ? "PM" : "AM"
    const hour12 = hours % 12 || 12
    return `${hour12}:${minutes.toString().padStart(2, "0")} ${period}`
  }

  // Get day name from date
  const getDayName = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", { weekday: "long" })
  }

  // Get status badge color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "scheduled":
        return <Badge className="bg-blue-100 text-blue-800">Scheduled</Badge>
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>
      case "cancelled":
        return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>
      case "no-show":
        return <Badge className="bg-amber-100 text-amber-800">No Show</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  // Handle rating completion
  const handleRatingCompleted = async () => {
    // Refresh appointments
    if (user) {
      const appointments = await getPatientAppointments(user.email)

      const now = new Date()
      const upcoming = appointments.filter((appointment) => {
        const appointmentDate = new Date(`${appointment.date}T${appointment.startTime}`)
        return appointmentDate >= now && appointment.status !== "cancelled"
      })

      const past = appointments.filter((appointment) => {
        const appointmentDate = new Date(`${appointment.date}T${appointment.startTime}`)
        return appointmentDate < now || appointment.status === "cancelled"
      })

      setUpcomingAppointments(upcoming)
      setPastAppointments(past)
    }
  }

  if (!user) {
    return null
  }

  // In the return statement, update the grid layout to be responsive
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Appointments</h1>
          <p className="text-muted-foreground">Manage your upcoming and past appointments</p>
        </div>
        <Button className="bg-green-600 hover:bg-green-700" onClick={() => setIsBookingOpen(true)}>
          Book New Appointment
        </Button>
      </div>

      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upcoming">Upcoming Appointments</TabsTrigger>
          <TabsTrigger value="past">Past Appointments</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-4 mt-4">
          {loadingAppointments ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-green-600" />
            </div>
          ) : upcomingAppointments.length > 0 ? (
            <div className="grid gap-4">
              {upcomingAppointments.map((appointment) => (
                <Card key={appointment.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex flex-col md:flex-row">
                      <div className="bg-green-50 p-4 md:p-6 flex flex-row md:flex-col justify-between md:justify-center items-center md:w-48">
                        <div className="text-center">
                          <div className="text-green-600 font-bold text-xl">
                            {new Date(appointment.date).toLocaleDateString("en-US", { month: "short" })}
                          </div>
                          <div className="text-3xl font-bold">{new Date(appointment.date).getDate()}</div>
                          <div className="text-muted-foreground">{getDayName(appointment.date)}</div>
                        </div>
                        <div className="md:mt-2">
                          {appointment.isPaid ? (
                            <Badge className="bg-green-100 text-green-800">
                              <DollarSign className="h-3 w-3 mr-1" />
                              Paid
                            </Badge>
                          ) : (
                            <Badge className="bg-amber-100 text-amber-800">
                              <DollarSign className="h-3 w-3 mr-1" />
                              Unpaid
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="p-4 md:p-6 flex-1">
                        <div className="flex flex-col md:flex-row justify-between mb-4">
                          <div>
                            <h3 className="font-bold text-lg">{appointment.doctorName}</h3>
                            <p className="text-muted-foreground">{appointment.specialty}</p>
                          </div>
                          <div className="flex items-center mt-2 md:mt-0">
                            <Clock className="h-4 w-4 text-muted-foreground mr-1" />
                            <span>{formatTime(appointment.startTime)}</span>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mb-4">
                          {getStatusBadge(appointment.status)}
                          {appointment.type === "telemedicine" ? (
                            <Badge variant="outline" className="bg-purple-50 text-purple-700">
                              <Video className="h-3 w-3 mr-1" />
                              Telemedicine
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700">
                              <User className="h-3 w-3 mr-1" />
                              In-person
                            </Badge>
                          )}
                          {appointment.cost && (
                            <Badge variant="outline" className="bg-gray-50 text-gray-700">
                              <DollarSign className="h-3 w-3 mr-1" />${appointment.cost.toFixed(2)}
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2 mt-4">
                          <Button
                            variant="outline"
                            className="flex items-center gap-2"
                            onClick={() => {
                              setSelectedAppointment(appointment)
                              setIsDetailsOpen(true)
                            }}
                          >
                            <FileText className="h-4 w-4" />
                            <span className={isMobile ? "sr-only" : ""}>View Details</span>
                          </Button>
                          {appointment.type === "telemedicine" && (
                            <Button 
                              variant="outline" 
                              className="flex items-center gap-2"
                              onClick={() => router.push(`/dashboard/telemedicine/${appointment.id}`)}
                            >
                              <Video className="h-4 w-4" />
                              Join Video Call
                            </Button>
                          )}
                          {!appointment.isPaid && (
                            <Button
                              className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
                              onClick={() => {
                                setSelectedAppointment(appointment)
                                setIsPaymentOpen(true)
                              }}
                            >
                              <DollarSign className="h-4 w-4" />
                              <span className={isMobile ? "sr-only" : ""}>Pay</span>
                            </Button>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>Reschedule</DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => appointment.id && handleCancelAppointment(appointment.id)}
                              >
                                Cancel Appointment
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Upcoming Appointments</h3>
                <p className="text-muted-foreground text-center max-w-md mb-6">
                  You don't have any upcoming appointments scheduled. Would you like to book a new appointment?
                </p>
                <Button className="bg-green-600 hover:bg-green-700" onClick={() => setIsBookingOpen(true)}>
                  Book Appointment
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="past" className="space-y-4 mt-4">
          {loadingAppointments ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-green-600" />
            </div>
          ) : pastAppointments.length > 0 ? (
            <div className="grid gap-4">
              {pastAppointments.map((appointment) => (
                <Card key={appointment.id}>
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row justify-between mb-4">
                      <div>
                        <h3 className="font-bold text-lg">{appointment.doctorName}</h3>
                        <p className="text-muted-foreground">{appointment.specialty}</p>
                      </div>
                      <div className="flex items-center mt-2 md:mt-0">
                        <Calendar className="h-4 w-4 text-muted-foreground mr-1" />
                        <span>
                          {formatDate(appointment.date)}, {formatTime(appointment.startTime)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mb-4">
                      {getStatusBadge(appointment.status)}
                      {appointment.type === "telemedicine" ? (
                        <Badge variant="outline" className="bg-purple-50 text-purple-700">
                          <Video className="h-3 w-3 mr-1" />
                          Telemedicine
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700">
                          <User className="h-3 w-3 mr-1" />
                          In-person
                        </Badge>
                      )}
                      {appointment.isPaid ? (
                        <Badge className="bg-green-100 text-green-800">
                          <DollarSign className="h-3 w-3 mr-1" />
                          Paid
                        </Badge>
                      ) : (
                        <Badge className="bg-amber-100 text-amber-800">
                          <DollarSign className="h-3 w-3 mr-1" />
                          Unpaid
                        </Badge>
                      )}
                      {appointment.rating && (
                        <Badge className="bg-yellow-100 text-yellow-800">
                          <Star className="h-3 w-3 mr-1 fill-yellow-500" />
                          {appointment.rating}/5
                        </Badge>
                      )}
                    </div>
                    {appointment.notes && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium mb-2">Doctor's Notes</h4>
                        <p className="text-sm text-muted-foreground">{appointment.notes}</p>
                      </div>
                    )}
                    {appointment.feedback && (
                      <div className="mt-4 p-4 bg-purple-50 rounded-lg">
                        <h4 className="font-medium mb-2">Your Feedback</h4>
                        <p className="text-sm text-muted-foreground">{appointment.feedback}</p>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2 mt-4">
                      <Button
                        variant="outline"
                        className="flex items-center gap-2"
                        onClick={() => {
                          setSelectedAppointment(appointment)
                          setIsDetailsOpen(true)
                        }}
                      >
                        <FileText className="h-4 w-4" />
                        View Details
                      </Button>
                      {appointment.status === "completed" && !appointment.rating && (
                        <Button
                          className="bg-yellow-600 hover:bg-yellow-700 flex items-center gap-2"
                          onClick={() => {
                            setSelectedAppointment(appointment)
                            setIsRatingOpen(true)
                          }}
                        >
                          <Star className="h-4 w-4" />
                          Rate Visit
                        </Button>
                      )}
                      <Button variant="outline" onClick={() => setIsBookingOpen(true)}>
                        Book Follow-up
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Past Appointments</h3>
                <p className="text-muted-foreground text-center max-w-md">
                  You don't have any past appointment records in our system.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        {/* Keep the rest of the tabs content... */}
      </Tabs>

      {/* Appointment Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Appointment Details</DialogTitle>
            <DialogDescription>{selectedAppointment && formatDate(selectedAppointment.date)}</DialogDescription>
          </DialogHeader>

          {selectedAppointment && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-green-100 text-green-600">
                    {selectedAppointment.doctorName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-medium">{selectedAppointment.doctorName}</h3>
                  <p className="text-sm text-muted-foreground">{selectedAppointment.specialty}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Date</p>
                  <p className="text-sm">{formatDate(selectedAppointment.date)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Time</p>
                  <p className="text-sm">
                    {formatTime(selectedAppointment.startTime)} - {formatTime(selectedAppointment.endTime)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Status</p>
                  <div className="mt-1">{getStatusBadge(selectedAppointment.status)}</div>
                </div>
                <div>
                  <p className="text-sm font-medium">Type</p>
                  <p className="text-sm">
                    {selectedAppointment.type === "telemedicine" ? "Telemedicine" : "In-person Visit"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Cost</p>
                  <p className="text-sm font-semibold">
                    $
                    {(
                      selectedAppointment.cost ||
                      getAppointmentCost(selectedAppointment.type, selectedAppointment.specialty)
                    ).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Payment Status</p>
                  <div className="mt-1">
                    {selectedAppointment.isPaid ? (
                      <Badge className="bg-green-100 text-green-800">Paid</Badge>
                    ) : (
                      <Badge className="bg-amber-100 text-amber-800">Unpaid</Badge>
                    )}
                  </div>
                </div>
              </div>

              {selectedAppointment.reason && (
                <div>
                  <p className="text-sm font-medium">Reason for Visit</p>
                  <p className="text-sm text-muted-foreground mt-1">{selectedAppointment.reason}</p>
                </div>
              )}

              {selectedAppointment.notes && (
                <div>
                  <p className="text-sm font-medium">Doctor's Notes</p>
                  <p className="text-sm text-muted-foreground mt-1">{selectedAppointment.notes}</p>
                </div>
              )}

              {selectedAppointment.rating && (
                <div>
                  <p className="text-sm font-medium">Your Rating</p>
                  <div className="flex items-center mt-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-4 w-4 ${
                          star <= selectedAppointment.rating! ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
                        }`}
                      />
                    ))}
                    <span className="ml-2 text-sm">{selectedAppointment.rating}/5</span>
                  </div>
                  {selectedAppointment.feedback && (
                    <p className="text-sm text-muted-foreground mt-1">{selectedAppointment.feedback}</p>
                  )}
                </div>
              )}
            </div>
          )}

          <DialogFooter className="flex justify-between sm:justify-between">
            <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>
              Close
            </Button>
            {selectedAppointment && !selectedAppointment.isPaid && (
              <Button
                className="bg-green-600 hover:bg-green-700"
                onClick={() => {
                  setIsDetailsOpen(false)
                  setIsPaymentOpen(true)
                }}
              >
                Pay Now
              </Button>
            )}
            {selectedAppointment && selectedAppointment.isPaid && selectedAppointment.cost && (
              <PDFDownloadLink
                document={<ReceiptPDF appointment={selectedAppointment} />}
                fileName={`receipt-${selectedAppointment.id}.pdf`}
              >
                {({ loading }) => (
                  <Button 
                    className="bg-green-600 hover:bg-green-700"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      'Download Receipt'
                    )}
                  </Button>
                )}
              </PDFDownloadLink>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Book Appointment Dialog */}
      <Dialog
        open={isBookingOpen}
        onOpenChange={(open) => {
          setIsBookingOpen(open)
          if (!open) resetBookingForm()
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Book New Appointment</DialogTitle>
            <DialogDescription>Fill in the details to schedule your appointment</DialogDescription>
          </DialogHeader>

          {bookingError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{bookingError}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Appointment Type</label>
              <div className="flex gap-4">
                <div
                  className={`flex-1 p-4 border rounded-lg cursor-pointer flex flex-col items-center gap-2 ${
                    appointmentType === "in-person" ? "border-green-600 bg-green-50" : ""
                  }`}
                  onClick={() => setAppointmentType("in-person")}
                >
                  <div
                    className={`p-2 rounded-full ${appointmentType === "in-person" ? "bg-green-100" : "bg-gray-100"}`}
                  >
                    <User
                      className={`h-5 w-5 ${appointmentType === "in-person" ? "text-green-600" : "text-gray-500"}`}
                    />
                  </div>
                  <span className="text-sm font-medium">In-Person Visit</span>
                  <span className="text-xs text-muted-foreground">$150+</span>
                </div>
                <div
                  className={`flex-1 p-4 border rounded-lg cursor-pointer flex flex-col items-center gap-2 ${
                    appointmentType === "telemedicine" ? "border-green-600 bg-green-50" : ""
                  }`}
                  onClick={() => setAppointmentType("telemedicine")}
                >
                  <div
                    className={`p-2 rounded-full ${appointmentType === "telemedicine" ? "bg-green-100" : "bg-gray-100"}`}
                  >
                    <Video
                      className={`h-5 w-5 ${appointmentType === "telemedicine" ? "text-green-600" : "text-gray-500"}`}
                    />
                  </div>
                  <span className="text-sm font-medium">Telemedicine</span>
                  <span className="text-xs text-muted-foreground">$100+</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Specialty</label>
              <Select value={selectedSpecialty} onValueChange={setSelectedSpecialty}>
                <SelectTrigger>
                  <SelectValue placeholder="Select specialty" />
                </SelectTrigger>
                <SelectContent>
                  {loadingSpecialties ? (
                    <div className="flex justify-center p-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  ) : (
                    specialties.map((specialty) => (
                      <SelectItem key={specialty} value={specialty}>
                        {specialty}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {selectedSpecialty && (
              <div className="p-3 bg-blue-50 rounded-md flex items-center justify-between">
                <div className="text-sm">
                  <span className="font-medium">Estimated cost: </span>
                  <span className="text-green-700">${appointmentCost.toFixed(2)}</span>
                </div>
                <div className="text-xs text-muted-foreground">Your balance: ${balance.toFixed(2)}</div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Doctor</label>
              <Select
                value={selectedDoctorId}
                onValueChange={setSelectedDoctorId}
                disabled={!selectedSpecialty || loadingDoctors}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select doctor" />
                </SelectTrigger>
                <SelectContent>
                  {loadingDoctors ? (
                    <div className="flex justify-center p-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  ) : doctors.length > 0 ? (
                    doctors.map((doctor) => (
                      <SelectItem key={doctor.id} value={doctor.id}>
                        {doctor.name}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="p-2 text-sm text-muted-foreground">No doctors available for this specialty</div>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Date</label>
              <Select
                value={selectedDate}
                onValueChange={setSelectedDate}
                disabled={!selectedDoctor || availableDays.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select date" />
                </SelectTrigger>
                <SelectContent>
                  {availableDays.length > 0 ? (
                    // Generate next 14 days for available days of week
                    Array.from({ length: 14 })
                      .map((_, i) => {
                        const date = new Date()
                        date.setDate(date.getDate() + i)
                        const dateString = date.toISOString().split("T")[0]
                        const dayName = date.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase()

                        // Only show dates that match available days
                        if (availableDays.includes(dayName)) {
                          return (
                            <SelectItem key={dateString} value={dateString}>
                              {formatDate(dateString)} ({date.toLocaleDateString("en-US", { weekday: "long" })})
                            </SelectItem>
                          )
                        }
                        return null
                      })
                      .filter(Boolean)
                  ) : (
                    <div className="p-2 text-sm text-muted-foreground">No available days for this doctor</div>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Time</label>
              <Select
                value={selectedTimeSlot}
                onValueChange={setSelectedTimeSlot}
                disabled={!selectedDate || loadingTimeSlots}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select time" />
                </SelectTrigger>
                <SelectContent>
                  {loadingTimeSlots ? (
                    <div className="flex justify-center p-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  ) : availableTimeSlots.length > 0 ? (
                    availableTimeSlots.map((timeSlot) => {
                      // Calculate end time properly (30 minutes after start time)
                      const [hours, minutes] = timeSlot.split(":").map(Number)
                      const endDate = new Date()
                      endDate.setHours(hours, minutes + 30, 0, 0)
                      const endTime = `${endDate.getHours().toString().padStart(2, "0")}:${endDate.getMinutes().toString().padStart(2, "0")}`

                      return (
                        <SelectItem key={timeSlot} value={timeSlot}>
                          {formatTime(timeSlot)} - {formatTime(endTime)}
                        </SelectItem>
                      )
                    })
                  ) : (
                    <div className="p-2 text-sm text-muted-foreground">No available time slots for this date</div>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Reason for Visit</label>
              <Textarea
                placeholder="Briefly describe your symptoms or reason for the appointment"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                resetBookingForm()
                setIsBookingOpen(false)
              }}
            >
              Cancel
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={handleBookAppointment}
              disabled={submitting || !selectedDoctor || !selectedDate || !selectedTimeSlot}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Booking...
                </>
              ) : (
                "Book Appointment"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Payment for Appointment</DialogTitle>
            <DialogDescription>
              Complete payment for your appointment with {selectedAppointment?.doctorName}
            </DialogDescription>
          </DialogHeader>

          {selectedAppointment && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Appointment Type:</span>
                  <span className="text-sm">
                    {selectedAppointment.type === "telemedicine" ? "Telemedicine" : "In-person Visit"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Date & Time:</span>
                  <span className="text-sm">
                    {formatDate(selectedAppointment.date)}, {formatTime(selectedAppointment.startTime)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Doctor:</span>
                  <span className="text-sm">{selectedAppointment.doctorName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Specialty:</span>
                  <span className="text-sm">{selectedAppointment.specialty}</span>
                </div>
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between font-medium">
                    <span>Total Amount:</span>
                    <span className="text-green-700">
                      $
                      {(
                        selectedAppointment.cost ||
                        getAppointmentCost(selectedAppointment.type, selectedAppointment.specialty)
                      ).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium">Your Current Balance</p>
                    <p className="text-xl font-bold">${balance.toFixed(2)}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-blue-500" />
                </div>
              </div>

              {balance <
                (selectedAppointment.cost ||
                  getAppointmentCost(selectedAppointment.type, selectedAppointment.specialty)) && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Insufficient funds</AlertTitle>
                  <AlertDescription>
                    Your current balance is not enough to pay for this appointment. Please add funds to your account.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPaymentOpen(false)} disabled={processingPayment}>
              Cancel
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={handlePayForAppointment}
              disabled={
                processingPayment ||
                !selectedAppointment ||
                balance <
                  (selectedAppointment?.cost ||
                    getAppointmentCost(
                      selectedAppointment?.type || "in-person",
                      selectedAppointment?.specialty || "General Practice",
                    ))
              }
            >
              {processingPayment ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Pay Now"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rating Dialog */}
      {selectedAppointment && (
        <AppointmentRating
          isOpen={isRatingOpen}
          onClose={() => setIsRatingOpen(false)}
          appointmentId={selectedAppointment.id || ""}
          doctorId={selectedAppointment.doctorId}
          doctorName={selectedAppointment.doctorName}
          onRatingSubmitted={handleRatingCompleted}
        />
      )}
    </div>
  )
}


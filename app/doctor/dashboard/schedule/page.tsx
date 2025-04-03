"use client"

import { useState, useEffect } from "react"
import { useDoctorAuth } from "@/lib/doctor-auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ChevronLeft, ChevronRight, Clock, Plus, User, Video, Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { getDoctorAppointments, updateAppointmentStatus, type Appointment } from "@/lib/appointment-service"

export default function DoctorSchedulePage() {
  const { doctor } = useDoctorAuth()
  const [currentWeek, setCurrentWeek] = useState<Date>(new Date())
  const [selectedDay, setSelectedDay] = useState<string>(new Date().toISOString().split("T")[0])
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [appointmentTypeFilter, setAppointmentTypeFilter] = useState<string>("all")
  const [specialtyFilter, setSpecialtyFilter] = useState<string>("all")
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [isAppointmentDetailsOpen, setIsAppointmentDetailsOpen] = useState(false)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load appointments
  useEffect(() => {
    const fetchAppointments = async () => {
      if (doctor && doctor.uid) {
        setLoading(true)
        setError(null)
        try {
          console.log("Fetching appointments for doctor:", doctor.uid)
          const fetchedAppointments = await getDoctorAppointments(doctor.uid)
          console.log("Fetched appointments:", fetchedAppointments)
          setAppointments(fetchedAppointments)
        } catch (error) {
          console.error("Error fetching appointments:", error)
          setError("Failed to load appointments. Please try again.")
        } finally {
          setLoading(false)
        }
      } else {
        console.log("Doctor not authenticated or missing UID")
        setError("Please log in to view your schedule")
      }
    }

    fetchAppointments()
  }, [doctor])

  // Function to generate days of the week
  function getDaysOfWeek(startDate: Date): { date: string; dayName: string }[] {
    const days = []
    const currentDate = new Date(startDate)

    // Adjust to start from Monday if not already
    const dayOfWeek = currentDate.getDay()
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek // If Sunday, go back 6 days, otherwise adjust to Monday
    currentDate.setDate(currentDate.getDate() + diff)

    for (let i = 0; i < 7; i++) {
      const date = new Date(currentDate)
      date.setDate(currentDate.getDate() + i)
      days.push({
        date: date.toISOString().split("T")[0],
        dayName: new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(date),
      })
    }
    return days
  }

  // Navigate to previous week
  const goToPreviousWeek = () => {
    const prevWeek = new Date(currentWeek)
    prevWeek.setDate(prevWeek.getDate() - 7)
    setCurrentWeek(prevWeek)
  }

  // Navigate to next week
  const goToNextWeek = () => {
    const nextWeek = new Date(currentWeek)
    nextWeek.setDate(nextWeek.getDate() + 7)
    setCurrentWeek(nextWeek)
  }

  // Go to current week
  const goToCurrentWeek = () => {
    setCurrentWeek(new Date())
    setSelectedDay(new Date().toISOString().split("T")[0])
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
    }).format(date)
  }

  // Format time for display
  const formatTime = (timeString: string) => {
    if (!timeString) return "N/A"

    const [hours, minutes] = timeString.split(":").map(Number)
    const period = hours >= 12 ? "PM" : "AM"
    const hour12 = hours % 12 || 12
    return `${hour12}:${minutes.toString().padStart(2, "0")} ${period}`
  }

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-100 text-blue-800"
      case "completed":
        return "bg-green-100 text-green-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      case "no-show":
        return "bg-amber-100 text-amber-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // Filter appointments based on selected filters and day
  const filteredAppointments = appointments.filter((apt) => {
    const dayMatch = apt.date === selectedDay
    const statusMatch = statusFilter === "all" || apt.status === statusFilter
    const typeMatch = appointmentTypeFilter === "all" || apt.type === appointmentTypeFilter
    const specialtyMatch = specialtyFilter === "all" || apt.specialty === specialtyFilter
    return dayMatch && statusMatch && typeMatch && specialtyMatch
  })

  // Group appointments by time slot for the selected day
  const getTimeSlots = () => {
    const timeSlots = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"]

    return timeSlots.map((time) => {
      const slotAppointments = appointments.filter((apt) => {
        // Check if appointment starts at this time slot
        const aptHour = apt.startTime?.split(":")?.[0]
        const slotHour = time.split(":")[0]
        return apt.date === selectedDay && aptHour === slotHour
      })

      return {
        time,
        appointments: slotAppointments,
      }
    })
  }

  // Handle appointment click
  const handleAppointmentClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment)
    setIsAppointmentDetailsOpen(true)
  }

  // Handle appointment status update
  const handleUpdateStatus = async (appointmentId: string, status: "completed" | "cancelled" | "no-show") => {
    if (!appointmentId) return

    setSubmitting(true)
    try {
      await updateAppointmentStatus(appointmentId, status)

      // Update local state
      setAppointments((prevAppointments) =>
        prevAppointments.map((appointment) =>
          appointment.id === appointmentId ? { ...appointment, status } : appointment,
        ),
      )

      // If the selected appointment is being updated, update it too
      if (selectedAppointment && selectedAppointment.id === appointmentId) {
        setSelectedAppointment({ ...selectedAppointment, status })
      }

      // Close the dialog
      setIsAppointmentDetailsOpen(false)
    } catch (error) {
      console.error("Error updating appointment status:", error)
    } finally {
      setSubmitting(false)
    }
  }

  // Get today's appointments
  const todayAppointments = appointments.filter(
    (appointment) => appointment.date === new Date().toISOString().split("T")[0],
  )

  // Get upcoming appointments (not completed, cancelled, or no-show)
  const upcomingAppointments = appointments.filter((apt) => apt.status === "scheduled")

  // Get completed appointments
  const completedAppointments = appointments.filter((apt) => apt.status === "completed")

  // Get cancelled appointments
  const cancelledAppointments = appointments.filter((apt) => apt.status === "cancelled")

  if (!doctor) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-green-600 mb-4" />
        <p className="text-muted-foreground">Loading doctor profile...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Schedule</h1>
          <p className="text-muted-foreground">Manage your appointments and patient visits</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" onClick={goToCurrentWeek}>
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={goToPreviousWeek}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={goToNextWeek}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button className="bg-purple-600 hover:bg-purple-700">
            <Plus className="h-4 w-4 mr-2" />
            New Appointment
          </Button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        <div className="w-full lg:w-64 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="no-show">No Show</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Appointment Type</label>
                <Select value={appointmentTypeFilter} onValueChange={(value) => setAppointmentTypeFilter(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="in-person">In-Person</SelectItem>
                    <SelectItem value="telemedicine">Telemedicine</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Specialty</label>
                <Select value={specialtyFilter} onValueChange={(value) => setSpecialtyFilter(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select specialty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Specialties</SelectItem>
                    <SelectItem value="Physiotherapy">Physiotherapy</SelectItem>
                    {/* Add other specialties as needed */}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Today's Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Total Appointments</span>
                <Badge variant="outline" className="bg-purple-50">
                  {appointments.length}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Completed</span>
                <Badge variant="outline" className="bg-green-50 text-green-700">
                  {completedAppointments.length}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Upcoming</span>
                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                  {upcomingAppointments.length}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Cancelled</span>
                <Badge variant="outline" className="bg-red-50 text-red-700">
                  {cancelledAppointments.length}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex-1 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>
                Week of {formatDate(getDaysOfWeek(currentWeek)[0].date)} -{" "}
                {formatDate(getDaysOfWeek(currentWeek)[6].date)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-1">
                {getDaysOfWeek(currentWeek).map((day) => (
                  <Button
                    key={day.date}
                    variant="ghost"
                    className={`flex flex-col items-center p-2 h-auto ${selectedDay === day.date ? "bg-purple-50 text-purple-700" : ""}`}
                    onClick={() => setSelectedDay(day.date)}
                  >
                    <span className="text-xs font-medium">{day.dayName}</span>
                    <span className="text-lg">{day.date.split("-")[2]}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Appointments for {formatDate(selectedDay)}</CardTitle>
              <CardDescription>{filteredAppointments.length} appointments scheduled</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-green-600" />
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <p className="text-red-500 mb-2">{error}</p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setLoading(true)
                      setError(null)
                      getDoctorAppointments(doctor.uid)
                        .then((appointments) => {
                          setAppointments(appointments)
                          setLoading(false)
                        })
                        .catch((err) => {
                          console.error("Error retrying fetch:", err)
                          setError("Failed to load appointments. Please try again.")
                          setLoading(false)
                        })
                    }}
                  >
                    Retry
                  </Button>
                </div>
              ) : appointments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <p className="text-muted-foreground mb-2">No appointments found</p>
                  <p className="text-sm text-muted-foreground">You don't have any appointments scheduled yet.</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {getTimeSlots().map((slot) => (
                    <div key={slot.time} className="flex group">
                      <div className="w-16 py-3 text-sm text-muted-foreground">{formatTime(slot.time)}</div>
                      <div className="flex-1 border-l pl-4 py-3 relative">
                        {slot.appointments.length > 0 ? (
                          slot.appointments.map((appointment) => (
                            <div
                              key={appointment.id}
                              className={`rounded-md border p-3 mb-2 cursor-pointer hover:shadow-md transition-shadow ${
                                appointment.status === "cancelled" ? "opacity-60" : ""
                              }`}
                              onClick={() => handleAppointmentClick(appointment)}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-8 w-8">
                                    <AvatarFallback className="bg-purple-100 text-purple-600">
                                      {appointment.patientName?.charAt(0) || "P"}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-medium">{appointment.patientName}</p>
                                    <p className="text-xs text-muted-foreground">{appointment.patientEmail}</p>
                                    <p className="text-xs text-purple-600">{appointment.specialty}</p>
                                  </div>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className={getStatusColor(appointment.status)}>
                                      {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                                    </Badge>
                                    {appointment.type === "telemedicine" ? (
                                      <Badge variant="outline" className="bg-purple-50 text-purple-700">
                                        <Video className="h-3 w-3 mr-1" />
                                        Video
                                      </Badge>
                                    ) : (
                                      <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                        <User className="h-3 w-3 mr-1" />
                                        In-person
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-xs text-muted-foreground">
                                    Created: {new Date(appointment.createdAt).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center justify-between text-sm text-muted-foreground">
                                <div className="flex items-center">
                                  <Clock className="h-3 w-3 mr-1" />
                                  <span>
                                    {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
                                  </span>
                                </div>
                                {appointment.reason && (
                                  <span className="text-xs italic truncate max-w-[200px]">
                                    Reason: {appointment.reason}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-sm text-muted-foreground py-2">No appointments</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Appointment Details Dialog */}
      <Dialog open={isAppointmentDetailsOpen} onOpenChange={setIsAppointmentDetailsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Appointment Details</DialogTitle>
            <DialogDescription>
              {selectedAppointment &&
                `${formatDate(selectedAppointment.date)}, ${formatTime(selectedAppointment.startTime)} - ${formatTime(selectedAppointment.endTime)}`}
            </DialogDescription>
          </DialogHeader>

          {selectedAppointment && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-purple-100 text-purple-600">
                    {selectedAppointment.patientName?.charAt(0) || "P"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-medium">{selectedAppointment.patientName}</h3>
                  <p className="text-sm text-muted-foreground">{selectedAppointment.patientEmail}</p>
                  <p className="text-sm text-purple-600">{selectedAppointment.specialty}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Status</p>
                  <Badge variant="outline" className={getStatusColor(selectedAppointment.status)}>
                    {selectedAppointment.status.charAt(0).toUpperCase() + selectedAppointment.status.slice(1)}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium">Type</p>
                  {selectedAppointment.type === "telemedicine" ? (
                    <Badge variant="outline" className="bg-purple-50 text-purple-700">
                      <Video className="h-3 w-3 mr-1" />
                      Video Consultation
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700">
                      <User className="h-3 w-3 mr-1" />
                      In-person Visit
                    </Badge>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Created At</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(selectedAppointment.createdAt).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Last Updated</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(selectedAppointment.updatedAt).toLocaleString()}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium">Doctor</p>
                <p className="text-sm text-muted-foreground">
                  {selectedAppointment.doctorName} - {selectedAppointment.specialty}
                </p>
              </div>

              {selectedAppointment.reason && (
                <div>
                  <p className="text-sm font-medium">Reason for Visit</p>
                  <p className="text-sm text-muted-foreground mt-1">{selectedAppointment.reason}</p>
                </div>
              )}

              {selectedAppointment.notes && (
                <div>
                  <p className="text-sm font-medium">Notes</p>
                  <p className="text-sm text-muted-foreground mt-1">{selectedAppointment.notes}</p>
                </div>
              )}

              <div>
                <p className="text-sm font-medium">Time Slot ID</p>
                <p className="text-sm text-muted-foreground">{selectedAppointment.timeSlotId}</p>
              </div>
            </div>
          )}

          <DialogFooter className="flex justify-between sm:justify-between">
            <div className="flex gap-2">
              {selectedAppointment?.status === "scheduled" && (
                <Button
                  variant="outline"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => selectedAppointment?.id && handleUpdateStatus(selectedAppointment.id, "cancelled")}
                  disabled={submitting}
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Cancel Appointment
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              {selectedAppointment?.type === "telemedicine" && selectedAppointment?.status === "scheduled" && (
                <Button className="bg-purple-600 hover:bg-purple-700">Start Video Call</Button>
              )}
              {selectedAppointment?.status === "scheduled" && (
                <Button
                  variant="outline"
                  onClick={() => selectedAppointment?.id && handleUpdateStatus(selectedAppointment.id, "completed")}
                  disabled={submitting}
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Mark Completed
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}


"use client"

import { useState, useEffect } from "react"
import { useDoctorAuth } from "@/lib/doctor-auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Activity,
  Calendar,
  ChevronDown,
  Download,
  FileText,
  LineChart,
  Star,
  Stethoscope,
  ThumbsUp,
  TrendingUp,
  Users,
  Loader2,
  DollarSign,
} from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { getDoctorAppointments } from "@/lib/appointment-service"
import { collection, query, getDocs, orderBy, limit } from "firebase/firestore"
import { db } from "@/lib/firebase"

// Types for our activity data
interface ActivityEvent {
  id: string
  type: "appointment" | "note" | "prescription" | "test" | "message" | "payment"
  description: string
  timestamp: string
  patient?: {
    id: string
    name: string
    avatar?: string
  }
  amount?: number
}

interface PatientDemographic {
  ageGroup: string
  count: number
  percentage: number
}

interface AppointmentByDay {
  day: string
  count: number
}

interface AppointmentByHour {
  hour: string
  count: number
}

interface PerformanceMetric {
  name: string
  value: number
  target: number
  change: number
}

export default function DoctorActivityPage() {
  const { doctor } = useDoctorAuth()
  const [timeRange, setTimeRange] = useState<"week" | "month" | "quarter" | "year">("month")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // State for real data
  const [statistics, setStatistics] = useState({
    patientsTotal: 0,
    patientsTrend: 0,
    appointmentsCompleted: 0,
    appointmentsTrend: 0,
    satisfactionRate: 0,
    satisfactionTrend: 0,
    revenueGenerated: 0,
    revenueTrend: 0,
  })
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetric[]>([])
  const [patientDemographics, setPatientDemographics] = useState<PatientDemographic[]>([])
  const [appointmentsByDay, setAppointmentsByDay] = useState<AppointmentByDay[]>([])
  const [appointmentsByHour, setAppointmentsByHour] = useState<AppointmentByHour[]>([])
  const [recentActivity, setRecentActivity] = useState<ActivityEvent[]>([])
  const [patientFeedback, setPatientFeedback] = useState<any[]>([])

  // Fetch real data
  useEffect(() => {
    const fetchDoctorData = async () => {
      if (!doctor || !doctor.uid) return

      setLoading(true)
      setError(null)

      try {
        // Fetch appointments
        const appointments = await getDoctorAppointments(doctor.uid)

        // Calculate statistics
        const uniquePatients = new Set(appointments.map((appt) => appt.patientId))
        const completedAppointments = appointments.filter((appt) => appt.status === "completed")
        const scheduledAppointments = appointments.filter((appt) => appt.status === "scheduled")

        // Calculate revenue
        let totalRevenue = 0
        appointments.forEach((appt) => {
          if (appt.isPaid && appt.paymentAmount) {
            totalRevenue += appt.paymentAmount
          }
        })

        // Calculate satisfaction rate
        const ratedAppointments = appointments.filter((appt) => appt.rating)
        const averageRating =
          ratedAppointments.length > 0
            ? ratedAppointments.reduce((sum, appt) => sum + (appt.rating || 0), 0) / ratedAppointments.length
            : 0
        const satisfactionRate = Math.round((averageRating / 5) * 100)

        // Update statistics
        setStatistics({
          patientsTotal: uniquePatients.size,
          patientsTrend: 5, // Placeholder trend
          appointmentsCompleted: completedAppointments.length,
          appointmentsTrend: 3, // Placeholder trend
          satisfactionRate,
          satisfactionTrend: 1, // Placeholder trend
          revenueGenerated: totalRevenue,
          revenueTrend: 8, // Placeholder trend
        })

        // Calculate appointments by day
        const dayCount: Record<string, number> = {
          Monday: 0,
          Tuesday: 0,
          Wednesday: 0,
          Thursday: 0,
          Friday: 0,
          Saturday: 0,
          Sunday: 0,
        }

        appointments.forEach((appt) => {
          const date = new Date(appt.date)
          const day = date.toLocaleDateString("en-US", { weekday: "long" })
          dayCount[day] = (dayCount[day] || 0) + 1
        })

        const apptsByDay = Object.entries(dayCount).map(([day, count]) => ({ day, count }))
        setAppointmentsByDay(apptsByDay)

        // Calculate appointments by hour
        const hourCount: Record<string, number> = {}

        appointments.forEach((appt) => {
          if (!appt.startTime) return
          const hour = appt.startTime.split(":")[0]
          const hourLabel = `${hour}-${Number(hour) + 1} ${Number(hour) >= 12 ? "PM" : "AM"}`
          hourCount[hourLabel] = (hourCount[hourLabel] || 0) + 1
        })

        const apptsByHour = Object.entries(hourCount)
          .map(([hour, count]) => ({ hour, count }))
          .sort((a, b) => {
            const hourA = Number.parseInt(a.hour.split("-")[0])
            const hourB = Number.parseInt(b.hour.split("-")[0])
            return hourA - hourB
          })

        setAppointmentsByHour(apptsByHour)

        // Fetch recent activity
        const activityEvents: ActivityEvent[] = []

        // Add appointments to activity
        appointments.slice(0, 5).forEach((appt) => {
          activityEvents.push({
            id: appt.id || `appt-${Date.now()}`,
            type: "appointment",
            description: `${appt.status === "completed" ? "Completed" : "Scheduled"} appointment with patient`,
            timestamp: appt.updatedAt || appt.createdAt,
            patient: {
              id: appt.patientId,
              name: appt.patientName,
            },
          })
        })

        // Fetch payment transactions
        if (doctor.uid) {
          const revenueRef = collection(db, `doctors/${doctor.uid}/revenue`)
          const revenueQuery = query(revenueRef, orderBy("createdAt", "desc"), limit(5))
          const revenueSnapshot = await getDocs(revenueQuery)

          revenueSnapshot.forEach((doc) => {
            const data = doc.data()
            activityEvents.push({
              id: doc.id,
              type: "payment",
              description: "Received payment for appointment",
              timestamp: data.date,
              amount: data.amount,
              patient: data.patientName
                ? {
                    id: data.patientId || "",
                    name: data.patientName,
                  }
                : undefined,
            })
          })
        }

        // Sort activity by timestamp
        activityEvents.sort((a, b) => {
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        })

        setRecentActivity(activityEvents.slice(0, 7))

        // Set performance metrics
        setPerformanceMetrics([
          {
            name: "Patient Satisfaction",
            value: satisfactionRate,
            target: 90,
            change: 2,
          },
          {
            name: "Appointment Completion Rate",
            value: appointments.length > 0 ? Math.round((completedAppointments.length / appointments.length) * 100) : 0,
            target: 95,
            change: 1,
          },
          {
            name: "Average Consultation Time",
            value: 22, // Placeholder
            target: 20,
            change: -5,
          },
          {
            name: "Follow-up Rate",
            value: 78, // Placeholder
            target: 75,
            change: 4,
          },
        ])

        // Set patient demographics (placeholder data for now)
        setPatientDemographics([
          { ageGroup: "0-17", count: 32, percentage: 13 },
          { ageGroup: "18-34", count: 58, percentage: 23 },
          { ageGroup: "35-50", count: 87, percentage: 35 },
          { ageGroup: "51-65", count: 45, percentage: 18 },
          { ageGroup: "65+", count: 26, percentage: 11 },
        ])

        // Fetch patient feedback
        const feedbackItems = ratedAppointments
          .filter((appt) => appt.feedback)
          .map((appt) => ({
            id: appt.id,
            patientName: appt.patientName,
            rating: appt.rating || 0,
            feedback: appt.feedback || "",
            date: appt.ratedAt || appt.updatedAt || appt.date,
          }))
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 2)

        setPatientFeedback(feedbackItems)
      } catch (err) {
        console.error("Error fetching doctor data:", err)
        setError("Failed to load activity data. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    fetchDoctorData()
  }, [doctor, timeRange])

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
    }).format(date)
  }

  // Get icon for activity type
  const getActivityIcon = (type: ActivityEvent["type"]) => {
    switch (type) {
      case "appointment":
        return <Calendar className="h-4 w-4 text-blue-500" />
      case "note":
        return <FileText className="h-4 w-4 text-green-500" />
      case "prescription":
        return <FileText className="h-4 w-4 text-purple-500" />
      case "test":
        return <Stethoscope className="h-4 w-4 text-amber-500" />
      case "message":
        return <FileText className="h-4 w-4 text-cyan-500" />
      case "payment":
        return <DollarSign className="h-4 w-4 text-green-500" />
      default:
        return <Activity className="h-4 w-4 text-gray-500" />
    }
  }

  // Get max value for appointments by day/hour for scaling
  const maxAppointmentsByDay = Math.max(...appointmentsByDay.map((day) => day.count), 1)
  const maxAppointmentsByHour = Math.max(...appointmentsByHour.map((hour) => hour.count), 1)

  if (!doctor) {
    return null
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Activity Dashboard</h1>
          <p className="text-muted-foreground">Monitor your performance and patient statistics</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Select
            value={timeRange}
            onValueChange={(value: "week" | "month" | "quarter" | "year") => setTimeRange(value)}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Past Week</SelectItem>
              <SelectItem value="month">Past Month</SelectItem>
              <SelectItem value="quarter">Past Quarter</SelectItem>
              <SelectItem value="year">Past Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Key Statistics */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.patientsTotal}</div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              <span className="text-green-500">{statistics.patientsTrend}%</span> from last {timeRange}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Appointments Completed</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.appointmentsCompleted}</div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              <span className="text-green-500">{statistics.appointmentsTrend}%</span> from last {timeRange}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Patient Satisfaction</CardTitle>
            <ThumbsUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.satisfactionRate}%</div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              <span className="text-green-500">{statistics.satisfactionTrend}%</span> from last {timeRange}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue Generated</CardTitle>
            <LineChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${statistics.revenueGenerated.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              <span className="text-green-500">{statistics.revenueTrend}%</span> from last {timeRange}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
        {/* Performance Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
            <CardDescription>Your key performance indicators</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {performanceMetrics.map((metric) => (
                <div key={metric.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{metric.name}</span>
                      {metric.change > 0 ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700 text-xs">
                          +{metric.change}%
                        </Badge>
                      ) : metric.change < 0 ? (
                        <Badge variant="outline" className="bg-red-50 text-red-700 text-xs">
                          {metric.change}%
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-gray-50 text-gray-700 text-xs">
                          0%
                        </Badge>
                      )}
                    </div>
                    <span className="text-sm font-medium">
                      {metric.value}
                      {metric.name === "Average Consultation Time" ? " min" : "%"}
                    </span>
                  </div>
                  <Progress value={(metric.value / metric.target) * 100} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0</span>
                    <span>
                      Target: {metric.target}
                      {metric.name === "Average Consultation Time" ? " min" : "%"}
                    </span>
                    <span>
                      {metric.target * 1.5}
                      {metric.name === "Average Consultation Time" ? " min" : "%"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Patient Demographics */}
        <Card>
          <CardHeader>
            <CardTitle>Patient Demographics</CardTitle>
            <CardDescription>Age distribution of your patients</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {patientDemographics.map((demographic) => (
                <div key={demographic.ageGroup} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{demographic.ageGroup}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{demographic.count} patients</span>
                      <Badge variant="outline" className="bg-purple-50 text-purple-700">
                        {demographic.percentage}%
                      </Badge>
                    </div>
                  </div>
                  <Progress value={demographic.percentage} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
        {/* Appointments by Day */}
        <Card>
          <CardHeader>
            <CardTitle>Appointments by Day</CardTitle>
            <CardDescription>Distribution of appointments across weekdays</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {appointmentsByDay.map((day) => (
                <div key={day.day} className="flex items-center gap-2">
                  <div className="w-20 text-sm">{day.day}</div>
                  <div className="flex-1">
                    <div
                      className="bg-purple-100 h-8 rounded flex items-center px-2 text-sm font-medium text-purple-700"
                      style={{ width: `${(day.count / maxAppointmentsByDay) * 100}%` }}
                    >
                      {day.count}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Appointments by Hour */}
        <Card>
          <CardHeader>
            <CardTitle>Appointments by Hour</CardTitle>
            <CardDescription>Distribution of appointments throughout the day</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {appointmentsByHour.map((hour) => (
                <div key={hour.hour} className="flex items-center gap-2">
                  <div className="w-20 text-sm">{hour.hour}</div>
                  <div className="flex-1">
                    <div
                      className="bg-blue-100 h-8 rounded flex items-center px-2 text-sm font-medium text-blue-700"
                      style={{ width: `${(hour.count / maxAppointmentsByHour) * 100}%` }}
                    >
                      {hour.count}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your latest actions and interactions</CardDescription>
            </div>
            <Button variant="outline" size="sm">
              View All
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity, index) => (
                <div key={activity.id} className="flex">
                  <div className="relative mr-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-100">
                      {getActivityIcon(activity.type)}
                    </div>
                    {index < recentActivity.length - 1 && (
                      <div className="absolute top-9 bottom-0 left-1/2 -translate-x-1/2 w-px bg-gray-200" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">
                        {activity.description}
                        {activity.type === "payment" && activity.amount && (
                          <span className="text-green-600 ml-1">${activity.amount.toFixed(2)}</span>
                        )}
                      </p>
                      <span className="text-xs text-muted-foreground">{formatDate(activity.timestamp)}</span>
                    </div>
                    {activity.patient && (
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          {activity.patient.avatar ? (
                            <AvatarImage src={activity.patient.avatar} alt={activity.patient.name} />
                          ) : (
                            <AvatarFallback className="bg-purple-100 text-purple-600 text-xs">
                              {activity.patient.name.charAt(0)}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <span className="text-xs text-muted-foreground">{activity.patient.name}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-muted-foreground">No recent activity found</div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Patient Feedback */}
      <Card>
        <CardHeader>
          <CardTitle>Patient Feedback</CardTitle>
          <CardDescription>Recent reviews and ratings from your patients</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
            <div className="flex flex-col items-center">
              <div className="text-5xl font-bold text-purple-600">{(statistics.satisfactionRate / 20).toFixed(1)}</div>
              <div className="flex items-center mt-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-5 w-5 ${star <= Math.round(statistics.satisfactionRate / 20) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
                  />
                ))}
              </div>
              <p className="text-sm text-muted-foreground mt-1">Based on {performanceMetrics[0]?.value || 0} ratings</p>
            </div>
            <div className="flex-1 space-y-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm">5 stars</span>
                  <div className="flex-1">
                    <Progress value={75} className="h-2" />
                  </div>
                  <span className="text-sm">75%</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm">4 stars</span>
                  <div className="flex-1">
                    <Progress value={20} className="h-2" />
                  </div>
                  <span className="text-sm">20%</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm">3 stars</span>
                  <div className="flex-1">
                    <Progress value={5} className="h-2" />
                  </div>
                  <span className="text-sm">5%</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm">2 stars</span>
                  <div className="flex-1">
                    <Progress value={0} className="h-2" />
                  </div>
                  <span className="text-sm">0%</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm">1 star</span>
                  <div className="flex-1">
                    <Progress value={0} className="h-2" />
                  </div>
                  <span className="text-sm">0%</span>
                </div>
              </div>
            </div>
            <div className="flex-1 space-y-4">
              {patientFeedback.length > 0 ? (
                patientFeedback.map((feedback, index) => (
                  <div key={index} className="space-y-2 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-purple-100 text-purple-600">
                            {feedback.patientName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{feedback.patientName}</span>
                      </div>
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-4 w-4 ${star <= feedback.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm">"{feedback.feedback}"</p>
                    <p className="text-xs text-muted-foreground">{formatDate(feedback.date)}</p>
                  </div>
                ))
              ) : (
                <div className="space-y-2 p-4 bg-gray-50 rounded-lg">
                  <p className="text-center text-muted-foreground">No feedback yet</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


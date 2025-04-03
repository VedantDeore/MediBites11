"use client"

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useDoctorAuth } from "@/lib/doctor-auth-context"
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Users, Calendar, DollarSign, Clock, TrendingUp, Activity, CheckCircle } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Loader2 } from 'lucide-react'
import { getDoctorAppointments, getDoc } from '@/lib/firebase'
import { doc, collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { parseWorkingHours } from '@/components/working-hours-editor'
import { auth, onAuthStateChanged } from 'firebase/auth'

export default function DoctorDashboard() {
  const router = useRouter()
  const { doctor, user, loading: authLoading } = useDoctorAuth()
  const [loadingAppointments, setLoadingAppointments] = useState(true)
  const [appointments, setAppointments] = useState([])
  const [todayAppointments, setTodayAppointments] = useState([])
  const [upcomingAppointments, setUpcomingAppointments] = useState([])
  const [doctorName, setDoctorName] = useState("")
  const [stats, setStats] = useState(() => {
    const totalPatients = Math.floor(Math.random() * 1000) + 500; // 500 - 1500
    const activePatients = Math.floor(totalPatients * (Math.random() * 0.3 + 0.5)); // 50% - 80% of totalPatients
    const newPatients = Math.floor(Math.random() * 100) + 20; // 20 - 120
  
    const completedAppointments = Math.floor(Math.random() * 500) + 200; // 200 - 700
    const cancelledAppointments = Math.floor(Math.random() * 50); // 0 - 50
    const pendingAppointments = Math.floor(Math.random() * 50); // 0 - 50
    const totalAppointments = completedAppointments + cancelledAppointments + pendingAppointments;
  
    const patientRetentionRate = parseFloat(((activePatients / totalPatients) * 100).toFixed(2));
    const totalRevenue = totalAppointments * (Math.floor(Math.random() * 50) + 10); // Revenue per appointment: ₹1000 - ₹5000
    const monthlyRevenue = Math.floor(totalRevenue / 12);
    const patientSatisfaction = parseFloat((Math.random() * 10 + 85).toFixed(2)); // 85% - 95%
    const averageWaitTime = parseFloat((Math.random() * 20 + 10).toFixed(2)); // 10 - 30 mins
    const followUpRate = parseFloat((Math.random() * 30 + 40).toFixed(2)); // 40% - 70%
  
    // Age Groups
    const ageGroups = {
      under18: Math.floor(totalPatients * (Math.random() * 0.1 + 0.05)), // 5% - 15%
      age18to35: Math.floor(totalPatients * (Math.random() * 0.3 + 0.25)), // 25% - 55%
      age36to50: Math.floor(totalPatients * (Math.random() * 0.2 + 0.15)), // 15% - 35%
      age51to65: Math.floor(totalPatients * (Math.random() * 0.15 + 0.1)), // 10% - 25%
      above65: Math.floor(totalPatients * (Math.random() * 0.1 + 0.05)) // 5% - 15%
    };
  
    // Adjust age group distribution to match totalPatients
    const ageTotal = Object.values(ageGroups).reduce((sum, val) => sum + val, 0);
    ageGroups.above65 += totalPatients - ageTotal;
  
    // Gender Distribution
    const male = Math.floor(totalPatients * (Math.random() * 0.5 + 0.3)); // 30% - 80%
    const female = Math.floor(totalPatients * (Math.random() * 0.4 + 0.2)); // 20% - 60%
    const other = totalPatients - (male + female); // Ensuring total matches
  
    const genderDistribution = { male, female, other };
  
    // Appointment Types Distribution
    const appointmentTypes = {
      "General Checkup": Math.floor(totalAppointments * 0.4), // 40% of totalAppointments
      "Dental": Math.floor(totalAppointments * 0.2), // 20%
      "Physiotherapy": Math.floor(totalAppointments * 0.15), // 15%
      "Cardiology": Math.floor(totalAppointments * 0.1), // 10%
      "Dermatology": Math.floor(totalAppointments * 0.15) // 15%
    };
  
    return {
      totalPatients,
      activePatients,
      newPatients,
      patientRetentionRate,
      pendingAppointments,
      completedAppointments,
      cancelledAppointments,
      totalAppointments,
      totalRevenue,
      monthlyRevenue,
      patientSatisfaction,
      averageWaitTime,
      followUpRate,
      ageGroups,
      genderDistribution,
      appointmentTypes
    };
  });
  

  useEffect(() => {
    if (!authLoading && !doctor) {
      router.push("/doctor/login")
    }
  }, [doctor, authLoading, router])

  useEffect(() => {
    const fetchDoctorData = async () => {
      if (doctor && doctor.id) {
        setLoadingAppointments(true)
        try {
          console.log("Fetching data for doctor:", doctor.id);
          
          setDoctorName(doctor.name || "Doctor")
          
          // 1. Fetch all appointments
          const fetchedAppointments = await getDoctorAppointments(doctor.id)
          setAppointments(fetchedAppointments)
          console.log(`Fetched ${fetchedAppointments.length} appointments`);

          // Verify doctor name from first appointment if available
          if (fetchedAppointments.length > 0 && fetchedAppointments[0].doctorName) {
            setDoctorName(fetchedAppointments[0].doctorName)
          }

          // 2. Get unique patient IDs from appointments
          const patientIds = new Set(fetchedAppointments.map((appt) => appt.patientId).filter(Boolean))
          console.log(`Found ${patientIds.size} unique patient IDs from appointments`);
          
          // 3. Fetch detailed patient info for each unique patient
          const patientDetails = []
          for (const patientId of patientIds) {
            if (patientId) {
              try {
                const patientDoc = await getDoc(doc(db, "patients", patientId))
                if (patientDoc.exists()) {
                  patientDetails.push({
                    id: patientId,
                    ...patientDoc.data()
                  })
                }
              } catch (err) {
                console.error(`Error fetching patient ${patientId}:`, err)
              }
            }
          }
          console.log(`Retrieved detailed info for ${patientDetails.length} patients`);
          
          // 4. Get patient demographics
          const ageGroups = {
            under18: 0,
            age18to35: 0,
            age36to50: 0,
            age51to65: 0,
            above65: 0
          }
          
          const genderDistribution = {
            male: 0,
            female: 0,
            other: 0
          }
          
          patientDetails.forEach(patient => {
            // Process age if available
            if (patient.dateOfBirth) {
              const birthDate = new Date(patient.dateOfBirth)
              const age = new Date().getFullYear() - birthDate.getFullYear()
              
              if (age < 18) ageGroups.under18++
              else if (age <= 35) ageGroups.age18to35++
              else if (age <= 50) ageGroups.age36to50++
              else if (age <= 65) ageGroups.age51to65++
              else ageGroups.above65++
            }
            
            // Process gender if available
            if (patient.gender) {
              const gender = patient.gender.toLowerCase()
              if (gender === 'male') genderDistribution.male++
              else if (gender === 'female') genderDistribution.female++
              else genderDistribution.other++
            }
          })
          
          // 5. Filter today's appointments
          const today = new Date().toISOString().split("T")[0]
          const todaysAppts = fetchedAppointments.filter((appt) => appt.date === today)
          todaysAppts.sort((a, b) => {
            // Sort by time (assuming startTime is in HH:MM format)
            return a.startTime.localeCompare(b.startTime)
          })
          setTodayAppointments(todaysAppts)
          
          // 6. Get upcoming appointments (future dates)
          const upcoming = fetchedAppointments.filter(
            (appt) => appt.date > today && appt.status === "scheduled"
          ).slice(0, 5) // Get next 5 upcoming appointments
          setUpcomingAppointments(upcoming)
          
          // 7. Count appointments by status
          const pending = fetchedAppointments.filter((appt) => appt.status === "scheduled").length
          const completed = fetchedAppointments.filter((appt) => appt.status === "completed").length
          const cancelled = fetchedAppointments.filter((appt) => appt.status === "cancelled").length
          
          // 8. Analyze appointment types
          const appointmentTypes = {}
          fetchedAppointments.forEach(appt => {
            const type = appt.type || "general"
            appointmentTypes[type] = (appointmentTypes[type] || 0) + 1
          })
          
          // 9. Calculate revenue
          let totalRevenue = 0
          fetchedAppointments.forEach((appt) => {
            if (appt.isPaid && appt.paymentAmount) {
              totalRevenue += parseFloat(appt.paymentAmount.toString())
            }
          })
          
          // 10. Get transaction data for more accurate revenue
          const transactionsRef = collection(db, "transactions")
          const transactionsQuery = query(
            transactionsRef, 
            where("doctorId", "==", doctor.id),
            where("status", "==", "completed")
          )
          const transactionsSnapshot = await getDocs(transactionsQuery)
          
          if (transactionsSnapshot.size > 0) {
            totalRevenue = 0 // Reset if we have transaction data
            transactionsSnapshot.forEach(doc => {
              const transaction = doc.data()
              if (transaction.amount) {
                // Handle amount that might be stored as string with currency symbol
                let amountStr = transaction.amount.toString()
                
                // Remove currency symbols and handle different formats
                if (typeof amountStr === 'string') {
                  // Remove any currency symbol like $ or +$
                  amountStr = amountStr.replace(/[+$]/g, '')
                  
                  // Skip NaN values
                  if (amountStr.toLowerCase() !== 'nan') {
                    const amount = parseFloat(amountStr)
                    if (!isNaN(amount)) {
                      totalRevenue += amount
                    }
                  }
                }
              }
            })
            console.log(`Calculated revenue from ${transactionsSnapshot.size} transactions: $${totalRevenue}`);
          }

          // 11. Get monthly revenue
          const currentMonth = new Date().getMonth() + 1
          const currentYear = new Date().getFullYear()
          const monthKey = `${currentYear}-${currentMonth}`
          
          // 12. Fetch doctor document to get revenue data and other details
          const doctorDoc = await getDoc(doc(db, "doctors", doctor.id))
          let monthlyRevenue = 0
          let patientSatisfaction = 0
          let averageWaitTime = 12 // Default value in minutes
          let followUpRate = 0
          
          if (doctorDoc.exists()) {
            const doctorData = doctorDoc.data()
            
            // Get monthly revenue from doctor data if it exists
            if (doctorData.monthlyRevenue && doctorData.monthlyRevenue[monthKey]) {
              monthlyRevenue = doctorData.monthlyRevenue[monthKey]
            }
            
            // If doctor has stored revenue, use that
            if (doctorData.totalRevenue) {
              totalRevenue = doctorData.totalRevenue
            }
            
            // Get metrics if they exist
            if (doctorData.patientSatisfaction) {
              patientSatisfaction = doctorData.patientSatisfaction
            } else {
              // Calculate from appointment ratings
              const ratedAppointments = fetchedAppointments.filter(appt => appt.rating)
              if (ratedAppointments.length > 0) {
                const totalRating = ratedAppointments.reduce((sum, appt) => sum + (appt.rating || 0), 0)
                patientSatisfaction = Math.round((totalRating / ratedAppointments.length) * 20) // Scale 1-5 to percentage
              }
            }
            
            // Get wait time if it exists
            if (doctorData.averageWaitTime) {
              averageWaitTime = doctorData.averageWaitTime
            }
            
            // Calculate follow-up rate
            const completedWithFollowUp = fetchedAppointments.filter(
              appt => appt.status === 'completed' && appt.followUpRecommended
            ).length
            
            if (completed > 0) {
              followUpRate = Math.round((completedWithFollowUp / completed) * 100)
            }
          }
          
          // 13. Calculate patient retention rate
          const repeatedPatients = new Map()
          fetchedAppointments.forEach(appt => {
            if (appt.patientId) {
              repeatedPatients.set(appt.patientId, (repeatedPatients.get(appt.patientId) || 0) + 1)
            }
          })
          
          const patientsWithMultipleVisits = Array.from(repeatedPatients.values()).filter(count => count > 1).length
          const retentionRate = patientIds.size > 0 ? Math.round((patientsWithMultipleVisits / patientIds.size) * 100) : 0
          
          // 14. Update stats with all the new information
          setStats({
            totalPatients: patientIds.size,
            activePatients: patientsWithMultipleVisits,
            newPatients: patientIds.size - patientsWithMultipleVisits,
            patientRetentionRate: retentionRate,
            pendingAppointments: pending,
            completedAppointments: completed,
            cancelledAppointments: cancelled,
            totalAppointments: fetchedAppointments.length,
            totalRevenue,
            monthlyRevenue,
            patientSatisfaction: patientSatisfaction || 95, // Default to 95 if not available
            averageWaitTime: averageWaitTime || 12, // Default to 12 min if not available
            followUpRate: followUpRate || 88, // Default to 88% if not available
            ageGroups,
            genderDistribution,
            appointmentTypes
          })
          
          console.log("Updated doctor stats with comprehensive patient data");
          console.log(`Doctor Name: ${doctorName}, Total Patients: ${patientIds.size}`);
          
        } catch (error) {
          console.error("Error fetching doctor data:", error)
        } finally {
          setLoadingAppointments(false)
        }
      }
    }

    fetchDoctorData()
  }, [doctor])

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    )
  }

  if (!doctor) {
    return null // Will redirect in useEffect
  }

  // Format time for display
  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(":").map(Number)
    const period = hours >= 12 ? "PM" : "AM"
    const hour12 = hours % 12 || 12
    return `${hour12}:${minutes.toString().padStart(2, "0")} ${period}`
  }

  // Get working hours display
  const getWorkingHoursDisplay = () => {
    try {
      if (!doctor) return "9:00 AM - 5:00 PM";
      
      if (typeof doctor.workingHours === "string") {
        return doctor.workingHours.split(",")[0] || "9:00 AM - 5:00 PM";
      } else if (doctor.workingHours) {
        try {
          const parsedHours = parseWorkingHours(doctor.workingHours);
          const today = new Date().toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
          const todayHours = parsedHours[today];

          if (todayHours && todayHours.enabled && todayHours.timeSlots && todayHours.timeSlots.length > 0) {
            const slot = todayHours.timeSlots[0];
            if (slot && slot.start && slot.end) {
              return `${slot.start} ${slot.startPeriod || 'AM'} - ${slot.end} ${slot.endPeriod || 'PM'}`;
            }
          }
        } catch (err) {
          console.error("Error parsing working hours:", err);
        }
      }
      
      return "9:00 AM - 5:00 PM"; // Default fallback
    } catch (error) {
      console.error("Error in getWorkingHoursDisplay:", error);
      return "9:00 AM - 5:00 PM";
    }
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Welcome back, {doctorName || doctor?.name || "Doctor"}</h2>
          <p className="text-muted-foreground">Here's an overview of your practice for today</p>
          <p className="text-md font-medium mt-2">You have <span className="text-purple-600 font-bold">{stats.totalPatients}</span> registered patients</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={() => router.push("/doctor/dashboard/schedule")}>View Schedule</Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPatients}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalPatients > 0 ? `${stats.totalPatients} unique patients` : "No patients yet"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Appointments</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingAppointments}</div>
            <p className="text-xs text-muted-foreground">
              {stats.pendingAppointments > 0
                ? `${stats.pendingAppointments} need attention`
                : "No pending appointments"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">${stats.monthlyRevenue.toFixed(2)} this month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Working Hours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getWorkingHoursDisplay()}</div>
            <p className="text-xs text-muted-foreground">Today's schedule</p>
          </CardContent>
        </Card>
      </div>

      {/* Patient Demographics */}
      <Card>
        <CardHeader>
          <CardTitle>Patient Demographics</CardTitle>
          <CardDescription>Overview of your patient population</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium mb-3">Patient Age Distribution</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs">Under 18</span>
                  <span className="text-xs font-medium">{stats.ageGroups.under18}</span>
                </div>
                <Progress value={(stats.ageGroups.under18 / stats.totalPatients) * 100 || 0} className="h-2" />
                
                <div className="flex items-center justify-between">
                  <span className="text-xs">18-35</span>
                  <span className="text-xs font-medium">{stats.ageGroups.age18to35}</span>
                </div>
                <Progress value={(stats.ageGroups.age18to35 / stats.totalPatients) * 100 || 0} className="h-2" />
                
                <div className="flex items-center justify-between">
                  <span className="text-xs">36-50</span>
                  <span className="text-xs font-medium">{stats.ageGroups.age36to50}</span>
                </div>
                <Progress value={(stats.ageGroups.age36to50 / stats.totalPatients) * 100 || 0} className="h-2" />
                
                <div className="flex items-center justify-between">
                  <span className="text-xs">51-65</span>
                  <span className="text-xs font-medium">{stats.ageGroups.age51to65}</span>
                </div>
                <Progress value={(stats.ageGroups.age51to65 / stats.totalPatients) * 100 || 0} className="h-2" />
                
                <div className="flex items-center justify-between">
                  <span className="text-xs">Over 65</span>
                  <span className="text-xs font-medium">{stats.ageGroups.above65}</span>
                </div>
                <Progress value={(stats.ageGroups.above65 / stats.totalPatients) * 100 || 0} className="h-2" />
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium mb-3">Gender Distribution</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs">Male</span>
                  <span className="text-xs font-medium">{stats.genderDistribution.male}</span>
                </div>
                <Progress 
                  value={(stats.genderDistribution.male / stats.totalPatients) * 100 || 0} 
                  className="h-2 bg-blue-100" 
                />
                
                <div className="flex items-center justify-between">
                  <span className="text-xs">Female</span>
                  <span className="text-xs font-medium">{stats.genderDistribution.female}</span>
                </div>
                <Progress 
                  value={(stats.genderDistribution.female / stats.totalPatients) * 100 || 0} 
                  className="h-2 bg-pink-100" 
                />
                
                <div className="flex items-center justify-between">
                  <span className="text-xs">Other</span>
                  <span className="text-xs font-medium">{stats.genderDistribution.other}</span>
                </div>
                <Progress 
                  value={(stats.genderDistribution.other / stats.totalPatients) * 100 || 0} 
                  className="h-2 bg-purple-100" 
                />
              </div>
              
              <h3 className="text-sm font-medium mt-6 mb-3">Patient Retention</h3>
              <div className="flex items-center space-x-4">
                <div className="text-center">
                  <div className="text-xl font-bold">{stats.activePatients}</div>
                  <p className="text-xs text-muted-foreground">Returning</p>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold">{stats.newPatients}</div>
                  <p className="text-xs text-muted-foreground">First-time</p>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold">{stats.patientRetentionRate}%</div>
                  <p className="text-xs text-muted-foreground">Retention rate</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Appointment Analytics */}
      <Card>
        <CardHeader>
          <CardTitle>Appointment Analytics</CardTitle>
          <CardDescription>Breakdown of appointments by type and status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium mb-3">Appointment Status</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs">Scheduled</span>
                  <span className="text-xs font-medium">{stats.pendingAppointments}</span>
                </div>
                <Progress 
                  value={(stats.pendingAppointments / stats.totalAppointments) * 100 || 0} 
                  className="h-2 bg-blue-100" 
                />
                
                <div className="flex items-center justify-between">
                  <span className="text-xs">Completed</span>
                  <span className="text-xs font-medium">{stats.completedAppointments}</span>
                </div>
                <Progress 
                  value={(stats.completedAppointments / stats.totalAppointments) * 100 || 0} 
                  className="h-2 bg-green-100" 
                />
                
                <div className="flex items-center justify-between">
                  <span className="text-xs">Cancelled</span>
                  <span className="text-xs font-medium">{stats.cancelledAppointments}</span>
                </div>
                <Progress 
                  value={(stats.cancelledAppointments / stats.totalAppointments) * 100 || 0} 
                  className="h-2 bg-red-100" 
                />
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium mb-3">Appointment Types</h3>
              <div className="space-y-2">
                {Object.entries(stats.appointmentTypes || {}).map(([type, count]) => (
                  <div key={type}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs capitalize">{type}</span>
                      <span className="text-xs font-medium">{count}</span>
                    </div>
                    <Progress 
                      value={(count / stats.totalAppointments) * 100 || 0} 
                      className="h-2" 
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Today's Schedule */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-7">
        <Card className="col-span-1 lg:col-span-4">
          <CardHeader>
            <CardTitle>Today's Appointments</CardTitle>
            <CardDescription>You have {todayAppointments.length} appointments scheduled for today</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingAppointments ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
              </div>
            ) : todayAppointments.length > 0 ? (
              <div className="space-y-4">
                {todayAppointments.map((appointment) => (
                  <div key={appointment.id} className="flex items-center justify-between space-x-4">
                    <div className="flex items-center space-x-4">
                      <Avatar>
                        <AvatarFallback className="bg-purple-100 text-purple-600">
                          {appointment.patientName?.charAt(0) || "P"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{appointment.patientName || "Unknown Patient"}</p>
                        <p className="text-xs text-muted-foreground">{appointment.patientEmail || "No email"}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="text-sm text-right">
                        <p className="font-medium">{formatTime(appointment.startTime)}</p>
                        <p className="text-xs text-muted-foreground">{appointment.type || "Consultation"}</p>
                      </div>
                      <Badge variant={appointment.status === "scheduled" ? "outline" : "default"}>
                        {appointment.status || "scheduled"}
                      </Badge>
                      {appointment.isPaid && (
                        <Badge variant="outline" className="bg-green-50 text-green-700">
                          <DollarSign className="h-3 w-3 mr-1" />
                          Paid
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Calendar className="h-10 w-10 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No appointments scheduled for today</p>
                <Button variant="outline" className="mt-4" onClick={() => router.push("/doctor/dashboard/schedule")}>
                  View Full Schedule
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Performance Card */}
        <Card className="col-span-1 lg:col-span-3">
          <CardHeader>
            <CardTitle>Weekly Performance</CardTitle>
            <CardDescription>Your patient care metrics for this week</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Patient Satisfaction</span>
                </div>
                <span className="text-sm font-medium">{stats.patientSatisfaction}%</span>
              </div>
              <Progress value={stats.patientSatisfaction} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Average Wait Time</span>
                </div>
                <span className="text-sm font-medium">{stats.averageWaitTime} min</span>
              </div>
              <Progress value={100 - (stats.averageWaitTime / 30) * 100} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Follow-up Rate</span>
                </div>
                <span className="text-sm font-medium">{stats.followUpRate}%</span>
              </div>
              <Progress value={stats.followUpRate} className="h-2" />
            </div>

            <div className="rounded-lg bg-muted p-4">
              <div className="flex items-center space-x-4">
                <div className="rounded-full bg-purple-100 p-2">
                  <CheckCircle className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Your performance is above average</p>
                  <p className="text-xs text-muted-foreground">
                    Keep up the good work! Your patients appreciate your care.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Create a more prominent Upcoming Appointments section */}
      <Card className="bg-purple-50 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-purple-600" />
            Upcoming Appointments
          </CardTitle>
          <CardDescription>
            You have {upcomingAppointments.length} upcoming appointments
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingAppointments ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
            </div>
          ) : upcomingAppointments.length > 0 ? (
            <div className="space-y-4">
              {upcomingAppointments.map((appointment) => (
                <div key={appointment.id} className="flex items-center justify-between space-x-4 border-b border-purple-100 pb-4 last:border-0">
                  <div className="flex items-center space-x-4">
                    <Avatar>
                      <AvatarFallback className="bg-purple-100 text-purple-600">
                        {appointment.patientName?.charAt(0) || "P"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{appointment.patientName || "Unknown Patient"}</p>
                      <p className="text-xs text-muted-foreground">{appointment.type || "Consultation"}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-sm text-right">
                      <p className="font-medium">{new Date(appointment.date).toLocaleDateString()}</p>
                      <p className="text-xs">{formatTime(appointment.startTime)}</p>
                    </div>
                    <Badge variant={appointment.isPaid ? "default" : "outline"}>
                      {appointment.isPaid ? "Paid" : "Pending Payment"}
                    </Badge>
                  </div>
                </div>
              ))}
              <div className="flex justify-center mt-2">
                <Button variant="outline" onClick={() => router.push("/doctor/dashboard/schedule")}>
                  View All Appointments
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Calendar className="h-10 w-10 text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No upcoming appointments scheduled</p>
              <Button variant="outline" className="mt-4" onClick={() => router.push("/doctor/dashboard/schedule")}>
                View Schedule
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}


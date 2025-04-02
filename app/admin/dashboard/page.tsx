"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { ResponsiveAdminPageWrapper } from "@/components/responsive-admin-page-wrapper"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  getTotalRevenue,
  getMonthlyRevenue,
  getRecentPatients,
  getRecentDoctors,
  getRevenueByDoctor,
  getAppointmentCommissions,
  getTelemedicineStats,
} from "@/lib/admin-service"
import { Users, Stethoscope, DollarSign, TrendingUp, Video, Coins, Calendar, User, Loader2 } from "lucide-react"
import { Line, LineChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Bar, BarChart } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { db } from "@/lib/firebase"
import { collection, getDocs, getCountFromServer, query, orderBy, limit, where, doc, getDoc } from "firebase/firestore"
import { Button } from "@/components/ui/button"

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalDoctors: 0,
    totalRevenue: 0,
    totalCommission: 0,
    totalAppointments: 0,
    telemedicineAppointments: 0,
    inPersonAppointments: 0,
  })
  const [revenueData, setRevenueData] = useState<any[]>([])
  const [recentPatients, setRecentPatients] = useState<any[]>([])
  const [recentDoctors, setRecentDoctors] = useState<any[]>([])
  const [doctorRevenue, setDoctorRevenue] = useState<any[]>([])
  const [commissionData, setCommissionData] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  
  const fetchCounts = useCallback(async () => {
    try {
      // For doctors, use the same approach as the doctors page
      const doctorsRef = collection(db, "doctors");
      const doctorsSnapshot = await getDocs(doctorsRef);
      const doctorCount = doctorsSnapshot.size;
      console.log("Fetched doctor count:", doctorCount, "from", doctorsSnapshot.docs.length, "docs");
      
      // For patients, use the same direct approach
      const patientsRef = collection(db, "patients");
      const patientsSnapshot = await getDocs(patientsRef);
      const patientCount = patientsSnapshot.size;
      console.log("Fetched patient count:", patientCount, "from", patientsSnapshot.docs.length, "docs");
      
      // Get all appointments to calculate commission
      const appointmentsRef = collection(db, "appointments");
      const appointmentsSnapshot = await getDocs(appointmentsRef);
      const appointmentsCount = appointmentsSnapshot.size;
      console.log("Fetched appointments count:", appointmentsCount);
      
      // Calculate total revenue from transactions
      const transactionsRef = collection(db, "transactions");
      const transactionsSnapshot = await getDocs(transactionsRef);
      
      let totalRevenue = 0;
      console.log(`Processing ${transactionsSnapshot.size} transactions for revenue calculation`);
      
      transactionsSnapshot.forEach(doc => {
        const transaction = doc.data();
        
        // Check for amount field - handle different formats
        if (transaction.amount) {
          // Handle amount that might be stored as string with currency symbol
          let amountStr = transaction.amount.toString();
          
          // Remove currency symbols and handle different formats
          if (typeof amountStr === 'string') {
            // Remove any currency symbol like $ or +$
            amountStr = amountStr.replace(/[+$]/g, '');
            
            // Skip NaN values
            if (amountStr.toLowerCase() === 'nan') {
              console.log(`Skipping NaN transaction: ${doc.id}`);
              return;
            }
          }
          
          // Parse the amount to a float
          const amount = parseFloat(amountStr);
          
          // Only add valid numbers
          if (!isNaN(amount)) {
            totalRevenue += amount;
            console.log(`Added transaction: ${doc.id}, amount: ${amount}, new total: ${totalRevenue}`);
          } else {
            console.log(`Skipped invalid amount in transaction: ${doc.id}, value: ${transaction.amount}`);
          }
        }
      });
      
      console.log("Final calculated total revenue from transactions:", totalRevenue);
      
      // Calculate total commission ($10 per appointment)
      const totalCommission = appointmentsCount * 10;
      
      // Count telemedicine vs in-person appointments
      let telemedicineCount = 0;
      let inPersonCount = 0;
      
      appointmentsSnapshot.forEach(doc => {
        const data = doc.data();
        if (data.type === 'telemedicine') {
          telemedicineCount++;
        } else {
          inPersonCount++;
        }
      });
      
      // Ensure we're returning actual numbers, not undefined
      return {
        patientsCount: patientCount || 0,
        doctorsCount: doctorCount || 0,
        appointmentsCount: appointmentsCount || 0,
        totalRevenue: totalRevenue || 0,
        totalCommission: totalCommission || 0,
        telemedicineCount: telemedicineCount || 0,
        inPersonCount: inPersonCount || 0
      };
    } catch (error) {
      console.error("Error fetching counts:", error);
      return {
        patientsCount: 0,
        doctorsCount: 0,
        appointmentsCount: 0,
        totalRevenue: 0,
        totalCommission: 0,
        telemedicineCount: 0,
        inPersonCount: 0
      };
    }
  }, []);

  const refreshCounts = async () => {
    try {
      setRefreshing(true);
      console.log("Starting refresh of counts...");
      const counts = await fetchCounts();
      console.log("Refresh got counts:", counts);
      
      setStats(prev => {
        const newStats = {
          ...prev,
          totalPatients: counts.patientsCount,
          totalDoctors: counts.doctorsCount,
          totalRevenue: counts.totalRevenue,
          totalAppointments: counts.appointmentsCount,
          totalCommission: counts.totalCommission,
          telemedicineAppointments: counts.telemedicineCount,
          inPersonAppointments: counts.inPersonCount,
        };
        console.log("Updated stats:", newStats);
        return newStats;
      });
    } catch (error) {
      console.error("Error refreshing counts:", error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log("Starting initial data fetch...");

        // Get counts and revenue
        const countsData = await fetchCounts();
        console.log("Initial fetch got counts and revenue:", countsData);

        // Fetch all other data in parallel
        const [monthlyRevenue, patientsList, doctorsList, doctorRevenueData, commissions, telemedicineStats] =
          await Promise.all([
            getMonthlyRevenue(6),
            getRecentPatients(5),
            getRecentDoctors(5),
            getRevenueByDoctor(5),
            getAppointmentCommissions(6),
            getTelemedicineStats(),
          ]);

        // Add commission data to monthly revenue
        const enhancedRevenueData = monthlyRevenue.map(item => ({
          ...item,
          commission: item.appointments * 10 // $10 per appointment
        }));

        // Set the stats with the counts and revenue we got
        const newStats = {
          totalPatients: countsData.patientsCount,
          totalDoctors: countsData.doctorsCount,
          totalRevenue: countsData.totalRevenue,
          totalCommission: countsData.totalCommission,
          totalAppointments: countsData.appointmentsCount,
          telemedicineAppointments: countsData.telemedicineCount,
          inPersonAppointments: countsData.inPersonCount,
        };
        
        console.log("Setting stats to:", newStats);
        setStats(newStats);

        setRevenueData(enhancedRevenueData);
        setCommissionData(commissions);
        setRecentPatients(patientsList);
        setRecentDoctors(doctorsList);
        setDoctorRevenue(doctorRevenueData.map(doctor => ({
          ...doctor,
          commission: doctor.transactions * 10 // $10 commission per appointment
        })));
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setError("Failed to load dashboard data. Please try refreshing.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [fetchCounts]);

  return (
    <ResponsiveAdminPageWrapper title="Admin Dashboard">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <Button 
            onClick={refreshCounts}
            variant="outline"
            disabled={refreshing}
            size="sm"
            className="flex items-center gap-2"
          >
            {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Refresh Counts
          </Button>
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{error}</span>
            <Button 
              onClick={refreshCounts}
              variant="link"
              size="sm"
              className="text-red-500"
            >
              Try Again
            </Button>
          </div>
        )}
        
        {/* Summary Overview */}
        <Card className="bg-gradient-to-r from-blue-50 to-green-50 border-none">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Platform Summary</CardTitle>
                <CardDescription>Current statistics from Firestore database</CardDescription>
              </div>
              <Badge variant="outline" className="bg-white">
                Live Data
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pb-6">
            <div className="mb-6 bg-white p-6 rounded-lg shadow-sm border border-green-100">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-800">Total Platform Revenue</h3>
                  <p className="text-sm text-gray-500">Total earnings from all transactions</p>
                </div>
                {loading ? (
                  <Skeleton className="h-12 w-[150px]" />
                ) : (
                  <div className="text-4xl font-bold text-emerald-600">${stats.totalRevenue.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-4">
              <div className="flex items-center justify-center flex-col p-4 bg-white rounded-lg shadow-sm border">
                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-4">
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
                {loading ? (
                  <Skeleton className="h-10 w-[120px] mb-2" />
                ) : (
                  <div className="text-4xl font-bold text-blue-600 mb-2">{stats.totalPatients.toLocaleString()}</div>
                )}
                <h3 className="text-lg font-medium text-gray-800">Total Patients</h3>
                <p className="text-sm text-gray-500 text-center mt-1">Registered users with patient accounts</p>
              </div>
              
              <div className="flex items-center justify-center flex-col p-4 bg-white rounded-lg shadow-sm border">
                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                  <Stethoscope className="h-8 w-8 text-green-600" />
                </div>
                {loading ? (
                  <Skeleton className="h-10 w-[120px] mb-2" />
                ) : (
                  <div className="text-4xl font-bold text-green-600 mb-2">{stats.totalDoctors.toLocaleString()}</div>
                )}
                <h3 className="text-lg font-medium text-gray-800">Total Doctors</h3>
                <p className="text-sm text-gray-500 text-center mt-1">Healthcare providers on the platform</p>
              </div>
            </div>
            
            {!loading && (
              <div className="bg-white p-3 rounded-md text-center border-t border-gray-100 mt-2">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">User ratio:</span> {stats.totalDoctors > 0 ? Math.round(stats.totalPatients / stats.totalDoctors) : 0} patients per doctor
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Patients"
            value={stats.totalPatients}
            description="Registered patients"
            icon={<Users className="h-5 w-5 text-blue-600" />}
            loading={loading}
          />
          <StatsCard
            title="Total Doctors"
            value={stats.totalDoctors}
            description="Registered doctors"
            icon={<Stethoscope className="h-5 w-5 text-green-600" />}
            loading={loading}
          />
          <StatsCard
            title="Total Revenue"
            value={`$${stats.totalRevenue.toLocaleString()}`}
            description="Lifetime revenue"
            icon={<DollarSign className="h-5 w-5 text-emerald-600" />}
            loading={loading}
          />
          <StatsCard
            title="Total Commission"
            value={`$${stats.totalCommission.toLocaleString()}`}
            description={`From ${stats.totalAppointments} appointments`}
            icon={<Coins className="h-5 w-5 text-amber-600" />}
            loading={loading}
          />
        </div>
        
        {/* Appointment Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <StatsCard
            title="Total Appointments"
            value={stats.totalAppointments}
            description="All appointments"
            icon={<Calendar className="h-5 w-5 text-purple-600" />}
            loading={loading}
          />
          <StatsCard
            title="Telemedicine"
            value={stats.telemedicineAppointments}
            description={`${Math.round((stats.telemedicineAppointments / stats.totalAppointments) * 100)}% of total`}
            icon={<Video className="h-5 w-5 text-indigo-600" />}
            loading={loading}
          />
          <StatsCard
            title="In-Person"
            value={stats.inPersonAppointments}
            description={`${Math.round((stats.inPersonAppointments / stats.totalAppointments) * 100)}% of total`}
            icon={<User className="h-5 w-5 text-pink-600" />}
            loading={loading}
          />
        </div>

        {/* Revenue and Commission Charts */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Revenue Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue Overview</CardTitle>
              <CardDescription>Monthly revenue for the last 6 months</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="w-full h-[300px] flex items-center justify-center">
                  <Skeleton className="w-full h-full" />
                </div>
              ) : (
                <ChartContainer
                  config={{
                    revenue: {
                      label: "Revenue",
                      color: "hsl(var(--chart-1))",
                    },
                    commission: {
                      label: "Commission",
                      color: "hsl(var(--chart-2))",
                    }
                  }}
                  className="h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={revenueData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="var(--color-revenue)" 
                        strokeWidth={2} 
                        name="Revenue"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="commission" 
                        stroke="var(--color-commission)" 
                        strokeWidth={2} 
                        name="Commission ($10/appointment)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          {/* Appointments by Type Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Appointment Type Distribution</CardTitle>
              <CardDescription>Telemedicine vs. in-person appointments</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="w-full h-[300px] flex items-center justify-center">
                  <Skeleton className="w-full h-full" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={[
                      { 
                        name: 'Appointments', 
                        telemedicine: stats.telemedicineAppointments, 
                        inPerson: stats.inPersonAppointments 
                      }
                    ]}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="telemedicine" fill="#8884d8" name="Telemedicine" />
                    <Bar dataKey="inPerson" fill="#82ca9d" name="In-Person" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity Tabs */}
        <Tabs defaultValue="patients" className="space-y-4">
          <TabsList>
            <TabsTrigger value="patients">Recent Patients</TabsTrigger>
            <TabsTrigger value="doctors">Recent Doctors</TabsTrigger>
            <TabsTrigger value="revenue">Doctor Revenue</TabsTrigger>
            <TabsTrigger value="commissions">Commissions</TabsTrigger>
          </TabsList>

          <TabsContent value="patients" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recently Registered Patients</CardTitle>
                <CardDescription>New patients who joined the platform</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-4">
                    {Array(5)
                      .fill(0)
                      .map((_, i) => (
                        <div key={i} className="flex items-center gap-4">
                          <Skeleton className="h-12 w-12 rounded-full" />
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-[200px]" />
                            <Skeleton className="h-4 w-[150px]" />
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentPatients.map((patient) => (
                      <div key={patient.id} className="flex items-center gap-4">
                        <Avatar>
                          {patient.profilePicture ? (
                            <AvatarImage src={patient.profilePicture} alt={patient.name} />
                          ) : (
                            <AvatarFallback className="bg-blue-100 text-blue-600">
                              {patient.name.charAt(0)}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{patient.name}</p>
                          <p className="text-xs text-muted-foreground">{patient.email}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="doctors" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recently Registered Doctors</CardTitle>
                <CardDescription>New doctors who joined the platform</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-4">
                    {Array(5)
                      .fill(0)
                      .map((_, i) => (
                        <div key={i} className="flex items-center gap-4">
                          <Skeleton className="h-12 w-12 rounded-full" />
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-[200px]" />
                            <Skeleton className="h-4 w-[150px]" />
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentDoctors.map((doctor) => (
                      <div key={doctor.id} className="flex items-center gap-4">
                        <Avatar>
                          {doctor.profilePicture ? (
                            <AvatarImage src={doctor.profilePicture} alt={doctor.name} />
                          ) : (
                            <AvatarFallback className="bg-green-100 text-green-600">
                              {doctor.name.charAt(0)}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{doctor.name}</p>
                          <p className="text-xs text-muted-foreground">{doctor.specialty}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="revenue" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Top Earning Doctors</CardTitle>
                <CardDescription>Doctors with highest revenue generation</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-4">
                    {Array(5)
                      .fill(0)
                      .map((_, i) => (
                        <div key={i} className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <Skeleton className="h-12 w-12 rounded-full" />
                            <div className="space-y-2">
                              <Skeleton className="h-4 w-[200px]" />
                              <Skeleton className="h-4 w-[150px]" />
                            </div>
                          </div>
                          <Skeleton className="h-4 w-[100px]" />
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {doctorRevenue.map((doctor) => (
                      <div key={doctor.id} className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <Avatar>
                            <AvatarFallback className="bg-green-100 text-green-600">
                              {doctor.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">{doctor.name}</p>
                            <div className="flex items-center gap-2">
                              <p className="text-xs text-muted-foreground">{doctor.transactions} appointments</p>
                              <Badge 
                                variant="secondary" 
                                className="text-xs bg-amber-100 text-amber-800 hover:bg-amber-100"
                              >
                                ${doctor.commission.toFixed(2)} commission
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <p className="font-medium text-green-600">${Number.parseFloat(doctor.revenue).toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="commissions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Platform Commissions</CardTitle>
                <CardDescription>$10 commission earned per appointment</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="w-full h-[300px] flex items-center justify-center">
                    <Skeleton className="w-full h-full" />
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Summary Card */}
                    <Card className="bg-amber-50">
                      <CardContent className="p-4 flex flex-col md:flex-row md:items-center md:justify-between">
                        <div className="space-y-1 mb-4 md:mb-0">
                          <h3 className="font-medium text-amber-800">Total Commission Earned</h3>
                          <p className="text-xs text-amber-700">From all appointments ($10 per appointment)</p>
                        </div>
                        <div className="text-2xl font-bold text-amber-800">${stats.totalCommission.toLocaleString()}</div>
                      </CardContent>
                    </Card>
                    
                    {/* Commission by Month */}
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart
                        data={commissionData}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip 
                          formatter={(value) => [`$${value}`, 'Commission']}
                          labelFormatter={(label) => `Month: ${label}`}
                        />
                        <Bar 
                          dataKey="commission" 
                          fill="#F59E0B" 
                          name="Commission" 
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                    
                    {/* Commission Calculation Explanation */}
                    <div className="p-4 border rounded-md bg-gray-50">
                      <h3 className="font-medium mb-2">Commission Calculation</h3>
                      <p className="text-sm text-gray-600 mb-2">
                        The platform earns $10 for each appointment booked through the system.
                      </p>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center justify-between p-2 bg-white rounded border">
                          <span>Commission Rate:</span>
                          <span className="font-medium">$10 per appointment</span>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-white rounded border">
                          <span>Total Appointments:</span>
                          <span className="font-medium">{stats.totalAppointments}</span>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-white rounded border">
                          <span>Telemedicine Commission:</span>
                          <span className="font-medium">${(stats.telemedicineAppointments * 10).toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-white rounded border">
                          <span>In-Person Commission:</span>
                          <span className="font-medium">${(stats.inPersonAppointments * 10).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ResponsiveAdminPageWrapper>
  )
}

interface StatsCardProps {
  title: string
  value: string | number
  description: string
  icon: React.ReactNode
  loading: boolean
}

function StatsCard({ title, value, description, icon, loading }: StatsCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        {loading ? <Skeleton className="h-7 w-[100px]" /> : <div className="text-2xl font-bold">{value}</div>}
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}


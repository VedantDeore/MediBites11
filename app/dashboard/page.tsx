"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, Clock, FileText, HeartPulse, DollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getPatientBalance } from "@/lib/patient-firebase"
import { Loader2 } from "lucide-react"
import { useMobile } from "@/hooks/use-mobile"
import { manageFunds } from "@/lib/transaction-service"
import { toast } from "react-hot-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { CreditCard, Wallet, Plus } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import PaymentForm from "@/components/payment/PaymentForm"

export default function DashboardPage() {
  const { user } = useAuth()
  const [balance, setBalance] = useState<number>(0)
  const [loadingBalance, setLoadingBalance] = useState<boolean>(true)
  const isMobile = useMobile()
  const [isManageFundsOpen, setIsManageFundsOpen] = useState(false)
  const [selectedAmount, setSelectedAmount] = useState<string>("")
  const [customAmount, setCustomAmount] = useState<string>("")
  const [paymentMethod, setPaymentMethod] = useState("credit-card")

  useEffect(() => {
    const fetchBalance = async () => {
      if (user && user.id) {
        setLoadingBalance(true)
        try {
          const currentBalance = await getPatientBalance(user.id)
          setBalance(currentBalance)
        } catch (error) {
          console.error("Error fetching balance:", error)
        } finally {
          setLoadingBalance(false)
        }
      }
    }

    fetchBalance()
  }, [user])

  const handleTransaction = async (
    amount: number, 
    type: "deposit" | "payment" | "refund",
    description: string
  ) => {
    try {
      if (!amount || isNaN(amount) || amount <= 0) {
        toast.error("Please enter a valid amount")
        return
      }

      const result = await manageFunds(
        user.id,
        amount,
        type,
        {
          description,
        }
      )
      
      if (result.success) {
        // Update local balance
        setBalance(prev => prev + amount)
        
        // Show success toast with sparkles
        toast.custom((t) => (
          <div className={`${
            t.visible ? 'animate-enter' : 'animate-leave'
          } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}>
            <div className="flex-1 w-0 p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0 pt-0.5">
                  <span className="text-2xl">✨</span>
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    Funds Added Successfully!
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    ${amount.toFixed(2)} has been added to your wallet
                  </p>
                </div>
              </div>
            </div>
            <div className="flex border-l border-gray-200">
              <button
                onClick={() => toast.dismiss(t.id)}
                className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-green-600 hover:text-green-500 focus:outline-none"
              >
                Close
              </button>
            </div>
          </div>
        ), {
          duration: 4000,
          position: 'top-right',
        })

        // Refresh balance
        const updatedBalance = await getPatientBalance(user.id)
        setBalance(updatedBalance)
      }
    } catch (error) {
      console.error("Transaction failed:", error)
      toast.error(error instanceof Error ? error.message : "Transaction failed")
    }
  }

  if (!user) {
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {user.name}! Here's an overview of your health.</p>
        </div>
        <Button className="bg-green-600 hover:bg-green-700">Book Appointment</Button>
      </div>

      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        {/* Account Balance Card */}
        <Card className="col-span-2 md:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Account Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            {loadingBalance ? (
              <div className="flex items-center justify-center h-[40px]">
                <Loader2 className="h-4 w-4 animate-spin text-green-600" />
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">
                  <motion.div
                    key={balance}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 10 }}
                  >
                    ${balance?.toFixed(2) || "0.00"}
                  </motion.div>
                </div>
                <p className="text-xs text-muted-foreground">
                  <Dialog open={isManageFundsOpen} onOpenChange={setIsManageFundsOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="link"
                        className="h-auto p-0 text-xs text-green-600"
                      >
                        Manage funds
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                      <DialogHeader>
                        <DialogTitle>Manage Your Funds</DialogTitle>
                        <DialogDescription>
                          Add funds to your healthcare wallet or view your transaction history
                        </DialogDescription>
                      </DialogHeader>

                      <Tabs defaultValue="add" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="add">Add Funds</TabsTrigger>
                          <TabsTrigger value="history">Transaction History</TabsTrigger>
                        </TabsList>

                        <TabsContent value="add" className="space-y-4 mt-4">
                          <PaymentForm 
                            onSuccess={(amount) => {
                              // Handle successful payment
                              handleTransaction(amount, "deposit", "Wallet top-up via Razorpay");
                              setIsManageFundsOpen(false);
                            }}
                            initialAmount={selectedAmount || customAmount}
                            userDetails={{
                              name: user.name || "",
                              email: user.email || "",
                              phone: user.phoneNumber || "",
                            }}
                          />
                        </TabsContent>

                        <TabsContent value="history" className="mt-4">
                          <div className="space-y-4">
                            {/* Example transaction history items */}
                            <Card>
                              <CardContent className="p-4 flex items-center justify-between">
                                <div>
                                  <p className="font-medium">Wallet Top-up</p>
                                  <p className="text-sm text-muted-foreground">Mar 22, 2024</p>
                                </div>
                                <span className="text-green-600 font-medium">+$100.00</span>
                              </CardContent>
                            </Card>
                            <Card>
                              <CardContent className="p-4 flex items-center justify-between">
                                <div>
                                  <p className="font-medium">Appointment Payment</p>
                                  <p className="text-sm text-muted-foreground">Mar 20, 2024</p>
                                </div>
                                <span className="text-red-600 font-medium">-$50.00</span>
                              </CardContent>
                            </Card>
                            {/* Add more transaction history items as needed */}
                          </div>
                        </TabsContent>
                      </Tabs>
                    </DialogContent>
                  </Dialog>
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Appointments</CardTitle>
            <Calendar className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{user.upcomingAppointments?.length || 0}</div>
            {user.upcomingAppointments && user.upcomingAppointments.length > 0 ? (
              <p className="text-xs text-muted-foreground">
                Next: {user.upcomingAppointments[0].doctorName},{" "}
                {new Date(user.upcomingAppointments[0].date).toLocaleDateString()}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">No upcoming appointments</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Health Score</CardTitle>
            <HeartPulse className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{user.healthScore || "N/A"}</div>
            <p className="text-xs text-muted-foreground">
              {user.healthScore && user.healthScore > 70 ? "Good" : "Needs improvement"}
            </p>
          </CardContent>
        </Card>
        <Card className="col-span-2 md:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Medications</CardTitle>
            <FileText className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{user.medications?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Active prescriptions</p>
          </CardContent>
        </Card>
        <Card className="col-span-2 md:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Tests</CardTitle>
            <Clock className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{user.labReports?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              {user.labReports && user.labReports.length > 0 ? `Last: ${user.labReports[0].name}` : "No recent tests"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="appointments" className="w-full">
        <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 lg:w-auto overflow-x-auto">
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
          <TabsTrigger value="records">Medical Records</TabsTrigger>
          <TabsTrigger value="predictions">Health Predictions</TabsTrigger>
          <TabsTrigger value="medications">Medications</TabsTrigger>
          <TabsTrigger value="contacts">Emergency Contacts</TabsTrigger>
          <TabsTrigger value="finances">Finances</TabsTrigger>
        </TabsList>

        <TabsContent value="appointments" className="space-y-4 mt-4">
          <h2 className="text-xl font-semibold">Upcoming Appointments</h2>
          {user.upcomingAppointments && user.upcomingAppointments.length > 0 ? (
            <div className="space-y-4">
              {user.upcomingAppointments.map((appointment) => (
                <Card key={appointment.id}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{appointment.doctorName}</h3>
                      <p className="text-sm text-muted-foreground">{appointment.specialty}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-green-600" />
                      <span className="text-sm">
                        {new Date(appointment.date).toLocaleDateString()}, {appointment.time}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground">No upcoming appointments</p>
                <Button className="mt-4 bg-green-600 hover:bg-green-700">Schedule Appointment</Button>
              </CardContent>
            </Card>
          )}

          <h2 className="text-xl font-semibold mt-8">Past Appointments</h2>
          {user.pastAppointments && user.pastAppointments.length > 0 ? (
            <div className="space-y-4">
              {user.pastAppointments.map((appointment) => (
                <Card key={appointment.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h3 className="font-medium">{appointment.doctorName}</h3>
                        <p className="text-sm text-muted-foreground">{appointment.specialty}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-green-600" />
                        <span className="text-sm">
                          {new Date(appointment.date).toLocaleDateString()}, {appointment.time}
                        </span>
                      </div>
                    </div>
                    {appointment.notes && (
                      <div className="mt-2 text-sm border-t pt-2">
                        <p className="font-medium">Notes:</p>
                        <p className="text-muted-foreground">{appointment.notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground">No past appointments</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="records" className="space-y-4 mt-4">
          {/* Existing records content */}
        </TabsContent>

        <TabsContent value="predictions" className="space-y-4 mt-4">
          {/* Existing predictions content */}
        </TabsContent>

        <TabsContent value="medications" className="space-y-4 mt-4">
          {/* Existing medications content */}
        </TabsContent>

        <TabsContent value="contacts" className="space-y-4 mt-4">
          {/* Existing contacts content */}
        </TabsContent>

        {/* New finances tab */}
        <TabsContent value="finances" className="space-y-4 mt-4">
          <h2 className="text-xl font-semibold">Financial Overview</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Current Balance</CardTitle>
                <CardDescription>Your healthcare wallet</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-8 w-8 text-green-600" />
                  <span className="text-3xl font-bold">${balance.toFixed(2)}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Use your balance to pay for appointments and medical services
                </p>
                <div className="mt-4 space-y-2">
                  <Button
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={() => {
                      // Navigate to appointments page
                      window.location.href = "/dashboard/appointments"
                    }}
                  >
                    Book an Appointment
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      // Open add funds dialog
                      document.getElementById("add-funds-button")?.click()
                    }}
                  >
                    Add Funds
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>Your payment history</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* This would be populated from Firebase */}
                  <p className="text-center text-muted-foreground py-8">No recent transactions</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}


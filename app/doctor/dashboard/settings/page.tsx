"use client"

import { useState } from "react"
import { useDoctorAuth } from "@/lib/doctor-auth-context"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  AlertCircle,
  Bell,
  Check,
  CreditCard,
  Globe,
  Key,
  Lock,
  LogOut,
  Mail,
  Moon,
  Palette,
  Save,
  Shield,
  Smartphone,
  Sun,
  Upload,
  User,
  X,
  Laptop,
  Calendar,
  Video,
} from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

export default function DoctorSettingsPage() {
  const { doctor } = useDoctorAuth()
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "success" | "error">("idle")
  const [theme, setTheme] = useState<"light" | "dark" | "system">("light")
  const [colorScheme, setColorScheme] = useState<"purple" | "blue" | "green" | "indigo">("purple")
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [showTwoFactorSetup, setShowTwoFactorSetup] = useState(false)

  // Mock settings data
  const notificationSettings = {
    email: {
      appointments: true,
      reminders: true,
      marketing: false,
      system: true,
    },
    push: {
      appointments: true,
      reminders: true,
      marketing: false,
      system: false,
    },
    sms: {
      appointments: false,
      reminders: false,
      system: false,
    },
  }

  const privacySettings = {
    shareProfilePublicly: true,
    allowPatientReviews: true,
    showAvailabilityPublicly: true,
    dataUsageForResearch: false,
  }

  const integrations = [
    {
      name: "Electronic Health Records (EHR)",
      connected: true,
      status: "active",
      lastSync: "2023-12-10T14:30:00",
    },
    {
      name: "Laboratory System",
      connected: true,
      status: "active",
      lastSync: "2023-12-12T09:15:00",
    },
    {
      name: "Billing Software",
      connected: false,
      status: "disconnected",
      lastSync: null,
    },
    {
      name: "Pharmacy System",
      connected: true,
      status: "error",
      lastSync: "2023-12-01T11:45:00",
    },
  ]

  // Handle save settings
  const handleSaveSettings = () => {
    setSaveStatus("saving")
    // Simulate API call
    setTimeout(() => {
      setSaveStatus("success")
      // Reset status after showing success message
      setTimeout(() => {
        setSaveStatus("idle")
      }, 3000)
    }, 1500)
  }

  // Toggle two-factor authentication
  const handleToggleTwoFactor = () => {
    if (!twoFactorEnabled) {
      setShowTwoFactorSetup(true)
    } else {
      setTwoFactorEnabled(false)
    }
  }

  // Complete two-factor setup
  const handleCompleteTwoFactorSetup = () => {
    setTwoFactorEnabled(true)
    setShowTwoFactorSetup(false)
  }

  // Format date for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never"
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "numeric",
    }).format(date)
  }

  // Get integration status color
  const getIntegrationStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "error":
        return "bg-red-100 text-red-800"
      case "disconnected":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (!doctor) {
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">Manage your account settings and preferences</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {saveStatus === "success" && (
            <Alert variant="success" className="py-2 px-3 h-10 flex items-center bg-green-50 border-green-200">
              <Check className="h-4 w-4 text-green-600 mr-2" />
              <AlertDescription className="text-green-600 text-sm">Settings saved successfully</AlertDescription>
            </Alert>
          )}
          {saveStatus === "error" && (
            <Alert variant="destructive" className="py-2 px-3 h-10 flex items-center">
              <AlertCircle className="h-4 w-4 mr-2" />
              <AlertDescription className="text-sm">Failed to save settings</AlertDescription>
            </Alert>
          )}
          <Button
            onClick={handleSaveSettings}
            className="bg-purple-600 hover:bg-purple-700 w-full sm:w-auto"
            disabled={saveStatus === "saving"}
          >
            {saveStatus === "saving" ? (
              <>
                <div className="h-4 w-4 mr-2 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="account">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:w-auto">
          <TabsTrigger value="account" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span>Account</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span>Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span>Security</span>
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            <span>Appearance</span>
          </TabsTrigger>
          <TabsTrigger value="integrations" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            <span>Integrations</span>
          </TabsTrigger>
        </TabsList>

        {/* Account Tab */}
        <TabsContent value="account" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your personal information and public profile</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex flex-col items-center space-y-2">
                  <div className="relative h-32 w-32">
                    {doctor.profilePicture ? (
                      <Avatar className="h-32 w-32">
                        <AvatarImage src={doctor.profilePicture} alt={doctor.name} />
                        <AvatarFallback className="text-2xl">{doctor.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                    ) : (
                      <div className="flex h-32 w-32 items-center justify-center rounded-full bg-purple-100 text-purple-600">
                        <span className="text-4xl font-bold">{doctor.name.charAt(0)}</span>
                      </div>
                    )}
                    <Button
                      size="sm"
                      className="absolute bottom-0 right-0 bg-purple-600 hover:bg-purple-700 h-8 w-8 rounded-full p-0"
                    >
                      <Upload className="h-4 w-4" />
                      <span className="sr-only">Change picture</span>
                    </Button>
                  </div>
                  <Button variant="outline" size="sm">
                    Upload New Picture
                  </Button>
                </div>

                <div className="flex-1 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input id="name" defaultValue={doctor.name} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" defaultValue={doctor.email} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="specialty">Specialty</Label>
                      <Input id="specialty" defaultValue={doctor.specialty} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input id="phone" defaultValue="+1 (555) 123-4567" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">Professional Bio</Label>
                    <Textarea
                      id="bio"
                      placeholder="Write a short professional bio..."
                      className="min-h-[100px]"
                      defaultValue="Board-certified cardiologist with over 15 years of experience in diagnosing and treating cardiovascular conditions. Specializing in preventive cardiology and heart failure management."
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Practice Information</CardTitle>
              <CardDescription>Update information about your medical practice</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="practiceName">Practice Name</Label>
                  <Input id="practiceName" defaultValue="MediCare Health Center" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="practiceWebsite">Practice Website</Label>
                  <Input id="practiceWebsite" defaultValue="https://medicarehealth.com" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="practiceAddress">Practice Address</Label>
                <Textarea id="practiceAddress" defaultValue="123 Medical Plaza, Suite 456, New York, NY 10001" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="workingHours">Working Hours</Label>
                <Textarea
                  id="workingHours"
                  defaultValue="Monday-Friday: 9:00 AM - 5:00 PM, Saturday: 9:00 AM - 1:00 PM"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Privacy Settings</CardTitle>
              <CardDescription>Control how your information is displayed and shared</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="shareProfilePublicly">Share Profile Publicly</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow your profile to be visible in doctor directories
                  </p>
                </div>
                <Switch id="shareProfilePublicly" checked={privacySettings.shareProfilePublicly} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="allowPatientReviews">Allow Patient Reviews</Label>
                  <p className="text-sm text-muted-foreground">Allow patients to leave reviews on your profile</p>
                </div>
                <Switch id="allowPatientReviews" checked={privacySettings.allowPatientReviews} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="showAvailabilityPublicly">Show Availability Publicly</Label>
                  <p className="text-sm text-muted-foreground">Display your available appointment slots publicly</p>
                </div>
                <Switch id="showAvailabilityPublicly" checked={privacySettings.showAvailabilityPublicly} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="dataUsageForResearch">Data Usage for Research</Label>
                  <p className="text-sm text-muted-foreground">Allow anonymized data to be used for medical research</p>
                </div>
                <Switch id="dataUsageForResearch" checked={privacySettings.dataUsageForResearch} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Billing Information</CardTitle>
              <CardDescription>Manage your billing details and payment methods</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <CreditCard className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">Visa ending in 4242</p>
                    <p className="text-sm text-muted-foreground">Expires 12/2025</p>
                  </div>
                </div>
                <Badge>Default</Badge>
              </div>

              <Button variant="outline" className="w-full">
                <CreditCard className="h-4 w-4 mr-2" />
                Add Payment Method
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Danger Zone</CardTitle>
              <CardDescription>Irreversible and destructive actions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 border border-red-200 rounded-lg bg-red-50">
                <h3 className="text-lg font-medium text-red-800">Delete Account</h3>
                <p className="text-sm text-red-600 mt-1">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
                <Button variant="destructive" className="mt-4">
                  Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Email Notifications</CardTitle>
              <CardDescription>Manage the emails you receive from us</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="emailAppointments">Appointment Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive emails about new, cancelled, or rescheduled appointments
                  </p>
                </div>
                <Switch id="emailAppointments" checked={notificationSettings.email.appointments} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="emailReminders">Reminders</Label>
                  <p className="text-sm text-muted-foreground">Receive reminder emails about upcoming appointments</p>
                </div>
                <Switch id="emailReminders" checked={notificationSettings.email.reminders} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="emailMarketing">Marketing</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive emails about new features, updates, and promotions
                  </p>
                </div>
                <Switch id="emailMarketing" checked={notificationSettings.email.marketing} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="emailSystem">System Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive emails about system updates, maintenance, and security alerts
                  </p>
                </div>
                <Switch id="emailSystem" checked={notificationSettings.email.system} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Push Notifications</CardTitle>
              <CardDescription>Manage notifications on your devices</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="pushAppointments">Appointment Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive push notifications about new, cancelled, or rescheduled appointments
                  </p>
                </div>
                <Switch id="pushAppointments" checked={notificationSettings.push.appointments} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="pushReminders">Reminders</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive reminder push notifications about upcoming appointments
                  </p>
                </div>
                <Switch id="pushReminders" checked={notificationSettings.push.reminders} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="pushMarketing">Marketing</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive push notifications about new features, updates, and promotions
                  </p>
                </div>
                <Switch id="pushMarketing" checked={notificationSettings.push.marketing} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="pushSystem">System Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive push notifications about system updates, maintenance, and security alerts
                  </p>
                </div>
                <Switch id="pushSystem" checked={notificationSettings.push.system} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>SMS Notifications</CardTitle>
              <CardDescription>Manage text message notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="smsAppointments">Appointment Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive SMS about new, cancelled, or rescheduled appointments
                  </p>
                </div>
                <Switch id="smsAppointments" checked={notificationSettings.sms.appointments} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="smsReminders">Reminders</Label>
                  <p className="text-sm text-muted-foreground">Receive reminder SMS about upcoming appointments</p>
                </div>
                <Switch id="smsReminders" checked={notificationSettings.sms.reminders} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="smsMarketing">Marketing</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive SMS about new features, updates, and promotions
                  </p>
                </div>
                <Switch id="smsMarketing" checked={notificationSettings.sms.marketing} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="smsSystem">System Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive SMS about system updates, maintenance, and security alerts
                  </p>
                </div>
                <Switch id="smsSystem" checked={notificationSettings.sms.system} />
              </div>
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
              <div className="space-y-2 w-full">
                <Label htmlFor="phoneNumber">Phone Number for SMS</Label>
                <div className="flex gap-2">
                  <Input id="phoneNumber" defaultValue="+1 (555) 123-4567" />
                  <Button className="bg-purple-600 hover:bg-purple-700">Verify</Button>
                </div>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>Update your password to keep your account secure</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input id="currentPassword" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input id="newPassword" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input id="confirmPassword" type="password" />
              </div>
              <div className="text-sm text-muted-foreground">
                <p>Password requirements:</p>
                <ul className="list-disc pl-5 space-y-1 mt-1">
                  <li>At least 8 characters long</li>
                  <li>Must include at least one uppercase letter</li>
                  <li>Must include at least one number</li>
                  <li>Must include at least one special character</li>
                </ul>
              </div>
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
              <Button className="bg-purple-600 hover:bg-purple-700">
                <Key className="h-4 w-4 mr-2" />
                Update Password
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Two-Factor Authentication</CardTitle>
              <CardDescription>Add an extra layer of security to your account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {showTwoFactorSetup ? (
                <div className="space-y-4">
                  <Alert className="bg-yellow-50 border-yellow-200">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <AlertTitle className="text-yellow-600">Setup Required</AlertTitle>
                    <AlertDescription className="text-yellow-700">
                      Scan the QR code below with your authenticator app to set up two-factor authentication.
                    </AlertDescription>
                  </Alert>

                  <div className="flex flex-col items-center space-y-4">
                    <div className="border p-4 rounded-lg">
                      {/* This would be a QR code in a real app */}
                      <div className="h-48 w-48 bg-gray-200 flex items-center justify-center">
                        <p className="text-sm text-muted-foreground">QR Code Placeholder</p>
                      </div>
                    </div>

                    <div className="text-center">
                      <p className="text-sm font-medium">Can't scan the QR code?</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Use this code instead: <span className="font-mono">ABCD EFGH IJKL MNOP</span>
                      </p>
                    </div>

                    <div className="space-y-2 w-full">
                      <Label htmlFor="verificationCode">Verification Code</Label>
                      <Input id="verificationCode" placeholder="Enter the 6-digit code" />
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setShowTwoFactorSetup(false)}>
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                      <Button className="bg-purple-600 hover:bg-purple-700" onClick={handleCompleteTwoFactorSetup}>
                        <Check className="h-4 w-4 mr-2" />
                        Verify and Enable
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="twoFactorAuth">Two-Factor Authentication</Label>
                    <p className="text-sm text-muted-foreground">Require a verification code when signing in</p>
                  </div>
                  <Switch id="twoFactorAuth" checked={twoFactorEnabled} onCheckedChange={handleToggleTwoFactor} />
                </div>
              )}

              {twoFactorEnabled && !showTwoFactorSetup && (
                <div className="mt-4">
                  <Alert className="bg-green-50 border-green-200">
                    <Check className="h-4 w-4 text-green-600" />
                    <AlertTitle className="text-green-600">Two-Factor Authentication Enabled</AlertTitle>
                    <AlertDescription className="text-green-700">
                      Your account is now protected with an additional layer of security.
                    </AlertDescription>
                  </Alert>

                  <div className="mt-4 space-y-2">
                    <h4 className="text-sm font-medium">Recovery Codes</h4>
                    <p className="text-sm text-muted-foreground">
                      Save these recovery codes in a secure place. You can use them to access your account if you lose
                      your authentication device.
                    </p>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {["ABCD-EFGH-IJKL", "MNOP-QRST-UVWX", "YZAB-CDEF-GHIJ", "KLMN-OPQR-STUV"].map((code, index) => (
                        <div key={index} className="font-mono text-sm p-2 bg-gray-100 rounded">
                          {code}
                        </div>
                      ))}
                    </div>
                    <Button variant="outline" size="sm" className="mt-2">
                      Download Recovery Codes
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Login Sessions</CardTitle>
              <CardDescription>Manage your active login sessions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                        <Smartphone className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium">Current Session</p>
                        <p className="text-sm text-muted-foreground">
                          Chrome on Windows • New York, USA • IP: 192.168.1.1
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Active Now</Badge>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                        <Smartphone className="h-5 w-5 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-medium">iPhone 13</p>
                        <p className="text-sm text-muted-foreground">
                          Safari on iOS • Boston, USA • Last active: 2 days ago
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                      Revoke
                    </Button>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                        <Smartphone className="h-5 w-5 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-medium">MacBook Pro</p>
                        <p className="text-sm text-muted-foreground">
                          Firefox on macOS • New York, USA • Last active: 5 days ago
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                      Revoke
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
              <Button variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out of All Sessions
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Login History</CardTitle>
              <CardDescription>Recent login activity on your account</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    device: "Chrome on Windows",
                    location: "New York, USA",
                    time: "Today, 10:30 AM",
                    status: "success",
                  },
                  {
                    device: "Safari on iPhone",
                    location: "Boston, USA",
                    time: "2 days ago, 3:45 PM",
                    status: "success",
                  },
                  {
                    device: "Firefox on macOS",
                    location: "New York, USA",
                    time: "5 days ago, 9:15 AM",
                    status: "success",
                  },
                  {
                    device: "Chrome on Windows",
                    location: "Chicago, USA",
                    time: "Dec 10, 2023, 7:22 PM",
                    status: "failed",
                  },
                ].map((login, index) => (
                  <div key={index} className="flex items-center gap-4 py-2">
                    <div
                      className={`h-2 w-2 rounded-full ${login.status === "success" ? "bg-green-500" : "bg-red-500"}`}
                    />
                    <div className="flex-1">
                      <p className="font-medium">{login.device}</p>
                      <p className="text-sm text-muted-foreground">{login.location}</p>
                    </div>
                    <div className="text-sm text-muted-foreground">{login.time}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Tab */}
        <TabsContent value="appearance" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Theme</CardTitle>
              <CardDescription>Customize the appearance of the application</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Theme Mode</Label>
                <RadioGroup
                  defaultValue={theme}
                  onValueChange={(value) => setTheme(value as "light" | "dark" | "system")}
                  className="flex flex-col space-y-1"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="light" id="theme-light" />
                    <Label htmlFor="theme-light" className="flex items-center gap-2">
                      <Sun className="h-4 w-4" />
                      Light
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="dark" id="theme-dark" />
                    <Label htmlFor="theme-dark" className="flex items-center gap-2">
                      <Moon className="h-4 w-4" />
                      Dark
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="system" id="theme-system" />
                    <Label htmlFor="theme-system" className="flex items-center gap-2">
                      <Laptop className="h-4 w-4" />
                      System
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Color Scheme</Label>
                <RadioGroup
                  defaultValue={colorScheme}
                  onValueChange={(value) => setColorScheme(value as "purple" | "blue" | "green" | "indigo")}
                  className="grid grid-cols-2 gap-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="purple" id="color-purple" />
                    <Label htmlFor="color-purple" className="flex items-center gap-2">
                      <div className="h-4 w-4 rounded-full bg-purple-600" />
                      Purple
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="blue" id="color-blue" />
                    <Label htmlFor="color-blue" className="flex items-center gap-2">
                      <div className="h-4 w-4 rounded-full bg-blue-600" />
                      Blue
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="green" id="color-green" />
                    <Label htmlFor="color-green" className="flex items-center gap-2">
                      <div className="h-4 w-4 rounded-full bg-green-600" />
                      Green
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="indigo" id="color-indigo" />
                    <Label htmlFor="color-indigo" className="flex items-center gap-2">
                      <div className="h-4 w-4 rounded-full bg-indigo-600" />
                      Indigo
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Font Size</Label>
                <Select defaultValue="medium">
                  <SelectTrigger>
                    <SelectValue placeholder="Select font size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Small</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="large">Large</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="reducedMotion">Reduced Motion</Label>
                  <Switch id="reducedMotion" />
                </div>
                <p className="text-sm text-muted-foreground">Reduce the amount of animations and transitions</p>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="highContrast">High Contrast</Label>
                  <Switch id="highContrast" />
                </div>
                <p className="text-sm text-muted-foreground">Increase contrast for better visibility</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Dashboard Layout</CardTitle>
              <CardDescription>Customize your dashboard layout and widgets</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Default Dashboard View</Label>
                <Select defaultValue="overview">
                  <SelectTrigger>
                    <SelectValue placeholder="Select default view" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="overview">Overview</SelectItem>
                    <SelectItem value="appointments">Appointments</SelectItem>
                    <SelectItem value="patients">Patients</SelectItem>
                    <SelectItem value="analytics">Analytics</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Widget Visibility</Label>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm">Recent Patients</p>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm">Upcoming Appointments</p>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm">Performance Metrics</p>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm">Revenue Statistics</p>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm">Patient Demographics</p>
                    <Switch defaultChecked />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrations Tab */}
        <TabsContent value="integrations" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Connected Services</CardTitle>
              <CardDescription>Manage your connected third-party services and integrations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {integrations.map((integration, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                        <Globe className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium">{integration.name}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Badge variant="outline" className={getIntegrationStatusColor(integration.status)}>
                            {integration.status.charAt(0).toUpperCase() + integration.status.slice(1)}
                          </Badge>
                          {integration.lastSync && <span>Last synced: {formatDate(integration.lastSync)}</span>}
                        </div>
                      </div>
                    </div>
                    <div>
                      {integration.connected ? (
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            Sync Now
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            Disconnect
                          </Button>
                        </div>
                      ) : (
                        <Button className="bg-purple-600 hover:bg-purple-700">Connect</Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Available Integrations</CardTitle>
              <CardDescription>Discover and connect to additional services</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <Mail className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Email Integration</p>
                      <p className="text-sm text-muted-foreground">Connect your email to send appointment reminders</p>
                    </div>
                    <Button className="bg-purple-600 hover:bg-purple-700">Connect</Button>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                      <CreditCard className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Payment Gateway</p>
                      <p className="text-sm text-muted-foreground">Process payments directly through the platform</p>
                    </div>
                    <Button className="bg-purple-600 hover:bg-purple-700">Connect</Button>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-amber-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Calendar Integration</p>
                      <p className="text-sm text-muted-foreground">Sync with Google Calendar or Outlook</p>
                    </div>
                    <Button className="bg-purple-600 hover:bg-purple-700">Connect</Button>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                      <Video className="h-5 w-5 text-red-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Video Conferencing</p>
                      <p className="text-sm text-muted-foreground">Integrate with Zoom or Microsoft Teams</p>
                    </div>
                    <Button className="bg-purple-600 hover:bg-purple-700">Connect</Button>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
              <Button variant="outline" className="w-full">
                Browse Integration Marketplace
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>API Access</CardTitle>
              <CardDescription>Manage API keys and access for developers</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="bg-yellow-50 border-yellow-200">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <AlertTitle className="text-yellow-600">Developer Feature</AlertTitle>
                <AlertDescription className="text-yellow-700">
                  API access is intended for developers. Make sure you understand the security implications before
                  creating API keys.
                </AlertDescription>
              </Alert>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Primary API Key</p>
                    <p className="text-sm text-muted-foreground">Created on Dec 1, 2023 • Last used 2 days ago</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Lock className="h-4 w-4 mr-2" />
                      Show Key
                    </Button>
                    <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                      Revoke
                    </Button>
                  </div>
                </div>
              </div>

              <Button className="bg-purple-600 hover:bg-purple-700">Generate New API Key</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}


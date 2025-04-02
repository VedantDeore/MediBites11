"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { AlertCircle, Check, Key, Moon, Save, Shield, Sun } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"

export default function SettingsPage() {
  const { user } = useAuth()
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system")
  const [emailNotifications, setEmailNotifications] = useState({
    appointments: true,
    reminders: true,
    updates: false,
    marketing: false,
  })
  const [pushNotifications, setPushNotifications] = useState({
    appointments: true,
    reminders: true,
    updates: true,
    marketing: false,
  })
  const [saveSuccess, setSaveSuccess] = useState(false)
  const isMobile = useMobile()

  if (!user) {
    return null
  }

  const handleSave = () => {
    // Simulate saving settings
    setSaveSuccess(true)
    setTimeout(() => setSaveSuccess(false), 3000)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your account settings and preferences</p>
      </div>

      {saveSuccess && (
        <Alert className="bg-green-50 border-green-200">
          <Check className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800">Success</AlertTitle>
          <AlertDescription className="text-green-700">Your settings have been saved successfully.</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="account" className="w-full">
        <TabsList className={cn("grid w-full", isMobile ? "grid-cols-2 overflow-x-auto" : "grid-cols-4")}>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
        </TabsList>

        {/* Account Tab */}
        <TabsContent value="account" className="space-y-6 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your personal information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex flex-col items-center gap-2">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={user.avatar || "/placeholder.svg?height=96&width=96"} alt={user.name} />
                    <AvatarFallback className="text-lg">
                      {user.name
                        ?.split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <Button variant="outline" size="sm">
                    Change Photo
                  </Button>
                </div>
                <div className="flex-1 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input id="firstName" defaultValue={user.name?.split(" ")[0]} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input id="lastName" defaultValue={user.name?.split(" ")[1]} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" type="email" defaultValue={user.email} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" type="tel" defaultValue={user.phone || ""} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Update your personal details for better healthcare</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dob">Date of Birth</Label>
                  <Input id="dob" type="date" defaultValue={user.dateOfBirth || ""} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Select defaultValue={user.gender || ""}>
                    <SelectTrigger id="gender">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                      <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input id="address" defaultValue={user.address || ""} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" defaultValue={user.city || ""} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input id="state" defaultValue={user.state || ""} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zipCode">Zip Code</Label>
                  <Input id="zipCode" defaultValue={user.zipCode || ""} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="emergencyContact">Emergency Contact</Label>
                <Input id="emergencyContact" defaultValue={user.emergencyContact || ""} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Insurance Information</CardTitle>
              <CardDescription>Update your insurance details for billing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="insuranceProvider">Insurance Provider</Label>
                <Input id="insuranceProvider" defaultValue={user.insuranceProvider || ""} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="policyNumber">Policy Number</Label>
                  <Input id="policyNumber" defaultValue={user.policyNumber || ""} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="groupNumber">Group Number</Label>
                  <Input id="groupNumber" defaultValue={user.groupNumber || ""} />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button className="bg-green-600 hover:bg-green-700" onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Email Notifications</CardTitle>
              <CardDescription>Manage the emails you want to receive</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email-appointments">Appointment Reminders</Label>
                  <p className="text-sm text-muted-foreground">Receive emails about your upcoming appointments</p>
                </div>
                <Switch
                  id="email-appointments"
                  checked={emailNotifications.appointments}
                  onCheckedChange={(checked) => setEmailNotifications({ ...emailNotifications, appointments: checked })}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email-reminders">Medication Reminders</Label>
                  <p className="text-sm text-muted-foreground">Receive emails about medication refills and schedules</p>
                </div>
                <Switch
                  id="email-reminders"
                  checked={emailNotifications.reminders}
                  onCheckedChange={(checked) => setEmailNotifications({ ...emailNotifications, reminders: checked })}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email-updates">Health Updates</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive emails about your health records and test results
                  </p>
                </div>
                <Switch
                  id="email-updates"
                  checked={emailNotifications.updates}
                  onCheckedChange={(checked) => setEmailNotifications({ ...emailNotifications, updates: checked })}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email-marketing">Marketing</Label>
                  <p className="text-sm text-muted-foreground">Receive emails about new services and promotions</p>
                </div>
                <Switch
                  id="email-marketing"
                  checked={emailNotifications.marketing}
                  onCheckedChange={(checked) => setEmailNotifications({ ...emailNotifications, marketing: checked })}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Push Notifications</CardTitle>
              <CardDescription>Manage your mobile app notification preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="push-appointments">Appointment Alerts</Label>
                  <p className="text-sm text-muted-foreground">Receive push notifications for appointment reminders</p>
                </div>
                <Switch
                  id="push-appointments"
                  checked={pushNotifications.appointments}
                  onCheckedChange={(checked) => setPushNotifications({ ...pushNotifications, appointments: checked })}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="push-reminders">Medication Alerts</Label>
                  <p className="text-sm text-muted-foreground">Receive push notifications for medication reminders</p>
                </div>
                <Switch
                  id="push-reminders"
                  checked={pushNotifications.reminders}
                  onCheckedChange={(checked) => setPushNotifications({ ...pushNotifications, reminders: checked })}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="push-updates">Health Updates</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive push notifications for new test results and health updates
                  </p>
                </div>
                <Switch
                  id="push-updates"
                  checked={pushNotifications.updates}
                  onCheckedChange={(checked) => setPushNotifications({ ...pushNotifications, updates: checked })}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="push-marketing">Marketing</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive push notifications about new services and promotions
                  </p>
                </div>
                <Switch
                  id="push-marketing"
                  checked={pushNotifications.marketing}
                  onCheckedChange={(checked) => setPushNotifications({ ...pushNotifications, marketing: checked })}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button className="bg-green-600 hover:bg-green-700" onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Save Preferences
            </Button>
          </div>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>Update your password to keep your account secure</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <Input id="current-password" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input id="new-password" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input id="confirm-password" type="password" />
              </div>
              <Button className="bg-green-600 hover:bg-green-700">
                <Key className="h-4 w-4 mr-2" />
                Update Password
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Two-Factor Authentication</CardTitle>
              <CardDescription>Add an extra layer of security to your account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Two-Factor Authentication</Label>
                  <p className="text-sm text-muted-foreground">Protect your account with two-factor authentication</p>
                </div>
                <Switch defaultChecked={false} />
              </div>
              <Alert className="bg-blue-50 border-blue-200">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertTitle className="text-blue-800">Information</AlertTitle>
                <AlertDescription className="text-blue-700">
                  Two-factor authentication adds an additional layer of security to your account by requiring more than
                  just a password to sign in.
                </AlertDescription>
              </Alert>
              <Button variant="outline">
                <Shield className="h-4 w-4 mr-2" />
                Setup Two-Factor Authentication
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Privacy Settings</CardTitle>
              <CardDescription>Manage how your information is used</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="data-sharing">Data Sharing for Research</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow anonymized health data to be used for medical research
                  </p>
                </div>
                <Switch id="data-sharing" defaultChecked={true} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="third-party">Third-Party Access</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow third-party applications to access your health data
                  </p>
                </div>
                <Switch id="third-party" defaultChecked={false} />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button className="bg-green-600 hover:bg-green-700" onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Save Security Settings
            </Button>
          </div>
        </TabsContent>

        {/* Appearance Tab */}
        <TabsContent value="appearance" className="space-y-6 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Theme</CardTitle>
              <CardDescription>Customize the appearance of the application</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div
                  className={`border rounded-lg p-4 cursor-pointer flex flex-col items-center ${
                    theme === "light" ? "border-green-600 bg-green-50" : "border-muted"
                  }`}
                  onClick={() => setTheme("light")}
                >
                  <div className="h-10 w-10 rounded-full bg-white border flex items-center justify-center mb-2">
                    <Sun className="h-5 w-5 text-yellow-500" />
                  </div>
                  <span className="text-sm font-medium">Light</span>
                </div>
                <div
                  className={`border rounded-lg p-4 cursor-pointer flex flex-col items-center ${
                    theme === "dark" ? "border-green-600 bg-green-50" : "border-muted"
                  }`}
                  onClick={() => setTheme("dark")}
                >
                  <div className="h-10 w-10 rounded-full bg-gray-900 border flex items-center justify-center mb-2">
                    <Moon className="h-5 w-5 text-gray-100" />
                  </div>
                  <span className="text-sm font-medium">Dark</span>
                </div>
                <div
                  className={`border rounded-lg p-4 cursor-pointer flex flex-col items-center ${
                    theme === "system" ? "border-green-600 bg-green-50" : "border-muted"
                  }`}
                  onClick={() => setTheme("system")}
                >
                  <div className="h-10 w-10 rounded-full bg-gradient-to-r from-white to-gray-900 border flex items-center justify-center mb-2">
                    <Sun className="h-5 w-5 text-yellow-500 -translate-x-1" />
                    <Moon className="h-5 w-5 text-gray-100 translate-x-1" />
                  </div>
                  <span className="text-sm font-medium">System</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Dashboard Layout</CardTitle>
              <CardDescription>Customize how your dashboard is organized</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="default-view">Default Dashboard View</Label>
                <Select defaultValue="summary">
                  <SelectTrigger id="default-view">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="summary">Health Summary</SelectItem>
                    <SelectItem value="appointments">Appointments</SelectItem>
                    <SelectItem value="records">Medical Records</SelectItem>
                    <SelectItem value="analytics">Health Analytics</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Widget Visibility</Label>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="widget-appointments" className="cursor-pointer">
                      Upcoming Appointments
                    </Label>
                    <Switch id="widget-appointments" defaultChecked={true} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="widget-medications" className="cursor-pointer">
                      Medication Reminders
                    </Label>
                    <Switch id="widget-medications" defaultChecked={true} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="widget-vitals" className="cursor-pointer">
                      Recent Vital Signs
                    </Label>
                    <Switch id="widget-vitals" defaultChecked={true} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="widget-reports" className="cursor-pointer">
                      Recent Lab Reports
                    </Label>
                    <Switch id="widget-reports" defaultChecked={true} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Accessibility</CardTitle>
              <CardDescription>Customize accessibility settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="font-size">Font Size</Label>
                <Select defaultValue="medium">
                  <SelectTrigger id="font-size">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Small</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="large">Large</SelectItem>
                    <SelectItem value="x-large">Extra Large</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="reduced-motion">Reduced Motion</Label>
                  <p className="text-sm text-muted-foreground">Minimize animations throughout the interface</p>
                </div>
                <Switch id="reduced-motion" defaultChecked={false} />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="high-contrast">High Contrast</Label>
                  <p className="text-sm text-muted-foreground">Increase contrast for better visibility</p>
                </div>
                <Switch id="high-contrast" defaultChecked={false} />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button className="bg-green-600 hover:bg-green-700" onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Save Appearance Settings
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button className="bg-green-600 hover:bg-green-700" onClick={handleSave}>
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </Button>
      </div>
    </div>
  )
}


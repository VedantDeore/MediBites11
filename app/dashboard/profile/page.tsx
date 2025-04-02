"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Camera } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/lib/auth-context"
import { Alert, AlertDescription } from "@/components/ui/alert"
// Add the mobile hook import at the top with other imports
import { useMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"

// Inside the component, add the isMobile hook
export default function ProfilePage() {
  const { user, updateUser, uploadPicture, loading, error } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const isMobile = useMobile()

  if (!user) {
    router.push("/login")
    return null
  }

  const handleSaveChanges = async () => {
    try {
      // In a real implementation, you would collect all the form data here
      // and pass it to updateUser
      await updateUser({
        // Include all the form fields here
        name: user.name,
        // other fields...
      })
      setSuccessMessage("Profile updated successfully")
      setTimeout(() => setSuccessMessage(""), 3000)
      setIsEditing(false)
    } catch (err) {
      console.error("Error updating profile:", err)
    }
  }

  const handlePictureClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      try {
        await uploadPicture(file)
        setSuccessMessage("Profile picture updated successfully")
        setTimeout(() => setSuccessMessage(""), 3000)
      } catch (err) {
        console.error("Error uploading picture:", err)
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
          <p className="text-muted-foreground">Manage your personal information and preferences</p>
        </div>
        {successMessage && (
          <Alert variant="default" className="bg-green-50 text-green-800 border-green-200 max-w-md">
            <AlertDescription>{successMessage}</AlertDescription>
          </Alert>
        )}
        <Button
          variant={isEditing ? "default" : "outline"}
          onClick={isEditing ? handleSaveChanges : () => setIsEditing(true)}
          className={isEditing ? "bg-green-600 hover:bg-green-700" : ""}
          disabled={loading}
        >
          {loading ? "Saving..." : isEditing ? "Save Changes" : "Edit Profile"}
        </Button>
      </div>

      <Tabs defaultValue="basic" className="w-full">
        <TabsList className={cn("grid w-full", isMobile ? "grid-cols-2 overflow-x-auto" : "grid-cols-4")}>
          <TabsTrigger value="basic">Basic Information</TabsTrigger>
          <TabsTrigger value="medical">Medical Information</TabsTrigger>
          <TabsTrigger value="connectivity">Connectivity</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Your basic personal details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex flex-col items-center space-y-2">
                  <div className="relative h-32 w-32">
                    {user.profilePicture ? (
                      <Image
                        src={user.profilePicture || "/placeholder.svg?height=200&width=200"}
                        alt={user.name}
                        fill
                        className="rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-32 w-32 items-center justify-center rounded-full bg-green-100 text-green-600">
                        <span className="text-4xl font-bold">{user.name.charAt(0)}</span>
                      </div>
                    )}
                    {isEditing && (
                      <Button
                        size="sm"
                        className="absolute bottom-0 right-0 bg-green-600 hover:bg-green-700 h-8 w-8 rounded-full p-0"
                        onClick={handlePictureClick}
                      >
                        <span className="sr-only">Change picture</span>
                        <Camera className="h-4 w-4" />
                      </Button>
                    )}
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                  </div>
                </div>

                <div className="flex-1 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      {isEditing ? (
                        <Input id="name" defaultValue={user.name} />
                      ) : (
                        <p className="text-sm font-medium">{user.name}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      {isEditing ? (
                        <Input id="email" defaultValue={user.email} disabled />
                      ) : (
                        <p className="text-sm font-medium">{user.email}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dob">Date of Birth</Label>
                      {isEditing ? (
                        <Input id="dob" type="date" defaultValue={user.dateOfBirth} />
                      ) : (
                        <p className="text-sm font-medium">
                          {user.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString() : "Not provided"}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gender">Gender</Label>
                      {isEditing ? (
                        <Select defaultValue={user.gender}>
                          <SelectTrigger id="gender">
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Male">Male</SelectItem>
                            <SelectItem value="Female">Female</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                            <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className="text-sm font-medium">{user.gender || "Not provided"}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bloodGroup">Blood Group</Label>
                      {isEditing ? (
                        <Select defaultValue={user.bloodGroup}>
                          <SelectTrigger id="bloodGroup">
                            <SelectValue placeholder="Select blood group" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="A+">A+</SelectItem>
                            <SelectItem value="A-">A-</SelectItem>
                            <SelectItem value="B+">B+</SelectItem>
                            <SelectItem value="B-">B-</SelectItem>
                            <SelectItem value="AB+">AB+</SelectItem>
                            <SelectItem value="AB-">AB-</SelectItem>
                            <SelectItem value="O+">O+</SelectItem>
                            <SelectItem value="O-">O-</SelectItem>
                            <SelectItem value="Unknown">Unknown</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className="text-sm font-medium">{user.bloodGroup || "Not provided"}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      {isEditing ? (
                        <Input id="phone" defaultValue={user.phone} />
                      ) : (
                        <p className="text-sm font-medium">{user.phone || "Not provided"}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    {isEditing ? (
                      <Textarea id="address" defaultValue={user.address} />
                    ) : (
                      <p className="text-sm font-medium">{user.address || "Not provided"}</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="medical" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Allergies & Conditions</CardTitle>
              <CardDescription>Your medical allergies and chronic conditions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Allergies</Label>
                {isEditing ? (
                  <Textarea
                    placeholder="List your allergies, separated by commas"
                    defaultValue={user.allergies?.join(", ")}
                  />
                ) : (
                  <div className="rounded-md border p-4">
                    {user.allergies && user.allergies.length > 0 ? (
                      <ul className="list-disc pl-5 space-y-1">
                        {user.allergies.map((allergy, index) => (
                          <li key={index} className="text-sm">
                            {allergy}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground">No allergies recorded</p>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Chronic Conditions</Label>
                {isEditing ? (
                  <Textarea
                    placeholder="List your chronic conditions, separated by commas"
                    defaultValue={user.chronicConditions?.join(", ")}
                  />
                ) : (
                  <div className="rounded-md border p-4">
                    {user.chronicConditions && user.chronicConditions.length > 0 ? (
                      <ul className="list-disc pl-5 space-y-1">
                        {user.chronicConditions.map((condition, index) => (
                          <li key={index} className="text-sm">
                            {condition}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground">No chronic conditions recorded</p>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Medications & Medical History</CardTitle>
              <CardDescription>Your current medications and past medical procedures</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Current Medications</Label>
                {isEditing ? (
                  <Textarea
                    placeholder="List your current medications, separated by commas"
                    defaultValue={user.medications?.join(", ")}
                  />
                ) : (
                  <div className="rounded-md border p-4">
                    {user.medications && user.medications.length > 0 ? (
                      <ul className="list-disc pl-5 space-y-1">
                        {user.medications.map((medication, index) => (
                          <li key={index} className="text-sm">
                            {medication}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground">No medications recorded</p>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Past Surgeries & Treatments</Label>
                {isEditing ? (
                  <Textarea
                    placeholder="List your past surgeries and treatments, separated by commas"
                    defaultValue={user.pastSurgeries?.join(", ")}
                  />
                ) : (
                  <div className="rounded-md border p-4">
                    {user.pastSurgeries && user.pastSurgeries.length > 0 ? (
                      <ul className="list-disc pl-5 space-y-1">
                        {user.pastSurgeries.map((surgery, index) => (
                          <li key={index} className="text-sm">
                            {surgery}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground">No past surgeries recorded</p>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Family Medical History</Label>
                {isEditing ? (
                  <Textarea
                    placeholder="List your family medical history, separated by commas"
                    defaultValue={user.familyHistory?.join(", ")}
                  />
                ) : (
                  <div className="rounded-md border p-4">
                    {user.familyHistory && user.familyHistory.length > 0 ? (
                      <ul className="list-disc pl-5 space-y-1">
                        {user.familyHistory.map((history, index) => (
                          <li key={index} className="text-sm">
                            {history}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground">No family medical history recorded</p>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="connectivity" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Emergency Contacts</CardTitle>
              <CardDescription>People to contact in case of emergency</CardDescription>
            </CardHeader>
            <CardContent>
              {user.emergencyContacts && user.emergencyContacts.length > 0 ? (
                <div className="space-y-4">
                  {user.emergencyContacts.map((contact, index) => (
                    <div
                      key={contact.id}
                      className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                    >
                      <div>
                        <p className="font-medium">{contact.name}</p>
                        <p className="text-sm text-muted-foreground">{contact.relationship}</p>
                        <p className="text-sm">{contact.phone}</p>
                      </div>
                      {isEditing && (
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground">No emergency contacts added</p>
              )}

              {isEditing && (
                <Button className="mt-4 w-full bg-green-600 hover:bg-green-700">Add Emergency Contact</Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Preferred Doctors</CardTitle>
              <CardDescription>Your preferred healthcare providers</CardDescription>
            </CardHeader>
            <CardContent>
              {user.preferredDoctors && user.preferredDoctors.length > 0 ? (
                <div className="space-y-4">
                  {user.preferredDoctors.map((doctor) => (
                    <div
                      key={doctor.id}
                      className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                    >
                      <div>
                        <p className="font-medium">{doctor.name}</p>
                        <p className="text-sm text-muted-foreground">{doctor.specialty}</p>
                        <p className="text-sm">{doctor.contact}</p>
                      </div>
                      {isEditing && (
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground">No preferred doctors added</p>
              )}

              {isEditing && (
                <Button className="mt-4 w-full bg-green-600 hover:bg-green-700">Add Preferred Doctor</Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Manage how you receive notifications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="appointments">Appointment Reminders</Label>
                    <p className="text-sm text-muted-foreground">Receive reminders about upcoming appointments</p>
                  </div>
                  <Switch
                    id="appointments"
                    disabled={!isEditing}
                    defaultChecked={user.notificationPreferences?.appointments}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="medications">Medication Reminders</Label>
                    <p className="text-sm text-muted-foreground">Receive reminders to take your medications</p>
                  </div>
                  <Switch
                    id="medications"
                    disabled={!isEditing}
                    defaultChecked={user.notificationPreferences?.medications}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="labResults">Lab Results</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications when new lab results are available
                    </p>
                  </div>
                  <Switch
                    id="labResults"
                    disabled={!isEditing}
                    defaultChecked={user.notificationPreferences?.labResults}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="newsletters">Health Newsletters</Label>
                    <p className="text-sm text-muted-foreground">Receive health tips and newsletters</p>
                  </div>
                  <Switch
                    id="newsletters"
                    disabled={!isEditing}
                    defaultChecked={user.notificationPreferences?.newsletters}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Privacy Settings</CardTitle>
              <CardDescription>Manage how your information is shared</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="shareRecords">Share Medical Records with Doctors</Label>
                    <p className="text-sm text-muted-foreground">Allow your doctors to access your medical records</p>
                  </div>
                  <Switch
                    id="shareRecords"
                    disabled={!isEditing}
                    defaultChecked={user.privacySettings?.shareRecordsWithDoctors}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="researchUse">Allow Research Use</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow your anonymized data to be used for medical research
                    </p>
                  </div>
                  <Switch
                    id="researchUse"
                    disabled={!isEditing}
                    defaultChecked={user.privacySettings?.allowResearchUse}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="showProfile">Show Profile to Others</Label>
                    <p className="text-sm text-muted-foreground">Allow other patients to see your profile</p>
                  </div>
                  <Switch
                    id="showProfile"
                    disabled={!isEditing}
                    defaultChecked={user.privacySettings?.showProfileToOthers}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Account Security</CardTitle>
              <CardDescription>Manage your account security settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline" className="w-full">
                Change Password
              </Button>
              <Button variant="outline" className="w-full">
                Enable Two-Factor Authentication
              </Button>
              <Button variant="destructive" className="w-full">
                Delete Account
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}


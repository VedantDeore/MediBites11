"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  User,
  Mail,
  Phone,
  Award,
  MapPin,
  DollarSign,
  Languages,
  Save,
  Edit,
  Upload,
  Loader2,
  Plus,
  X,
  FileText,
  Stethoscope,
} from "lucide-react"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useDoctorAuth } from "@/lib/doctor-auth-context"
import {
  WorkingHoursEditor,
  defaultWorkingHours,
  parseWorkingHours,
  type WorkingHoursData,
} from "@/components/working-hours-editor"

export default function DoctorProfilePage() {
  const router = useRouter()
  const { doctor, loading, updateProfile, uploadPicture } = useDoctorAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // New state for input fields
  const [newLanguage, setNewLanguage] = useState("")
  const [newQualification, setNewQualification] = useState("")
  const [newService, setNewService] = useState("")

  // Form state - expanded with more fields
  const [formData, setFormData] = useState({
    name: "",
    specialty: "",
    phone: "",
    experience: "",
    bio: "",
    clinicName: "",
    clinicAddress: "",
    workingHours: defaultWorkingHours as WorkingHoursData,
    qualifications: [] as string[],
    languages: [] as string[],
    services: [] as string[],
    consultationFees: {
      inPerson: "",
      telemedicine: "",
    },
  })

  // Initialize form data when doctor data is loaded
  useState(() => {
    if (doctor) {
      setFormData({
        name: doctor.name || "",
        specialty: doctor.specialty || "",
        phone: doctor.phone || "",
        experience: doctor.experience || "",
        bio: doctor.bio || "",
        clinicName: doctor.clinicName || "",
        clinicAddress: doctor.clinicAddress || "",
        workingHours: doctor.workingHours ? parseWorkingHours(doctor.workingHours) : defaultWorkingHours,
        qualifications: doctor.qualifications || [],
        languages: doctor.languages || [],
        services: doctor.services || [],
        consultationFees: doctor.consultationFees || {
          inPerson: "",
          telemedicine: "",
        },
      })
    }
  })

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    )
  }

  if (!doctor) {
    router.push("/doctor/login")
    return null
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  // Handle consultation fees changes
  const handleFeesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      consultationFees: {
        ...formData.consultationFees,
        [name]: value,
      },
    })
  }

  // Add new language
  const handleAddLanguage = () => {
    if (newLanguage.trim() && !formData.languages.includes(newLanguage.trim())) {
      setFormData({
        ...formData,
        languages: [...formData.languages, newLanguage.trim()],
      })
      setNewLanguage("")
    }
  }

  // Remove language
  const handleRemoveLanguage = (language: string) => {
    setFormData({
      ...formData,
      languages: formData.languages.filter((l) => l !== language),
    })
  }

  // Add new qualification
  const handleAddQualification = () => {
    if (newQualification.trim() && !formData.qualifications.includes(newQualification.trim())) {
      setFormData({
        ...formData,
        qualifications: [...formData.qualifications, newQualification.trim()],
      })
      setNewQualification("")
    }
  }

  // Remove qualification
  const handleRemoveQualification = (qualification: string) => {
    setFormData({
      ...formData,
      qualifications: formData.qualifications.filter((q) => q !== qualification),
    })
  }

  // Add new service
  const handleAddService = () => {
    if (newService.trim() && !formData.services.includes(newService.trim())) {
      setFormData({
        ...formData,
        services: [...formData.services, newService.trim()],
      })
      setNewService("")
    }
  }

  // Remove service
  const handleRemoveService = (service: string) => {
    setFormData({
      ...formData,
      services: formData.services.filter((s) => s !== service),
    })
  }

  const handleEditClick = () => {
    setIsEditing(true)
    setFormData({
      name: doctor.name || "",
      specialty: doctor.specialty || "",
      phone: doctor.phone || "",
      experience: doctor.experience || "",
      bio: doctor.bio || "",
      clinicName: doctor.clinicName || "",
      clinicAddress: doctor.clinicAddress || "",
      workingHours: doctor.workingHours ? parseWorkingHours(doctor.workingHours) : defaultWorkingHours,
      qualifications: doctor.qualifications || [],
      languages: doctor.languages || [],
      services: doctor.services || [],
      consultationFees: doctor.consultationFees || {
        inPerson: "",
        telemedicine: "",
      },
    })
  }

  const handleSaveClick = async () => {
    setIsSaving(true)
    setError(null)
    setSuccess(null)

    try {
      await updateProfile({
        name: formData.name,
        specialty: formData.specialty,
        phone: formData.phone,
        experience: formData.experience,
        bio: formData.bio,
        clinicName: formData.clinicName,
        clinicAddress: formData.clinicAddress,
        workingHours: formData.workingHours,
        qualifications: formData.qualifications,
        languages: formData.languages,
        services: formData.services,
        consultationFees: formData.consultationFees,
      })
      setSuccess("Profile updated successfully")
      setIsEditing(false)
    } catch (err) {
      setError("Failed to update profile. Please try again.")
      console.error("Error updating profile:", err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancelClick = () => {
    setIsEditing(false)
    setError(null)
    setSuccess(null)
  }

  const handleProfilePictureClick = () => {
    fileInputRef.current?.click()
  }

  const handleProfilePictureChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setIsSaving(true)
      setError(null)

      try {
        await uploadPicture(file)
        setSuccess("Profile picture updated successfully")
      } catch (err) {
        setError("Failed to update profile picture. Please try again.")
        console.error("Error uploading profile picture:", err)
      } finally {
        setIsSaving(false)
      }
    }
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Doctor Profile</h2>
          <p className="text-muted-foreground">Manage your personal and professional information</p>
        </div>
        {!isEditing && (
          <Button onClick={handleEditClick} className="w-full sm:w-auto">
            <Edit className="mr-2 h-4 w-4" />
            Edit Profile
          </Button>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-green-50 border-green-200">
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile Overview Card */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Overview</CardTitle>
            <CardDescription>Your personal and contact information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={doctor.profilePicture} alt={doctor.name} />
                  <AvatarFallback className="bg-purple-100 text-purple-600 text-xl">
                    {doctor.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                {isEditing && (
                  <Button
                    size="sm"
                    className="absolute bottom-0 right-0 h-8 w-8 rounded-full p-0"
                    onClick={handleProfilePictureClick}
                    disabled={isSaving}
                  >
                    <Upload className="h-4 w-4" />
                    <span className="sr-only">Upload picture</span>
                  </Button>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleProfilePictureChange}
                />
              </div>
              {isEditing ? (
                <div className="w-full space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" name="name" value={formData.name} onChange={handleInputChange} />
                </div>
              ) : (
                <div className="text-center">
                  <h3 className="text-xl font-bold">{doctor.name}</h3>
                  <p className="text-muted-foreground">{doctor.specialty}</p>
                </div>
              )}
            </div>

            <Separator />

            <div className="space-y-4">
              {isEditing ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="specialty">Specialization</Label>
                    <Input id="specialty" name="specialty" value={formData.specialty} onChange={handleInputChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" name="phone" value={formData.phone} onChange={handleInputChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="experience">Years of Experience</Label>
                    <Input id="experience" name="experience" value={formData.experience} onChange={handleInputChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bio">About Me / Bio</Label>
                    <Textarea
                      id="bio"
                      name="bio"
                      value={formData.bio}
                      onChange={handleInputChange}
                      placeholder="Tell patients about yourself, your background, and your approach to healthcare"
                      rows={4}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <span>{doctor.email}</span>
                  </div>
                  {doctor.phone && (
                    <div className="flex items-center space-x-3">
                      <Phone className="h-5 w-5 text-muted-foreground" />
                      <span>{doctor.phone}</span>
                    </div>
                  )}
                  {doctor.experience && (
                    <div className="flex items-center space-x-3">
                      <Award className="h-5 w-5 text-muted-foreground" />
                      <span>{doctor.experience} years of experience</span>
                    </div>
                  )}
                  {doctor.bio && (
                    <div className="mt-4">
                      <h4 className="mb-2 font-medium flex items-center">
                        <FileText className="mr-2 h-5 w-5 text-muted-foreground" />
                        About Me
                      </h4>
                      <p className="text-sm text-muted-foreground">{doctor.bio}</p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Languages Section */}
            <Separator />
            <div>
              <h4 className="mb-2 font-medium flex items-center">
                <Languages className="mr-2 h-5 w-5 text-muted-foreground" />
                Languages
              </h4>

              {isEditing ? (
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Input
                      value={newLanguage}
                      onChange={(e) => setNewLanguage(e.target.value)}
                      placeholder="Add a language"
                      className="flex-1"
                    />
                    <Button type="button" size="sm" onClick={handleAddLanguage} disabled={!newLanguage.trim()}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {formData.languages.map((language) => (
                      <Badge key={language} variant="secondary" className="flex items-center gap-1 capitalize">
                        {language}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4 p-0 hover:bg-transparent"
                          onClick={() => handleRemoveLanguage(language)}
                        >
                          <X className="h-3 w-3" />
                          <span className="sr-only">Remove {language}</span>
                        </Button>
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {doctor.languages && doctor.languages.length > 0 ? (
                    doctor.languages.map((language) => (
                      <Badge key={language} variant="outline" className="capitalize">
                        {language}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No languages specified</p>
                  )}
                </div>
              )}
            </div>

            {/* Qualifications Section */}
            <Separator />
            <div>
              <h4 className="mb-2 font-medium flex items-center">
                <Award className="mr-2 h-5 w-5 text-muted-foreground" />
                Qualifications
              </h4>

              {isEditing ? (
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Input
                      value={newQualification}
                      onChange={(e) => setNewQualification(e.target.value)}
                      placeholder="Add a qualification"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAddQualification}
                      disabled={!newQualification.trim()}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  <ul className="space-y-2">
                    {formData.qualifications.map((qualification, index) => (
                      <li key={index} className="flex items-center justify-between">
                        <span>{qualification}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleRemoveQualification(qualification)}
                        >
                          <X className="h-4 w-4" />
                          <span className="sr-only">Remove {qualification}</span>
                        </Button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div>
                  {doctor.qualifications && doctor.qualifications.length > 0 ? (
                    <ul className="list-disc pl-5 space-y-1">
                      {doctor.qualifications.map((qualification, index) => (
                        <li key={index}>{qualification}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">No qualifications specified</p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Practice Information Card */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Practice Information</CardTitle>
              <CardDescription>Details about your medical practice</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {isEditing ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="clinicName">Clinic/Hospital Name</Label>
                    <Input id="clinicName" name="clinicName" value={formData.clinicName} onChange={handleInputChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="clinicAddress">Clinic/Hospital Address</Label>
                    <Textarea
                      id="clinicAddress"
                      name="clinicAddress"
                      value={formData.clinicAddress}
                      onChange={handleInputChange}
                      rows={3}
                    />
                  </div>
                </>
              ) : (
                <>
                  {doctor.clinicName && (
                    <div className="space-y-1">
                      <h4 className="font-medium flex items-center">
                        <User className="mr-2 h-5 w-5 text-muted-foreground" />
                        Clinic/Hospital
                      </h4>
                      <p>{doctor.clinicName}</p>
                    </div>
                  )}

                  {doctor.clinicAddress && (
                    <div className="space-y-1">
                      <h4 className="font-medium flex items-center">
                        <MapPin className="mr-2 h-5 w-5 text-muted-foreground" />
                        Address
                      </h4>
                      <p className="whitespace-pre-line">{doctor.clinicAddress}</p>
                    </div>
                  )}
                </>
              )}

              {/* Services Section */}
              <Separator />
              <div>
                <h4 className="mb-2 font-medium flex items-center">
                  <Stethoscope className="mr-2 h-5 w-5 text-muted-foreground" />
                  Services Offered
                </h4>

                {isEditing ? (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Input
                        value={newService}
                        onChange={(e) => setNewService(e.target.value)}
                        placeholder="Add a service"
                        className="flex-1"
                      />
                      <Button type="button" size="sm" onClick={handleAddService} disabled={!newService.trim()}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    <ul className="space-y-2">
                      {formData.services.map((service, index) => (
                        <li key={index} className="flex items-center justify-between">
                          <span>{service}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleRemoveService(service)}
                          >
                            <X className="h-4 w-4" />
                            <span className="sr-only">Remove {service}</span>
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div>
                    {doctor.services && doctor.services.length > 0 ? (
                      <ul className="list-disc pl-5 space-y-1">
                        {doctor.services.map((service, index) => (
                          <li key={index}>{service}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground">No services specified</p>
                    )}
                  </div>
                )}
              </div>

              {/* Consultation Fees Section */}
              <Separator />
              <div className="space-y-4">
                <h4 className="font-medium flex items-center">
                  <DollarSign className="mr-2 h-5 w-5 text-muted-foreground" />
                  Consultation Fees
                </h4>

                {isEditing ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="inPerson">In-Person</Label>
                      <Input
                        id="inPerson"
                        name="inPerson"
                        value={formData.consultationFees.inPerson}
                        onChange={handleFeesChange}
                        placeholder="e.g. $100"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="telemedicine">Telemedicine</Label>
                      <Input
                        id="telemedicine"
                        name="telemedicine"
                        value={formData.consultationFees.telemedicine}
                        onChange={handleFeesChange}
                        placeholder="e.g. $80"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-lg border p-3">
                      <p className="text-sm font-medium">In-Person</p>
                      <p className="text-lg font-bold">{doctor.consultationFees?.inPerson || "Not specified"}</p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-sm font-medium">Telemedicine</p>
                      <p className="text-lg font-bold">{doctor.consultationFees?.telemedicine || "Not specified"}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Working Hours Section */}
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="workingHours">Working Hours</Label>
                {isEditing ? (
                  <WorkingHoursEditor
                    value={formData.workingHours}
                    onChange={(newWorkingHours) =>
                      setFormData({
                        ...formData,
                        workingHours: newWorkingHours,
                      })
                    }
                  />
                ) : (
                  <div className="space-y-2">
                    {typeof doctor.workingHours === "string" ? (
                      <p>{doctor.workingHours}</p>
                    ) : doctor.workingHours ? (
                      Object.entries(doctor.workingHours).map(([day, schedule]) => {
                        if (!schedule || typeof schedule !== "object") return null

                        return schedule.enabled &&
                          schedule.timeSlots &&
                          Array.isArray(schedule.timeSlots) &&
                          schedule.timeSlots.length > 0 ? (
                          <div key={day} className="flex">
                            <span className="font-medium capitalize w-24">{day}:</span>
                            <span>
                              {schedule.timeSlots.map((slot, i) => (
                                <span key={i} className="mr-2">
                                  {slot.start} {slot.startPeriod} - {slot.end} {slot.endPeriod}
                                  {i < schedule.timeSlots.length - 1 ? ", " : ""}
                                </span>
                              ))}
                            </span>
                          </div>
                        ) : null
                      })
                    ) : (
                      <p className="text-sm text-muted-foreground">No working hours specified</p>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
            {isEditing && (
              <CardFooter className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 space-x-0 sm:space-x-2">
                <Button variant="outline" onClick={handleCancelClick} disabled={isSaving} className="w-full sm:w-auto">
                  Cancel
                </Button>
                <Button onClick={handleSaveClick} disabled={isSaving} className="w-full sm:w-auto">
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </CardFooter>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}


"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { WorkingHoursEditor, defaultWorkingHours, type WorkingHoursData } from "@/components/working-hours-editor"
import { useDoctorAuth } from "@/lib/doctor-auth-context"

export default function DoctorRegisterPage() {
  const router = useRouter()
  const { register, loading } = useDoctorAuth()
  const [currentStep, setCurrentStep] = useState(1)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    // Step 1: Basic Information
    name: "",
    email: "",
    password: "",
    confirmPassword: "",

    // Step 2: Professional Information
    specialty: "",
    experience: "",
    qualifications: [] as string[],
    languages: [] as string[],
    bio: "",

    // Step 3: Practice Information
    phone: "",
    clinicName: "",
    clinicAddress: "",
    workingHours: defaultWorkingHours as WorkingHoursData,
    services: [] as string[],
    consultationFees: {
      inPerson: "",
      telemedicine: "",
    },
  })

  // New state for input fields
  const [newLanguage, setNewLanguage] = useState("")
  const [newQualification, setNewQualification] = useState("")
  const [newService, setNewService] = useState("")

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

  const validateStep = () => {
    setError(null)

    if (currentStep === 1) {
      if (!formData.name.trim()) {
        setError("Name is required")
        return false
      }
      if (!formData.email.trim()) {
        setError("Email is required")
        return false
      }
      if (!formData.password.trim()) {
        setError("Password is required")
        return false
      }
      if (formData.password !== formData.confirmPassword) {
        setError("Passwords do not match")
        return false
      }
    } else if (currentStep === 2) {
      if (!formData.specialty.trim()) {
        setError("Specialty is required")
        return false
      }
    }

    return true
  }

  const handleNextStep = () => {
    if (validateStep()) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevStep = () => {
    setCurrentStep(currentStep - 1)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!validateStep()) {
      return
    }

    try {
      await register(formData.email, formData.password, {
        name: formData.name,
        specialty: formData.specialty,
        experience: formData.experience,
        qualifications: formData.qualifications,
        languages: formData.languages,
        bio: formData.bio,
        phone: formData.phone,
        clinicName: formData.clinicName,
        clinicAddress: formData.clinicAddress,
        workingHours: formData.workingHours,
        services: formData.services,
        consultationFees: formData.consultationFees,
      })

      router.push("/doctor/dashboard")
    } catch (err: any) {
      setError(err.message || "Failed to register. Please try again.")
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-4xl">
        <CardHeader>
          <CardTitle>Doctor Registration</CardTitle>
          <CardDescription>Create your doctor account to manage appointments and patient records</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full ${
                    currentStep >= 1 ? "bg-purple-600 text-white" : "bg-gray-200"
                  }`}
                >
                  1
                </div>
                <span className={currentStep >= 1 ? "font-medium" : "text-muted-foreground"}>Basic Information</span>
              </div>
              <Separator className="w-12" />
              <div className="flex items-center space-x-2">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full ${
                    currentStep >= 2 ? "bg-purple-600 text-white" : "bg-gray-200"
                  }`}
                >
                  2
                </div>
                <span className={currentStep >= 2 ? "font-medium" : "text-muted-foreground"}>Professional Details</span>
              </div>
              <Separator className="w-12" />
              <div className="flex items-center space-x-2">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full ${
                    currentStep >= 3 ? "bg-purple-600 text-white" : "bg-gray-200"
                  }`}
                >
                  3
                </div>
                <span className={currentStep >= 3 ? "font-medium" : "text-muted-foreground"}>Practice Information</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Dr. John Doe"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="doctor@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Professional Information */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="specialty">Specialty</Label>
                    <Input
                      id="specialty"
                      name="specialty"
                      value={formData.specialty}
                      onChange={handleInputChange}
                      placeholder="e.g. Cardiology, Pediatrics"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="experience">Years of Experience</Label>
                    <Input
                      id="experience"
                      name="experience"
                      value={formData.experience}
                      onChange={handleInputChange}
                      placeholder="e.g. 10"
                    />
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

                  {/* Qualifications */}
                  <div className="space-y-2">
                    <Label>Qualifications</Label>
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
                        Add
                      </Button>
                    </div>
                    <ul className="mt-2 space-y-1">
                      {formData.qualifications.map((qualification, index) => (
                        <li key={index} className="flex items-center justify-between rounded bg-gray-50 px-3 py-2">
                          <span>{qualification}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveQualification(qualification)}
                          >
                            Remove
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Languages */}
                  <div className="space-y-2">
                    <Label>Languages</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        value={newLanguage}
                        onChange={(e) => setNewLanguage(e.target.value)}
                        placeholder="Add a language"
                        className="flex-1"
                      />
                      <Button type="button" size="sm" onClick={handleAddLanguage} disabled={!newLanguage.trim()}>
                        Add
                      </Button>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {formData.languages.map((language) => (
                        <div key={language} className="flex items-center rounded bg-gray-50 px-3 py-1">
                          <span>{language}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2"
                            onClick={() => handleRemoveLanguage(language)}
                          >
                            ×
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Practice Information */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="e.g. +1 (555) 123-4567"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="clinicName">Clinic/Hospital Name</Label>
                    <Input
                      id="clinicName"
                      name="clinicName"
                      value={formData.clinicName}
                      onChange={handleInputChange}
                      placeholder="e.g. City Medical Center"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="clinicAddress">Clinic/Hospital Address</Label>
                    <Textarea
                      id="clinicAddress"
                      name="clinicAddress"
                      value={formData.clinicAddress}
                      onChange={handleInputChange}
                      placeholder="Full address of your practice"
                      rows={3}
                    />
                  </div>

                  {/* Services */}
                  <div className="space-y-2">
                    <Label>Services Offered</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        value={newService}
                        onChange={(e) => setNewService(e.target.value)}
                        placeholder="Add a service"
                        className="flex-1"
                      />
                      <Button type="button" size="sm" onClick={handleAddService} disabled={!newService.trim()}>
                        Add
                      </Button>
                    </div>
                    <ul className="mt-2 space-y-1">
                      {formData.services.map((service, index) => (
                        <li key={index} className="flex items-center justify-between rounded bg-gray-50 px-3 py-2">
                          <span>{service}</span>
                          <Button type="button" variant="ghost" size="sm" onClick={() => handleRemoveService(service)}>
                            Remove
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Consultation Fees */}
                  <div className="space-y-2">
                    <Label>Consultation Fees</Label>
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
                  </div>

                  {/* Working Hours */}
                  <div className="space-y-2">
                    <Label>Working Hours</Label>
                    <WorkingHoursEditor
                      value={formData.workingHours}
                      onChange={(newWorkingHours) =>
                        setFormData({
                          ...formData,
                          workingHours: newWorkingHours,
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            )}
          </form>
        </CardContent>
        <CardFooter className="flex justify-between">
          <div>
            {currentStep > 1 && (
              <Button variant="outline" onClick={handlePrevStep}>
                Previous
              </Button>
            )}
          </div>
          <div className="flex space-x-2">
            {currentStep < 3 ? (
              <Button onClick={handleNextStep}>Next</Button>
            ) : (
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Registering...
                  </>
                ) : (
                  "Complete Registration"
                )}
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}


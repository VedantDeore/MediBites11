"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useDoctorAuth } from "@/lib/doctor-auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { v4 as uuidv4 } from "uuid"
import {
  Calendar,
  Download,
  FileText,
  MoreHorizontal,
  Phone,
  Plus,
  Search,
  Stethoscope,
  User,
  UserPlus,
  Upload,
  Trash,
  AlertCircle,
  Loader2,
} from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  getPatientsByDoctor,
  getPatientDetails,
  updatePatientMedicalInfo,
  addPatientNote,
  uploadPatientDocument,
  type PatientData,
  type PatientMedicalInfo,
  type PatientNote,
  type PatientDocument,
  type Appointment,
} from "@/lib/patient-service"

export default function PatientsPage() {
  const router = useRouter();
  const { doctor } = useDoctorAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive" | "new">("all");
  const [selectedPatient, setSelectedPatient] = useState<PatientData | null>(null);
  const [isPatientDetailsOpen, setIsPatientDetailsOpen] = useState(false);
  const [isAddPatientOpen, setIsAddPatientOpen] = useState(false);
  const [isAddNoteOpen, setIsAddNoteOpen] = useState(false);
  const [isUploadDocumentOpen, setIsUploadDocumentOpen] = useState(false);
  const [patients, setPatients] = useState<PatientData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Form states
  const [newNote, setNewNote] = useState("");
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [documentName, setDocumentName] = useState("");
  const [documentType, setDocumentType] = useState("medical-record");
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [savingNote, setSavingNote] = useState(false);
  const [editingMedicalInfo, setEditingMedicalInfo] = useState(false);
  const [medicalInfoForm, setMedicalInfoForm] = useState<PatientMedicalInfo>({
    bloodGroup: "",
    allergies: [],
    chronicConditions: [],
    medications: [],
  });
  const [savingMedicalInfo, setSavingMedicalInfo] = useState(false);
  const [newAllergy, setNewAllergy] = useState("");
  const [newCondition, setNewCondition] = useState("");
  const [newMedication, setNewMedication] = useState("");
  
  // Fake Patient Data Generator
  const generateRandomPatient = (): PatientData => {
    const names = ["Aryan Sharma", "Sanya Kapoor", "Rohan Mehta", "Priya Verma", "Kabir Singh", "Aditi Nair"];
    const genders = ["male", "female", "other"];
    const statuses = ["active", "inactive", "new"];
    const conditions = ["Diabetes", "Hypertension", "Asthma", "Heart Disease"];
    const allergies = ["Pollen", "Dust", "Peanuts", "Shellfish"];
    const medications = ["Metformin", "Ibuprofen", "Paracetamol"];
    const bloodGroups = ["A+", "B+", "O+", "AB+", "A-", "B-", "O-", "AB-"];
  
    const randomItem = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)];
  
    return {
      id: uuidv4(),
      name: randomItem(names),
      email: `${Math.random().toString(36).substring(7)}@gmail.com`,
      phone: `+91 ${Math.floor(6000000000 + Math.random() * 4000000000)}`,
      age: Math.floor(Math.random() * 50) + 18, // Between 18-68
      gender: randomItem(genders),
      address: `Flat No. ${Math.floor(Math.random() * 500)}, Street ${Math.floor(Math.random() * 100)}, City XYZ`,
      profilePicture: `https://randomuser.me/api/portraits/${randomItem(["men", "women"])}/${Math.floor(Math.random() * 100)}.jpg`,
      registrationDate: new Date(Date.now() - Math.random() * 10000000000).toISOString().split("T")[0],
      lastVisit: new Date(Date.now() - Math.random() * 5000000000).toISOString().split("T")[0],
      medicalInfo: {
        bloodGroup: randomItem(bloodGroups),
        allergies: [randomItem(allergies)],
        chronicConditions: [randomItem(conditions)],
        medications: [randomItem(medications)],
      },
      appointments: Array.from({ length: Math.floor(Math.random() * 5) }, () => ({
        id: uuidv4(),
        date: new Date(Date.now() - Math.random() * 1000000000).toISOString().split("T")[0],
        time: `${Math.floor(Math.random() * 12) + 1}:${Math.random() > 0.5 ? "30" : "00"} ${Math.random() > 0.5 ? "AM" : "PM"}`,
        type: randomItem(["General Checkup", "Dental", "Cardiology"]),
        status: randomItem(["completed", "pending", "cancelled"]),
      })),
      status: randomItem(statuses),
      nextAppointment: Math.random() > 0.5
        ? {
            date: new Date(Date.now() + Math.random() * 1000000000).toISOString().split("T")[0],
            time: `${Math.floor(Math.random() * 12) + 1}:${Math.random() > 0.5 ? "30" : "00"} ${Math.random() > 0.5 ? "AM" : "PM"}`,
          }
        : undefined,
      treatmentPlan: Math.random() > 0.3 ? "Follow-up in 3 months with dietary changes." : "",
    };
  };
  
  // Simulated Fetch Patients Function
  useEffect(() => {
    async function fetchPatients() {
      if (!doctor?.id) return;
  
      try {
        setLoading(true);
        setError(null);
  
        // Simulate fetching by generating fake patients
        const fakePatients = Array.from({ length: 10 }, generateRandomPatient);
        setPatients(fakePatients);
      } catch (err) {
        console.error("Error fetching patients:", err);
        setError("Failed to load patients. Please try again.");
      } finally {
        setLoading(false);
      }
    }
  
    fetchPatients();
  }, [doctor]);
  

  // Handle patient click - fetch detailed patient info
  const handlePatientClick = async (patient: PatientData) => {
    try {
      console.log("Fetching details for patient:", patient.id)
      setError(null) // Clear any previous errors

      // If we already have appointments from the patient list, use them temporarily
      if (patient.appointments && patient.appointments.length > 0) {
        setSelectedPatient({
          ...patient,
          // Initialize empty arrays for notes and documents to prevent undefined errors
          notes: [],
          documents: [],
        })
        setIsPatientDetailsOpen(true)
      }

      // Fetch detailed patient info
      const detailedPatient = await getPatientDetails(patient.id)

      // Ensure we have the appointments array
      if (!detailedPatient.appointments && patient.appointments) {
        detailedPatient.appointments = patient.appointments
      }

      console.log("Patient details loaded:", detailedPatient)
      setSelectedPatient(detailedPatient)

      // Initialize medical info form with patient data
      if (detailedPatient.medicalInfo) {
        setMedicalInfoForm(detailedPatient.medicalInfo)
      } else {
        setMedicalInfoForm({
          bloodGroup: "",
          allergies: [],
          chronicConditions: [],
          medications: [],
        })
      }

      setIsPatientDetailsOpen(true)
    } catch (err) {
      console.error("Error fetching patient details:", err)
      setError("Failed to load patient details. Please try again.")
      // Close the dialog if it was opened with temporary data
      setIsPatientDetailsOpen(false)
    }
  }

  // Handle viewing detailed patient analysis
  const handleViewPatientAnalysis = (patientId: string) => {
    router.push(`/doctor/dashboard/patients/${patientId}`)
  }

  // Handle saving medical info
  const handleSaveMedicalInfo = async () => {
    if (!selectedPatient) return

    try {
      setSavingMedicalInfo(true)
      await updatePatientMedicalInfo(selectedPatient.id, medicalInfoForm)

      // Update the selected patient with new medical info
      setSelectedPatient({
        ...selectedPatient,
        medicalInfo: medicalInfoForm,
      })

      setEditingMedicalInfo(false)
    } catch (err) {
      console.error("Error updating medical info:", err)
      setError("Failed to update medical information. Please try again.")
    } finally {
      setSavingMedicalInfo(false)
    }
  }

  // Handle adding a note
  const handleAddNote = async () => {
    if (!selectedPatient || !newNote.trim()) return

    try {
      setSavingNote(true)
      const note: PatientNote = {
        content: newNote,
        createdAt: new Date().toISOString(),
        createdBy: doctor?.name || "Doctor",
        doctorId: doctor?.id || "",
      }

      await addPatientNote(selectedPatient.id, note)

      // Update the selected patient with the new note
      const updatedNotes = [...(selectedPatient.notes || []), note]
      setSelectedPatient({
        ...selectedPatient,
        notes: updatedNotes,
      })

      setNewNote("")
      setIsAddNoteOpen(false)
    } catch (err) {
      console.error("Error adding note:", err)
      setError("Failed to add note. Please try again.")
    } finally {
      setSavingNote(false)
    }
  }

  // Handle document upload
  const handleUploadDocument = async () => {
    if (!selectedPatient || !documentFile || !documentName.trim()) return

    try {
      setUploadingDocument(true)
      const document: PatientDocument = {
        name: documentName,
        type: documentType,
        uploadedAt: new Date().toISOString(),
        uploadedBy: doctor?.name || "Doctor",
        doctorId: doctor?.id || "",
      }

      const documentWithUrl = await uploadPatientDocument(selectedPatient.id, document, documentFile)

      // Update the selected patient with the new document
      const updatedDocuments = [...(selectedPatient.documents || []), documentWithUrl]
      setSelectedPatient({
        ...selectedPatient,
        documents: updatedDocuments,
      })

      setDocumentFile(null)
      setDocumentName("")
      setIsUploadDocumentOpen(false)
    } catch (err) {
      console.error("Error uploading document:", err)
      setError("Failed to upload document. Please try again.")
    } finally {
      setUploadingDocument(false)
    }
  }

  // Add item to array in medical info
  const addItemToMedicalInfo = (field: "allergies" | "chronicConditions" | "medications", value: string) => {
    if (!value.trim()) return

    setMedicalInfoForm({
      ...medicalInfoForm,
      [field]: [...medicalInfoForm[field], value],
    })

    // Reset the input field
    if (field === "allergies") setNewAllergy("")
    if (field === "chronicConditions") setNewCondition("")
    if (field === "medications") setNewMedication("")
  }

  // Remove item from array in medical info
  const removeItemFromMedicalInfo = (field: "allergies" | "chronicConditions" | "medications", index: number) => {
    const newArray = [...medicalInfoForm[field]]
    newArray.splice(index, 1)

    setMedicalInfoForm({
      ...medicalInfoForm,
      [field]: newArray,
    })
  }

  // Filter patients based on search query and status filter
  const filteredPatients = patients.filter((patient) => {
    const matchesSearch =
      patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (patient.phone && patient.phone.includes(searchQuery))

    const matchesStatus = statusFilter === "all" || patient.status === statusFilter

    return matchesSearch && matchesStatus
  })

  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "inactive":
        return "bg-gray-100 text-gray-800"
      case "new":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // Get appointment status color
  const getAppointmentStatusColor = (status: string) => {
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

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A"

    try {
      const date = new Date(dateString)
      return new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }).format(date)
    } catch (e) {
      return dateString
    }
  }

  // Helper functions to filter appointments
  const getUpcomingAppointments = (appointments: Appointment[] = []) => {
    const now = new Date()
    return appointments
      .filter((apt) => {
        const aptDate = new Date(`${apt.date}T${apt.startTime}`)
        return aptDate >= now || apt.status === "scheduled"
      })
      .sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.startTime}`)
        const dateB = new Date(`${b.date}T${b.startTime}`)
        return dateA.getTime() - dateB.getTime() // Ascending order (soonest first)
      })
  }

  const getPastAppointments = (appointments: Appointment[] = []) => {
    const now = new Date()
    return appointments
      .filter((apt) => {
        const aptDate = new Date(`${apt.date}T${apt.startTime}`)
        return aptDate < now && apt.status !== "scheduled"
      })
      .sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.startTime}`)
        const dateB = new Date(`${b.date}T${b.startTime}`)
        return dateB.getTime() - dateA.getTime() // Descending order (most recent first)
      })
  }

  if (!doctor) {
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Patients</h1>
          <p className="text-muted-foreground">Manage your patient records and information</p>
        </div>
        <Button
          className="bg-purple-600 hover:bg-purple-700 w-full sm:w-auto"
          onClick={() => setIsAddPatientOpen(true)}
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Add New Patient
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex-1 w-full">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search patients by name, email, or phone..."
                  className="w-full pl-8 bg-white"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as any)}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Patients</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon">
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Age/Gender</TableHead>
                  <TableHead>Last Visit</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Next Appointment</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10">
                      <div className="flex flex-col items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-purple-600 mb-2" />
                        <p className="text-muted-foreground">Loading patients...</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredPatients.length > 0 ? (
                  filteredPatients.map((patient) => (
                    <TableRow
                      key={patient.id}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handlePatientClick(patient)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            {patient.profilePicture ? (
                              <AvatarImage src={patient.profilePicture} alt={patient.name} />
                            ) : (
                              <AvatarFallback className="bg-purple-100 text-purple-600">
                                {patient.name.charAt(0)}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <div>
                            <p className="font-medium">{patient.name}</p>
                            <p className="text-xs text-muted-foreground">ID: {patient.id}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="text-sm">{patient.email}</p>
                          <p className="text-xs text-muted-foreground">{patient.phone || "No phone"}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <span>{patient.age || "N/A"}</span>
                          {patient.gender && (
                            <>
                              <span className="text-muted-foreground">/</span>
                              <span>{patient.gender}</span>
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {patient.lastVisit ? (
                          <span>{formatDate(patient.lastVisit)}</span>
                        ) : (
                          <span className="text-muted-foreground">No visits yet</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getStatusBadgeColor(patient.status || "new")}>
                          {patient.status ? patient.status.charAt(0).toUpperCase() + patient.status.slice(1) : "New"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {patient.nextAppointment ? (
                          <div className="space-y-1">
                            <p className="text-sm">{formatDate(patient.nextAppointment.date)}</p>
                            <p className="text-xs text-muted-foreground">{patient.nextAppointment.time}</p>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">None scheduled</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                handlePatientClick(patient)
                              }}
                            >
                              <User className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                handleViewPatientAnalysis(patient.id)
                              }}
                            >
                              <Stethoscope className="h-4 w-4 mr-2" />
                              Detailed Analysis
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                              <Calendar className="h-4 w-4 mr-2" />
                              Schedule Appointment
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                              <FileText className="h-4 w-4 mr-2" />
                              Medical Records
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                              <Phone className="h-4 w-4 mr-2" />
                              Contact Patient
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                      {searchQuery || statusFilter !== "all"
                        ? "No patients found matching your search criteria"
                        : "No patients found. Your patients will appear here once they book appointments."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Patient Details Dialog */}
      <Dialog open={isPatientDetailsOpen} onOpenChange={setIsPatientDetailsOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Patient Details</DialogTitle>
            <DialogDescription>View and manage patient information</DialogDescription>
          </DialogHeader>

          {selectedPatient && (
            <div className="flex-1 overflow-y-auto pr-1">
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row gap-6">
                  <div className="flex flex-col items-center md:items-start gap-2">
                    <Avatar className="h-24 w-24">
                      {selectedPatient.profilePicture ? (
                        <AvatarImage src={selectedPatient.profilePicture} alt={selectedPatient.name} />
                      ) : (
                        <AvatarFallback className="bg-purple-100 text-purple-600 text-2xl">
                          {selectedPatient.name.charAt(0)}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className="text-center md:text-left">
                      <h3 className="text-xl font-bold">{selectedPatient.name}</h3>
                      <p className="text-sm text-muted-foreground">Patient ID: {selectedPatient.id}</p>
                    </div>
                    <Badge variant="outline" className={getStatusBadgeColor(selectedPatient.status || "new")}>
                      {selectedPatient.status
                        ? selectedPatient.status.charAt(0).toUpperCase() + selectedPatient.status.slice(1)
                        : "New"}
                    </Badge>
                  </div>

                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Contact Information</p>
                      <div className="mt-1 space-y-1">
                        <p className="text-sm">{selectedPatient.email}</p>
                        <p className="text-sm">{selectedPatient.phone || "No phone number"}</p>
                        {selectedPatient.address && <p className="text-sm">{selectedPatient.address}</p>}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Basic Information</p>
                      <div className="mt-1 space-y-1">
                        <p className="text-sm">Age: {selectedPatient.age || "Not recorded"}</p>
                        <p className="text-sm">Gender: {selectedPatient.gender || "Not recorded"}</p>
                        <p className="text-sm">
                          Blood Group:{" "}
                          {selectedPatient.medicalInfo?.bloodGroup === "not-specified"
                            ? "Not recorded"
                            : selectedPatient.medicalInfo?.bloodGroup || "Not recorded"}
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Registration Date</p>
                      <p className="text-sm mt-1">
                        {selectedPatient.registrationDate
                          ? formatDate(selectedPatient.registrationDate)
                          : "Not recorded"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Last Visit</p>
                      <p className="text-sm mt-1">
                        {selectedPatient.lastVisit ? formatDate(selectedPatient.lastVisit) : "No visits yet"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    className="bg-purple-600 hover:bg-purple-700"
                    onClick={() => handleViewPatientAnalysis(selectedPatient.id)}
                  >
                    <Stethoscope className="h-4 w-4 mr-2" />
                    View Detailed Analysis
                  </Button>
                </div>

                <Tabs defaultValue="medical" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="medical">Medical Information</TabsTrigger>
                    <TabsTrigger value="appointments">Appointments</TabsTrigger>
                    <TabsTrigger value="notes">Notes & Documents</TabsTrigger>
                  </TabsList>

                  <TabsContent value="medical" className="space-y-4 mt-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium">Medical Information</h3>
                      {!editingMedicalInfo ? (
                        <Button variant="outline" onClick={() => setEditingMedicalInfo(true)}>
                          Edit Medical Info
                        </Button>
                      ) : (
                        <div className="flex gap-2">
                          <Button variant="outline" onClick={() => setEditingMedicalInfo(false)}>
                            Cancel
                          </Button>
                          <Button
                            className="bg-purple-600 hover:bg-purple-700"
                            onClick={handleSaveMedicalInfo}
                            disabled={savingMedicalInfo}
                          >
                            {savingMedicalInfo && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Save Changes
                          </Button>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {editingMedicalInfo ? (
                        // Editing mode
                        <>
                          <Card>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-base">Blood Group</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <Select
                                value={medicalInfoForm.bloodGroup || "not-specified"}
                                onValueChange={(value) =>
                                  setMedicalInfoForm({
                                    ...medicalInfoForm,
                                    bloodGroup: value,
                                  })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select blood group" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="not-specified">Not specified</SelectItem>
                                  <SelectItem value="A+">A+</SelectItem>
                                  <SelectItem value="A-">A-</SelectItem>
                                  <SelectItem value="B+">B+</SelectItem>
                                  <SelectItem value="B-">B-</SelectItem>
                                  <SelectItem value="AB+">AB+</SelectItem>
                                  <SelectItem value="AB-">AB-</SelectItem>
                                  <SelectItem value="O+">O+</SelectItem>
                                  <SelectItem value="O-">O-</SelectItem>
                                </SelectContent>
                              </Select>
                            </CardContent>
                          </Card>

                          <Card>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-base">Allergies</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-2">
                                <div className="flex gap-2">
                                  <Input
                                    placeholder="Add allergy"
                                    value={newAllergy}
                                    onChange={(e) => setNewAllergy(e.target.value)}
                                  />
                                  <Button
                                    variant="outline"
                                    onClick={() => addItemToMedicalInfo("allergies", newAllergy)}
                                  >
                                    Add
                                  </Button>
                                </div>
                                <div className="space-y-1 mt-2">
                                  {medicalInfoForm.allergies && medicalInfoForm.allergies.length > 0 ? (
                                    medicalInfoForm.allergies.map((allergy, index) => (
                                      <div
                                        key={index}
                                        className="flex items-center justify-between bg-gray-50 p-2 rounded"
                                      >
                                        <span>{allergy}</span>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-6 w-6 text-red-500"
                                          onClick={() => removeItemFromMedicalInfo("allergies", index)}
                                        >
                                          <Trash className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    ))
                                  ) : (
                                    <p className="text-sm text-muted-foreground">No allergies recorded</p>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>

                          <Card>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-base">Chronic Conditions</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-2">
                                <div className="flex gap-2">
                                  <Input
                                    placeholder="Add condition"
                                    value={newCondition}
                                    onChange={(e) => setNewCondition(e.target.value)}
                                  />
                                  <Button
                                    variant="outline"
                                    onClick={() => addItemToMedicalInfo("chronicConditions", newCondition)}
                                  >
                                    Add
                                  </Button>
                                </div>
                                <div className="space-y-1 mt-2">
                                  {medicalInfoForm.chronicConditions && medicalInfoForm.chronicConditions.length > 0 ? (
                                    medicalInfoForm.chronicConditions.map((condition, index) => (
                                      <div
                                        key={index}
                                        className="flex items-center justify-between bg-gray-50 p-2 rounded"
                                      >
                                        <span>{condition}</span>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-6 w-6 text-red-500"
                                          onClick={() => removeItemFromMedicalInfo("chronicConditions", index)}
                                        >
                                          <Trash className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    ))
                                  ) : (
                                    <p className="text-sm text-muted-foreground">No chronic conditions recorded</p>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>

                          <Card>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-base">Current Medications</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-2">
                                <div className="flex gap-2">
                                  <Input
                                    placeholder="Add medication"
                                    value={newMedication}
                                    onChange={(e) => setNewMedication(e.target.value)}
                                  />
                                  <Button
                                    variant="outline"
                                    onClick={() => addItemToMedicalInfo("medications", newMedication)}
                                  >
                                    Add
                                  </Button>
                                </div>
                                <div className="spaceace-y-1 mt-2">
                                  {medicalInfoForm.medications && medicalInfoForm.medications.length > 0 ? (
                                    medicalInfoForm.medications.map((medication, index) => (
                                      <div
                                        key={index}
                                        className="flex items-center justify-between bg-gray-50 p-2 rounded"
                                      >
                                        <span>{medication}</span>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-6 w-6 text-red-500"
                                          onClick={() => removeItemFromMedicalInfo("medications", index)}
                                        >
                                          <Trash className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    ))
                                  ) : (
                                    <p className="text-sm text-muted-foreground">No medications recorded</p>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </>
                      ) : (
                        // View mode
                        <>
                          <Card>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-base">Chronic Conditions</CardTitle>
                            </CardHeader>
                            <CardContent>
                              {selectedPatient.medicalInfo?.chronicConditions &&
                              selectedPatient.medicalInfo.chronicConditions.length > 0 ? (
                                <ul className="list-disc pl-5 space-y-1">
                                  {selectedPatient.medicalInfo.chronicConditions.map((condition, index) => (
                                    <li key={index} className="text-sm">
                                      {condition}
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="text-sm text-muted-foreground">No chronic conditions recorded</p>
                              )}
                            </CardContent>
                          </Card>

                          <Card>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-base">Allergies</CardTitle>
                            </CardHeader>
                            <CardContent>
                              {selectedPatient.medicalInfo?.allergies &&
                              selectedPatient.medicalInfo.allergies.length > 0 ? (
                                <ul className="list-disc pl-5 space-y-1">
                                  {selectedPatient.medicalInfo.allergies.map((allergy, index) => (
                                    <li key={index} className="text-sm">
                                      {allergy}
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="text-sm text-muted-foreground">No allergies recorded</p>
                              )}
                            </CardContent>
                          </Card>

                          <Card>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-base">Current Medications</CardTitle>
                            </CardHeader>
                            <CardContent>
                              {selectedPatient.medicalInfo?.medications &&
                              selectedPatient.medicalInfo.medications.length > 0 ? (
                                <ul className="list-disc pl-5 space-y-1">
                                  {selectedPatient.medicalInfo.medications.map((medication, index) => (
                                    <li key={index} className="text-sm">
                                      {medication}
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="text-sm text-muted-foreground">No medications recorded</p>
                              )}
                            </CardContent>
                          </Card>

                          <Card>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-base">Vitals History</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <p className="text-sm text-muted-foreground">No vitals history available</p>
                              <Button variant="outline" size="sm" className="mt-2">
                                <Plus className="h-3 w-3 mr-1" />
                                Add Vitals
                              </Button>
                            </CardContent>
                          </Card>
                        </>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="appointments" className="space-y-4 mt-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium">Appointment History</h3>
                      <Button className="bg-purple-600 hover:bg-purple-700">
                        <Calendar className="h-4 w-4 mr-2" />
                        Schedule New Appointment
                      </Button>
                    </div>

                    {selectedPatient?.appointments && selectedPatient.appointments.length > 0 ? (
                      <>
                        {/* Upcoming Appointments */}
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-muted-foreground">Upcoming Appointments</h4>
                          <div className="rounded-md border overflow-hidden">
                            <div className="max-h-[250px] overflow-y-auto">
                              <Table>
                                <TableHeader className="sticky top-0 bg-white z-10">
                                  <TableRow>
                                    <TableHead>Date & Time</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Reason</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {getUpcomingAppointments(selectedPatient.appointments).length > 0 ? (
                                    getUpcomingAppointments(selectedPatient.appointments).map((appointment) => (
                                      <TableRow key={appointment.id}>
                                        <TableCell>
                                          <div className="space-y-1">
                                            <p className="font-medium">{formatDate(appointment.date)}</p>
                                            <p className="text-xs text-muted-foreground">
                                              {appointment.startTime} - {appointment.endTime}
                                            </p>
                                          </div>
                                        </TableCell>
                                        <TableCell className="capitalize">
                                          {appointment.type.replace("-", " ")}
                                        </TableCell>
                                        <TableCell>
                                          <Badge
                                            variant="outline"
                                            className={getAppointmentStatusColor(appointment.status)}
                                          >
                                            {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                                          </Badge>
                                        </TableCell>
                                        <TableCell>
                                          {appointment.reason ? (
                                            <p className="text-sm truncate max-w-[200px]">{appointment.reason}</p>
                                          ) : (
                                            <p className="text-sm text-muted-foreground">No reason provided</p>
                                          )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                          <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <MoreHorizontal className="h-4 w-4" />
                                              </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                              <DropdownMenuItem>View Details</DropdownMenuItem>
                                              <DropdownMenuItem>Edit Appointment</DropdownMenuItem>
                                              <DropdownMenuItem>Add Notes</DropdownMenuItem>
                                              {appointment.status === "scheduled" && (
                                                <>
                                                  <DropdownMenuSeparator />
                                                  <DropdownMenuItem className="text-red-600">
                                                    Cancel Appointment
                                                  </DropdownMenuItem>
                                                </>
                                              )}
                                            </DropdownMenuContent>
                                          </DropdownMenu>
                                        </TableCell>
                                      </TableRow>
                                    ))
                                  ) : (
                                    <TableRow>
                                      <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                                        No upcoming appointments
                                      </TableCell>
                                    </TableRow>
                                  )}
                                </TableBody>
                              </Table>
                            </div>
                          </div>
                        </div>

                        {/* Past Appointments */}
                        <div className="space-y-2 mt-6">
                          <h4 className="text-sm font-medium text-muted-foreground">Past Appointments</h4>
                          <div className="rounded-md border overflow-hidden">
                            <div className="max-h-[250px] overflow-y-auto">
                              <Table>
                                <TableHeader className="sticky top-0 bg-white z-10">
                                  <TableRow>
                                    <TableHead>Date & Time</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Notes</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {getPastAppointments(selectedPatient.appointments).length > 0 ? (
                                    getPastAppointments(selectedPatient.appointments).map((appointment) => (
                                      <TableRow key={appointment.id}>
                                        <TableCell>
                                          <div className="space-y-1">
                                            <p className="font-medium">{formatDate(appointment.date)}</p>
                                            <p className="text-xs text-muted-foreground">
                                              {appointment.startTime} - {appointment.endTime}
                                            </p>
                                          </div>
                                        </TableCell>
                                        <TableCell className="capitalize">
                                          {appointment.type.replace("-", " ")}
                                        </TableCell>
                                        <TableCell>
                                          <Badge
                                            variant="outline"
                                            className={getAppointmentStatusColor(appointment.status)}
                                          >
                                            {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                                          </Badge>
                                        </TableCell>
                                        <TableCell>
                                          {appointment.notes ? (
                                            <p className="text-sm truncate max-w-[200px]">{appointment.notes}</p>
                                          ) : (
                                            <p className="text-sm text-muted-foreground">No notes</p>
                                          )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                          <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <MoreHorizontal className="h-4 w-4" />
                                              </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                              <DropdownMenuItem>View Details</DropdownMenuItem>
                                              <DropdownMenuItem>View Medical Record</DropdownMenuItem>
                                              {appointment.status !== "completed" && (
                                                <DropdownMenuItem>Mark as Completed</DropdownMenuItem>
                                              )}
                                            </DropdownMenuContent>
                                          </DropdownMenu>
                                        </TableCell>
                                      </TableRow>
                                    ))
                                  ) : (
                                    <TableRow>
                                      <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                                        No past appointments
                                      </TableCell>
                                    </TableRow>
                                  )}
                                </TableBody>
                              </Table>
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <Card>
                        <CardContent className="p-6 text-center">
                          <Calendar className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
                          <p className="mt-2 text-muted-foreground">No appointments recorded</p>
                          <p className="text-sm text-muted-foreground">
                            This patient hasn't scheduled any appointments yet
                          </p>
                          <Button className="mt-4 bg-purple-600 hover:bg-purple-700">
                            <Calendar className="h-4 w-4 mr-2" />
                            Schedule First Appointment
                          </Button>
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>

                  <TabsContent value="notes" className="space-y-4 mt-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium">Medical Notes & Documents</h3>
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setIsAddNoteOpen(true)}>
                          <FileText className="h-4 w-4 mr-2" />
                          Add Note
                        </Button>
                        <Button variant="outline" onClick={() => setIsUploadDocumentOpen(true)}>
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Document
                        </Button>
                      </div>
                    </div>

                    <div className="max-h-[500px] overflow-y-auto pr-1">
                      {selectedPatient.notes && selectedPatient.notes.length > 0 ? (
                        <div className="space-y-4">
                          <h4 className="text-sm font-medium">Notes</h4>
                          {selectedPatient.notes.map((note, index) => (
                            <Card key={index}>
                              <CardContent className="p-4">
                                <div className="flex justify-between items-start mb-2">
                                  <div>
                                    <p className="text-sm font-medium">{note.createdBy || "Doctor"}</p>
                                    <p className="text-xs text-muted-foreground">{formatDate(note.createdAt)}</p>
                                  </div>
                                </div>
                                <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ) : null}

                      {selectedPatient.documents && selectedPatient.documents.length > 0 ? (
                        <div className="space-y-4 mt-6">
                          <h4 className="text-sm font-medium">Documents</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {selectedPatient.documents.map((doc, index) => (
                              <Card key={index}>
                                <CardContent className="p-4">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <FileText className="h-8 w-8 text-purple-600" />
                                      <div>
                                        <p className="font-medium">{doc.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                          Uploaded on {formatDate(doc.uploadedAt)} by {doc.uploadedBy}
                                        </p>
                                      </div>
                                    </div>
                                    <Button variant="outline" size="sm" asChild>
                                      <a href={doc.url} target="_blank" rel="noopener noreferrer">
                                        View
                                      </a>
                                    </Button>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      {(!selectedPatient.notes || selectedPatient.notes.length === 0) &&
                        (!selectedPatient.documents || selectedPatient.documents.length === 0) && (
                          <Card>
                            <CardContent className="p-6 text-center">
                              <Stethoscope className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
                              <p className="mt-2 text-muted-foreground">No medical notes or documents available</p>
                              <p className="text-sm text-muted-foreground">
                                Add notes or upload documents to keep track of this patient's medical history
                              </p>
                            </CardContent>
                          </Card>
                        )}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          )}

          <DialogFooter className="mt-6 flex justify-between sm:justify-between">
            <Button variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50">
              Archive Patient
            </Button>
            <div className="flex gap-2">
              <Button variant="outline">Edit Patient</Button>
              <Button className="bg-purple-600 hover:bg-purple-700">
                <Calendar className="h-4 w-4 mr-2" />
                Schedule Appointment
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Note Dialog */}
      <Dialog open={isAddNoteOpen} onOpenChange={setIsAddNoteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Medical Note</DialogTitle>
            <DialogDescription>Add a note to the patient's medical record</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Textarea
              placeholder="Enter your medical note here..."
              className="min-h-[150px]"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddNoteOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-purple-600 hover:bg-purple-700"
              onClick={handleAddNote}
              disabled={!newNote.trim() || savingNote}
            >
              {savingNote && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload Document Dialog */}
      <Dialog open={isUploadDocumentOpen} onOpenChange={setIsUploadDocumentOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>Upload a document to the patient's medical record</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Document Name</label>
              <Input
                placeholder="Enter document name"
                value={documentName}
                onChange={(e) => setDocumentName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Document Type</label>
              <Select value={documentType} onValueChange={(value) => setDocumentType(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="medical-record">Medical Record</SelectItem>
                  <SelectItem value="lab-result">Lab Result</SelectItem>
                  <SelectItem value="prescription">Prescription</SelectItem>
                  <SelectItem value="imaging">Imaging</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">File</label>
              <Input
                type="file"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setDocumentFile(e.target.files[0])
                  }
                }}
              />
              <p className="text-xs text-muted-foreground">Supported formats: PDF, JPG, PNG, DOC, DOCX (Max 10MB)</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUploadDocumentOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-purple-600 hover:bg-purple-700"
              onClick={handleUploadDocument}
              disabled={!documentFile || !documentName.trim() || uploadingDocument}
            >
              {uploadingDocument && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Upload Document
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Patient Dialog */}
      <Dialog open={isAddPatientOpen} onOpenChange={setIsAddPatientOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Patient</DialogTitle>
            <DialogDescription>Enter the patient's information to create a new record</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Full Name</label>
              <Input placeholder="Enter patient's full name" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input type="email" placeholder="patient@example.com" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Phone</label>
                <Input placeholder="(555) 123-4567" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Age</label>
                <Input type="number" placeholder="Age" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Gender</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Address</label>
              <Input placeholder="Enter patient's address" />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddPatientOpen(false)}>
              Cancel
            </Button>
            <Button className="bg-purple-600 hover:bg-purple-700">Add Patient</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}


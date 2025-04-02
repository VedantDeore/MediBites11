"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { useDoctorAuth } from "@/lib/doctor-auth-context"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Calendar,
  FileText,
  MoreHorizontal,
  Phone,
  Plus,
  Upload,
  Trash,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Activity,
  Pill,
  Clipboard,
  Heart,
  Thermometer,
  Weight,
  Ruler,
  Mail,
  MapPin,
  Edit,
  Save,
  X,
} from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
  getPatientDetails,
  updatePatientMedicalInfo,
  addPatientNote,
  uploadPatientDocument,
  type PatientData,
} from "@/lib/patient-service"
import type { Appointment } from "@/lib/appointment-service"

// Add these imports at the top of the file
import { MedicalImageUploader } from "@/components/medical-image-uploader"
import { MedicalImageGallery } from "@/components/medical-image-gallery"

// Update the PatientMedicalInfo interface to include more fields
interface PatientMedicalInfo {
  bloodGroup?: string
  allergies: string[]
  chronicConditions: string[]
  medications: string[]
  emergencyContact?: {
    name: string
    phone: string
    relationship: string
  }
  insuranceDetails?: {
    provider: string
    policyNumber: string
    coverageType: string
  }
  preferredLanguage?: string
  primaryPhysician?: string
  medicalHistory?: string[]
  surgeryHistory?: {
    procedure: string
    date: string
    surgeon: string
    hospital: string
    outcome: string
  }[]
  vitals?: {
    date: string
    bloodPressure?: string
    heartRate?: number
    temperature?: number
    respiratoryRate?: number
    oxygenSaturation?: number
    weight?: number
    height?: number
    bmi?: number
    bloodGlucose?: number
  }[]
  labReports?: {
    type: string
    date: string
    results: {
      name: string
      value: string
      isAbnormal: boolean
      normalRange?: string
    }[]
    summary?: string
    documentUrl?: string
  }[]
  diagnosticReports?: {
    type: string
    date: string
    findings: string
    documentUrl?: string
  }[]
  riskAssessments?: {
    condition: string
    riskLevel: "Low" | "Medium" | "High"
    probability: number
    factors: string[]
    recommendations: string[]
    lastAssessed: string
  }[]
  allergyManagement?: {
    severity: string
    frequency: string
    emergencyPlan: string
    recentReactions: {
      date: string
      description: string
      treatment: string
    }[]
    preventiveMeasures: string[]
  }
}

import type { PatientNote, PatientDocument } from "@/lib/patient-service"
// Add these imports at the top of the file if they're not already there
import Image from "next/image"

export default function PatientAnalysisPage() {
  const router = useRouter()
  const params = useParams()
  const patientId = params.id as string
  const { doctor } = useDoctorAuth()

  const [patient, setPatient] = useState<PatientData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Medical info editing states
  const [editingMedicalInfo, setEditingMedicalInfo] = useState(false)
  const [medicalInfoForm, setMedicalInfoForm] = useState<PatientMedicalInfo>({
    bloodGroup: "",
    allergies: [],
    chronicConditions: [],
    medications: [],
  })
  const [savingMedicalInfo, setSavingMedicalInfo] = useState(false)
  const [newAllergy, setNewAllergy] = useState("")
  const [newCondition, setNewCondition] = useState("")
  const [newMedication, setNewMedication] = useState("")

  // Add these new state variables after the existing ones
  const [editingEmergencyContact, setEditingEmergencyContact] = useState(false)
  const [emergencyContactForm, setEmergencyContactForm] = useState({
    name: "",
    phone: "",
    relationship: "",
  })

  const [editingInsurance, setEditingInsurance] = useState(false)
  const [insuranceForm, setInsuranceForm] = useState({
    provider: "",
    policyNumber: "",
    coverageType: "",
  })

  const [editingMedicalHistory, setEditingMedicalHistory] = useState(false)
  const [newMedicalHistoryItem, setNewMedicalHistoryItem] = useState("")

  const [editingSurgeryHistory, setEditingSurgeryHistory] = useState(false)
  const [surgeryForm, setSurgeryForm] = useState({
    procedure: "",
    date: "",
    surgeon: "",
    hospital: "",
    outcome: "",
  })

  const [editingLabReports, setEditingLabReports] = useState(false)
  const [labReportForm, setLabReportForm] = useState({
    type: "",
    date: new Date().toISOString().split("T")[0],
    results: [] as { name: string; value: string; isAbnormal: boolean; normalRange?: string }[],
    summary: "",
  })
  // Add these state variables after the labReportForm state
  const [labReportImage, setLabReportImage] = useState<File | null>(null)
  const [uploadingLabImage, setUploadingLabImage] = useState(false)
  const [labImagePreview, setLabImagePreview] = useState<string | null>(null)
  const [newLabResult, setNewLabResult] = useState({
    name: "",
    value: "",
    isAbnormal: false,
    normalRange: "",
  })

  const [editingDiagnosticReports, setEditingDiagnosticReports] = useState(false)
  const [diagnosticReportForm, setDiagnosticReportForm] = useState({
    type: "",
    date: new Date().toISOString().split("T")[0],
    findings: "",
  })

  // Add this state variable after the diagnosticReportForm state
  const [diagnosticReportImage, setDiagnosticReportImage] = useState<File | null>(null)
  const [uploadingDiagnosticImage, setUploadingDiagnosticImage] = useState(false)
  const [diagnosticImagePreview, setDiagnosticImagePreview] = useState<string | null>(null)

  const [editingRiskAssessment, setEditingRiskAssessment] = useState(false)
  const [riskAssessmentForm, setRiskAssessmentForm] = useState({
    condition: "",
    riskLevel: "Medium" as "Low" | "Medium" | "High",
    probability: 0,
    factors: [] as string[],
    recommendations: [] as string[],
    lastAssessed: new Date().toISOString().split("T")[0],
  })
  const [newRiskFactor, setNewRiskFactor] = useState("")
  const [newRecommendation, setNewRecommendation] = useState("")

  const [editingAllergyManagement, setEditingAllergyManagement] = useState(false)
  const [allergyManagementForm, setAllergyManagementForm] = useState({
    severity: "",
    frequency: "",
    emergencyPlan: "",
    recentReactions: [] as { date: string; description: string; treatment: string }[],
    preventiveMeasures: [] as string[],
  })
  const [newReaction, setNewReaction] = useState({
    date: new Date().toISOString().split("T")[0],
    description: "",
    treatment: "",
  })
  const [newPreventiveMeasure, setNewPreventiveMeasure] = useState("")

  // Vitals states
  const [addingVitals, setAddingVitals] = useState(false)
  const [newVitals, setNewVitals] = useState({
    date: new Date().toISOString().split("T")[0],
    bloodPressure: "",
    heartRate: undefined as number | undefined,
    temperature: undefined as number | undefined,
    respiratoryRate: undefined as number | undefined,
    oxygenSaturation: undefined as number | undefined,
    weight: undefined as number | undefined,
    height: undefined as number | undefined,
  })

  // Notes and documents states
  const [isAddNoteOpen, setIsAddNoteOpen] = useState(false)
  const [isUploadDocumentOpen, setIsUploadDocumentOpen] = useState(false)
  const [newNote, setNewNote] = useState("")
  const [documentFile, setDocumentFile] = useState<File | null>(null)
  const [documentName, setDocumentName] = useState("")
  const [documentType, setDocumentType] = useState("medical-record")
  const [uploadingDocument, setUploadingDocument] = useState(false)
  const [savingNote, setSavingNote] = useState(false)

  // Treatment plan states
  const [editingTreatmentPlan, setEditingTreatmentPlan] = useState(false)
  const [treatmentPlan, setTreatmentPlan] = useState("")
  const [savingTreatmentPlan, setSavingTreatmentPlan] = useState(false)

  // Patient info editing states
  const [editingPatientInfo, setEditingPatientInfo] = useState(false)
  const [patientInfoForm, setPatientInfoForm] = useState({
    name: "",
    email: "",
    phone: "",
    age: undefined as number | undefined,
    gender: "",
    address: "",
  })
  const [savingPatientInfo, setSavingPatientInfo] = useState(false)

  // Add this state variable in the component, after the other state variables
  const [isUploadImageOpen, setIsUploadImageOpen] = useState(false)

  // Fetch patient data
  useEffect(() => {
    async function fetchPatientData() {
      if (!patientId || !doctor?.id) return

      try {
        setLoading(true)
        setError(null)
        const patientData = await getPatientDetails(patientId)
        setPatient(patientData)

        // Initialize medical info form
        if (patientData.medicalInfo) {
          setMedicalInfoForm(patientData.medicalInfo)
        }

        // Initialize patient info form
        setPatientInfoForm({
          name: patientData.name || "",
          email: patientData.email || "",
          phone: patientData.phone || "",
          age: patientData.age,
          gender: patientData.gender || "",
          address: patientData.address || "",
        })

        // Initialize treatment plan
        setTreatmentPlan(patientData.treatmentPlan || "")

        // Add this to the useEffect hook that fetches patient data, after the existing initializations
        // Initialize emergency contact form
        if (patientData.medicalInfo?.emergencyContact) {
          setEmergencyContactForm(patientData.medicalInfo.emergencyContact)
        }

        // Initialize insurance form
        if (patientData.medicalInfo?.insuranceDetails) {
          setInsuranceForm(patientData.medicalInfo.insuranceDetails)
        }

        // Initialize surgery form if there's surgery history
        if (patientData.medicalInfo?.surgeryHistory && patientData.medicalInfo.surgeryHistory.length > 0) {
          setSurgeryForm(patientData.medicalInfo.surgeryHistory[0])
        }

        // Initialize allergy management form
        if (patientData.medicalInfo?.allergyManagement) {
          setAllergyManagementForm(patientData.medicalInfo.allergyManagement)
        }
      } catch (err) {
        console.error("Error fetching patient details:", err)
        setError("Failed to load patient details. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    fetchPatientData()
  }, [patientId, doctor?.id])

  // Handle saving medical info
  const handleSaveMedicalInfo = async () => {
    if (!patient) return

    try {
      setSavingMedicalInfo(true)
      await updatePatientMedicalInfo(patient.id, medicalInfoForm)

      // Update the patient state with new medical info
      setPatient({
        ...patient,
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

  // Add these handler functions after the existing ones
  const handleSaveEmergencyContact = async () => {
    if (!patient) return

    try {
      const updatedMedicalInfo = { ...medicalInfoForm, emergencyContact: emergencyContactForm }
      await updatePatientMedicalInfo(patient.id, updatedMedicalInfo)

      // Update the patient state
      setPatient({
        ...patient,
        medicalInfo: updatedMedicalInfo,
      })

      setMedicalInfoForm(updatedMedicalInfo)
      setEditingEmergencyContact(false)
    } catch (err) {
      console.error("Error updating emergency contact:", err)
      setError("Failed to update emergency contact. Please try again.")
    }
  }

  const handleSaveInsurance = async () => {
    if (!patient) return

    try {
      const updatedMedicalInfo = { ...medicalInfoForm, insuranceDetails: insuranceForm }
      await updatePatientMedicalInfo(patient.id, updatedMedicalInfo)

      // Update the patient state
      setPatient({
        ...patient,
        medicalInfo: updatedMedicalInfo,
      })

      setMedicalInfoForm(updatedMedicalInfo)
      setEditingInsurance(false)
    } catch (err) {
      console.error("Error updating insurance details:", err)
      setError("Failed to update insurance details. Please try again.")
    }
  }

  const handleAddMedicalHistoryItem = () => {
    if (!newMedicalHistoryItem.trim()) return

    const updatedMedicalInfo = { ...medicalInfoForm }
    const medicalHistory = updatedMedicalInfo.medicalHistory || []
    medicalHistory.push(newMedicalHistoryItem)
    updatedMedicalInfo.medicalHistory = medicalHistory

    setMedicalInfoForm(updatedMedicalInfo)
    setNewMedicalHistoryItem("")
  }

  const handleRemoveMedicalHistoryItem = (index: number) => {
    const updatedMedicalInfo = { ...medicalInfoForm }
    const medicalHistory = [...(updatedMedicalInfo.medicalHistory || [])]
    medicalHistory.splice(index, 1)
    updatedMedicalInfo.medicalHistory = medicalHistory

    setMedicalInfoForm(updatedMedicalInfo)
  }

  const handleSaveMedicalHistory = async () => {
    if (!patient) return

    try {
      await updatePatientMedicalInfo(patient.id, medicalInfoForm)

      // Update the patient state
      setPatient({
        ...patient,
        medicalInfo: medicalInfoForm,
      })

      setEditingMedicalHistory(false)
    } catch (err) {
      console.error("Error updating medical history:", err)
      setError("Failed to update medical history. Please try again.")
    }
  }

  const handleAddSurgery = async () => {
    if (!patient || !surgeryForm.procedure || !surgeryForm.date) return

    try {
      const updatedMedicalInfo = { ...medicalInfoForm }
      const surgeryHistory = updatedMedicalInfo.surgeryHistory || []
      surgeryHistory.push(surgeryForm)
      updatedMedicalInfo.surgeryHistory = surgeryHistory

      await updatePatientMedicalInfo(patient.id, updatedMedicalInfo)

      // Update the patient state
      setPatient({
        ...patient,
        medicalInfo: updatedMedicalInfo,
      })

      setMedicalInfoForm(updatedMedicalInfo)

      // Reset form
      setSurgeryForm({
        procedure: "",
        date: "",
        surgeon: "",
        hospital: "",
        outcome: "",
      })

      setEditingSurgeryHistory(false)
    } catch (err) {
      console.error("Error adding surgery:", err)
      setError("Failed to add surgery. Please try again.")
    }
  }

  const handleRemoveSurgery = async (index: number) => {
    if (!patient) return

    try {
      const updatedMedicalInfo = { ...medicalInfoForm }
      const surgeryHistory = [...(updatedMedicalInfo.surgeryHistory || [])]
      surgeryHistory.splice(index, 1)
      updatedMedicalInfo.surgeryHistory = surgeryHistory

      await updatePatientMedicalInfo(patient.id, updatedMedicalInfo)

      // Update the patient state
      setPatient({
        ...patient,
        medicalInfo: updatedMedicalInfo,
      })

      setMedicalInfoForm(updatedMedicalInfo)
    } catch (err) {
      console.error("Error removing surgery:", err)
      setError("Failed to remove surgery. Please try again.")
    }
  }

  const handleAddLabResult = () => {
    if (!newLabResult.name || !newLabResult.value) return

    setLabReportForm({
      ...labReportForm,
      results: [...labReportForm.results, newLabResult],
    })

    setNewLabResult({
      name: "",
      value: "",
      isAbnormal: false,
      normalRange: "",
    })
  }

  const handleRemoveLabResult = (index: number) => {
    const updatedResults = [...labReportForm.results]
    updatedResults.splice(index, 1)

    setLabReportForm({
      ...labReportForm,
      results: updatedResults,
    })
  }

  // Update the handleAddLabReport function to handle image uploads
  const handleAddLabReport = async () => {
    if (!patient || !labReportForm.type || labReportForm.results.length === 0) return

    try {
      let imageUrl = undefined

      // If there's an image to upload, upload it first
      if (labReportImage) {
        setUploadingLabImage(true)

        // Create form data for upload
        const formData = new FormData()
        formData.append("file", labReportImage)
        formData.append("path", "patients/lab-images")
        formData.append("patientId", patient.id)

        // Upload to Supabase via API route
        const response = await fetch("/api/upload-image", {
          method: "POST",
          body: formData,
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Failed to upload image")
        }

        const { fileUrl } = await response.json()
        imageUrl = fileUrl
        setUploadingLabImage(false)
      }

      const updatedMedicalInfo = { ...medicalInfoForm }
      const labReports = updatedMedicalInfo.labReports || []

      // Add the image URL to the report if available
      labReports.push({
        ...labReportForm,
        documentUrl: imageUrl,
      })

      updatedMedicalInfo.labReports = labReports

      await updatePatientMedicalInfo(patient.id, updatedMedicalInfo)

      // Update the patient state
      setPatient({
        ...patient,
        medicalInfo: updatedMedicalInfo,
      })

      setMedicalInfoForm(updatedMedicalInfo)

      // Reset form
      setLabReportForm({
        type: "",
        date: new Date().toISOString().split("T")[0],
        results: [],
        summary: "",
      })
      setLabReportImage(null)
      setLabImagePreview(null)

      setEditingLabReports(false)
    } catch (err) {
      console.error("Error adding lab report:", err)
      setError("Failed to add lab report. Please try again.")
    }
  }

  // Update the handleAddDiagnosticReport function to handle image uploads
  const handleAddDiagnosticReport = async () => {
    if (!patient || !diagnosticReportForm.type || !diagnosticReportForm.findings) return

    try {
      let imageUrl = undefined

      // If there's an image to upload, upload it first
      if (diagnosticReportImage) {
        setUploadingDiagnosticImage(true)

        // Create form data for upload
        const formData = new FormData()
        formData.append("file", diagnosticReportImage)
        formData.append("path", "patients/diagnostic-images")
        formData.append("patientId", patient.id)

        // Upload to Supabase via API route
        const response = await fetch("/api/upload-image", {
          method: "POST",
          body: formData,
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Failed to upload image")
        }

        const { fileUrl } = await response.json()
        imageUrl = fileUrl
        setUploadingDiagnosticImage(false)
      }

      const updatedMedicalInfo = { ...medicalInfoForm }
      const diagnosticReports = updatedMedicalInfo.diagnosticReports || []

      // Add the image URL to the report if available
      diagnosticReports.push({
        ...diagnosticReportForm,
        documentUrl: imageUrl,
      })

      updatedMedicalInfo.diagnosticReports = diagnosticReports

      await updatePatientMedicalInfo(patient.id, updatedMedicalInfo)

      // Update the patient state
      setPatient({
        ...patient,
        medicalInfo: updatedMedicalInfo,
      })

      setMedicalInfoForm(updatedMedicalInfo)

      // Reset form
      setDiagnosticReportForm({
        type: "",
        date: new Date().toISOString().split("T")[0],
        findings: "",
      })
      setDiagnosticReportImage(null)
      setDiagnosticImagePreview(null)

      setEditingDiagnosticReports(false)
    } catch (err) {
      console.error("Error adding diagnostic report:", err)
      setError("Failed to add diagnostic report. Please try again.")
    }
  }

  const handleAddRiskFactor = () => {
    if (!newRiskFactor.trim()) return

    setRiskAssessmentForm({
      ...riskAssessmentForm,
      factors: [...riskAssessmentForm.factors, newRiskFactor],
    })

    setNewRiskFactor("")
  }

  const handleAddRecommendation = () => {
    if (!newRecommendation.trim()) return

    setRiskAssessmentForm({
      ...riskAssessmentForm,
      recommendations: [...riskAssessmentForm.recommendations, newRecommendation],
    })

    setNewRecommendation("")
  }

  const handleAddRiskAssessment = async () => {
    if (!patient || !riskAssessmentForm.condition) return

    try {
      const updatedMedicalInfo = { ...medicalInfoForm }
      const riskAssessments = updatedMedicalInfo.riskAssessments || []
      riskAssessments.push(riskAssessmentForm)
      updatedMedicalInfo.riskAssessments = riskAssessments

      await updatePatientMedicalInfo(patient.id, updatedMedicalInfo)

      // Update the patient state
      setPatient({
        ...patient,
        medicalInfo: updatedMedicalInfo,
      })

      setMedicalInfoForm(updatedMedicalInfo)

      // Reset form
      setRiskAssessmentForm({
        condition: "",
        riskLevel: "Medium",
        probability: 0,
        factors: [],
        recommendations: [],
        lastAssessed: new Date().toISOString().split("T")[0],
      })

      setEditingRiskAssessment(false)
    } catch (err) {
      console.error("Error adding risk assessment:", err)
      setError("Failed to add risk assessment. Please try again.")
    }
  }

  const handleAddReaction = () => {
    if (!newReaction.description || !newReaction.treatment) return

    setAllergyManagementForm({
      ...allergyManagementForm,
      recentReactions: [...allergyManagementForm.recentReactions, newReaction],
    })

    setNewReaction({
      date: new Date().toISOString().split("T")[0],
      description: "",
      treatment: "",
    })
  }

  const handleAddPreventiveMeasure = () => {
    if (!newPreventiveMeasure.trim()) return

    setAllergyManagementForm({
      ...allergyManagementForm,
      preventiveMeasures: [...allergyManagementForm.preventiveMeasures, newPreventiveMeasure],
    })

    setNewPreventiveMeasure("")
  }

  const handleSaveAllergyManagement = async () => {
    if (!patient) return

    try {
      const updatedMedicalInfo = { ...medicalInfoForm, allergyManagement: allergyManagementForm }
      await updatePatientMedicalInfo(patient.id, updatedMedicalInfo)

      // Update the patient state
      setPatient({
        ...patient,
        medicalInfo: updatedMedicalInfo,
      })

      setMedicalInfoForm(updatedMedicalInfo)
      setEditingAllergyManagement(false)
    } catch (err) {
      console.error("Error updating allergy management:", err)
      setError("Failed to update allergy management. Please try again.")
    }
  }

  // Handle adding a note
  const handleAddNote = async () => {
    if (!patient || !newNote.trim()) return

    try {
      setSavingNote(true)
      const note: PatientNote = {
        content: newNote,
        createdAt: new Date().toISOString(),
        createdBy: doctor?.name || "Doctor",
        doctorId: doctor?.id || "",
      }

      await addPatientNote(patient.id, note)

      // Update the patient state with the new note
      const updatedNotes = [...(patient.notes || []), note]
      setPatient({
        ...patient,
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
    if (!patient || !documentFile || !documentName.trim()) return

    try {
      setUploadingDocument(true)
      const document: PatientDocument = {
        name: documentName,
        type: documentType,
        uploadedAt: new Date().toISOString(),
        uploadedBy: doctor?.name || "Doctor",
        doctorId: doctor?.id || "",
      }

      const documentWithUrl = await uploadPatientDocument(patient.id, document, documentFile)

      // Update the patient state with the new document
      const updatedDocuments = [...(patient.documents || []), documentWithUrl]
      setPatient({
        ...patient,
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

  // Handle adding vitals
  const handleAddVitals = async () => {
    if (!patient) return

    try {
      const updatedMedicalInfo = { ...medicalInfoForm }
      const vitals = updatedMedicalInfo.vitals || []

      vitals.push({
        date: newVitals.date,
        bloodPressure: newVitals.bloodPressure,
        heartRate: newVitals.heartRate,
        temperature: newVitals.temperature,
        respiratoryRate: newVitals.respiratoryRate,
        oxygenSaturation: newVitals.oxygenSaturation,
        weight: newVitals.weight,
        height: newVitals.height,
      })

      // Sort vitals by date (newest first)
      vitals.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

      updatedMedicalInfo.vitals = vitals

      await updatePatientMedicalInfo(patient.id, updatedMedicalInfo)

      // Update the patient state with new vitals
      setPatient({
        ...patient,
        medicalInfo: updatedMedicalInfo,
      })

      setMedicalInfoForm(updatedMedicalInfo)

      // Reset form
      setNewVitals({
        date: new Date().toISOString().split("T")[0],
        bloodPressure: "",
        heartRate: undefined,
        temperature: undefined,
        respiratoryRate: undefined,
        oxygenSaturation: undefined,
        weight: undefined,
        height: undefined,
      })

      setAddingVitals(false)
    } catch (err) {
      console.error("Error adding vitals:", err)
      setError("Failed to add vitals. Please try again.")
    }
  }

  // Handle saving treatment plan
  const handleSaveTreatmentPlan = async () => {
    if (!patient) return

    try {
      setSavingTreatmentPlan(true)

      // In a real app, you would have a dedicated function for this
      // For now, we'll just update the patient state
      setPatient({
        ...patient,
        treatmentPlan,
      })

      setEditingTreatmentPlan(false)
    } catch (err) {
      console.error("Error updating treatment plan:", err)
      setError("Failed to update treatment plan. Please try again.")
    } finally {
      setSavingTreatmentPlan(false)
    }
  }

  // Handle saving patient info
  const handleSavePatientInfo = async () => {
    if (!patient) return

    try {
      setSavingPatientInfo(true)

      // In a real app, you would have a dedicated function for this
      // For now, we'll just update the patient state
      setPatient({
        ...patient,
        name: patientInfoForm.name,
        email: patientInfoForm.email,
        phone: patientInfoForm.phone,
        age: patientInfoForm.age,
        gender: patientInfoForm.gender,
        address: patientInfoForm.address,
      })

      setEditingPatientInfo(false)
    } catch (err) {
      console.error("Error updating patient info:", err)
      setError("Failed to update patient information. Please try again.")
    } finally {
      setSavingPatientInfo(false)
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

  // Add this function to handle lab image selection
  const handleLabImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]

      // Check if file is an image
      if (!selectedFile.type.startsWith("image/")) {
        setError("Please select an image file")
        return
      }

      // Check file size (limit to 5MB)
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError("Image size should be less than 5MB")
        return
      }

      setLabReportImage(selectedFile)

      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setLabImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(selectedFile)
    }
  }

  // Add this function to handle diagnostic image selection
  const handleDiagnosticImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]

      // Check if file is an image
      if (!selectedFile.type.startsWith("image/")) {
        setError("Please select an image file")
        return
      }

      // Check file size (limit to 5MB)
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError("Image size should be less than 5MB")
        return
      }

      setDiagnosticReportImage(selectedFile)

      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setDiagnosticImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(selectedFile)
    }
  }

  if (!doctor) {
    return null
  }

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center py-24">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          <p className="text-muted-foreground">Loading patient data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4 py-6">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>

        <div className="flex justify-center">
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    )
  }

  if (!patient) {
    return (
      <div className="space-y-4 py-6">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Patient not found.</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => router.push("/doctor/dashboard/patients")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Patients
          </Button>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push(`/doctor/dashboard/schedule?patient=${patient.id}`)}>
            <Calendar className="h-4 w-4 mr-2" />
            Schedule Appointment
          </Button>
        </div>
      </div>

      {/* Patient Overview */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="flex flex-col items-center md:items-start gap-3">
              <Avatar className="h-24 w-24">
                {patient.profilePicture ? (
                  <AvatarImage src={patient.profilePicture} alt={patient.name} />
                ) : (
                  <AvatarFallback className="bg-purple-100 text-purple-600 text-2xl">
                    {patient.name.charAt(0)}
                  </AvatarFallback>
                )}
              </Avatar>

              <div className="text-center md:text-left">
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold">{patient.name}</h2>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingPatientInfo(true)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">Patient ID: {patient.id}</p>
              </div>
            </div>

            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Contact Information</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{patient.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{patient.phone || "No phone number"}</span>
                  </div>
                  {patient.address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{patient.address}</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Basic Information</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Age</p>
                    <p>{patient.age || "Not recorded"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Gender</p>
                    <p>{patient.gender || "Not recorded"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Blood Group</p>
                    <p>
                      {patient.medicalInfo?.bloodGroup === "not-specified"
                        ? "Not recorded"
                        : patient.medicalInfo?.bloodGroup || "Not recorded"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Registration Date</p>
                    <p>{patient.registrationDate ? formatDate(patient.registrationDate) : "Not recorded"}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Medical Summary</h3>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-xs text-muted-foreground">Allergies:</span>
                    <span className="text-xs font-medium">{patient.medicalInfo?.allergies?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-muted-foreground">Chronic Conditions:</span>
                    <span className="text-xs font-medium">{patient.medicalInfo?.chronicConditions?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-muted-foreground">Medications:</span>
                    <span className="text-xs font-medium">{patient.medicalInfo?.medications?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-muted-foreground">Past Appointments:</span>
                    <span className="text-xs font-medium">{getPastAppointments(patient.appointments).length}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Recent Activity</h3>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Last Visit</p>
                    <p>{patient.lastVisit ? formatDate(patient.lastVisit) : "No visits yet"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Next Appointment</p>
                    {patient.nextAppointment ? (
                      <p>
                        {formatDate(patient.nextAppointment.date)} at {patient.nextAppointment.time}
                      </p>
                    ) : (
                      <p>None scheduled</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Patient Info Dialog */}
      <Dialog open={editingPatientInfo} onOpenChange={setEditingPatientInfo}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Patient Information</DialogTitle>
            <DialogDescription>Update the patient's basic information.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Full Name</label>
              <Input
                value={patientInfoForm.name}
                onChange={(e) => setPatientInfoForm({ ...patientInfoForm, name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  value={patientInfoForm.email}
                  onChange={(e) => setPatientInfoForm({ ...patientInfoForm, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Phone</label>
                <Input
                  value={patientInfoForm.phone}
                  onChange={(e) => setPatientInfoForm({ ...patientInfoForm, phone: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Age</label>
                <Input
                  type="number"
                  value={patientInfoForm.age || ""}
                  onChange={(e) =>
                    setPatientInfoForm({
                      ...patientInfoForm,
                      age: e.target.value ? Number.parseInt(e.target.value) : undefined,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Gender</label>
                <Select
                  value={patientInfoForm.gender}
                  onValueChange={(value) => setPatientInfoForm({ ...patientInfoForm, gender: value })}
                >
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
              <Input
                value={patientInfoForm.address}
                onChange={(e) => setPatientInfoForm({ ...patientInfoForm, address: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingPatientInfo(false)}>
              Cancel
            </Button>
            <Button
              className="bg-purple-600 hover:bg-purple-700"
              onClick={handleSavePatientInfo}
              disabled={savingPatientInfo}
            >
              {savingPatientInfo && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Main Content Tabs */}
      <Tabs defaultValue="medical" className="w-full">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="medical">Medical Info</TabsTrigger>
          <TabsTrigger value="vitals">Vitals & Metrics</TabsTrigger>
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
          <TabsTrigger value="notes">Notes & Documents</TabsTrigger>
          <TabsTrigger value="reports">Lab & Diagnostics</TabsTrigger>
          <TabsTrigger value="risks">Risk Assessment</TabsTrigger>
          <TabsTrigger value="treatment">Treatment Plan</TabsTrigger>
          <TabsTrigger value="images">Medical Images</TabsTrigger>
        </TabsList>

        {/* Medical Information Tab - Update to include more comprehensive information */}
        <TabsContent value="medical" className="space-y-6 mt-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold">Medical Information</h3>
            {!editingMedicalInfo ? (
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setEditingMedicalInfo(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Medical Info
                </Button>
                <Button variant="outline" onClick={() => setEditingEmergencyContact(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Emergency Contact
                </Button>
                <Button variant="outline" onClick={() => setEditingInsurance(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Insurance
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setEditingMedicalInfo(false)}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  className="bg-purple-600 hover:bg-purple-700"
                  onClick={handleSaveMedicalInfo}
                  disabled={savingMedicalInfo}
                >
                  {savingMedicalInfo && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Emergency Contact */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Phone className="h-5 w-5 text-red-500" />
                  <CardTitle className="text-base">Emergency Contact</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {patient.medicalInfo?.emergencyContact ? (
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-muted-foreground">Name</p>
                      <p>{patient.medicalInfo.emergencyContact.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Phone</p>
                      <p>{patient.medicalInfo.emergencyContact.phone}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Relationship</p>
                      <p>{patient.medicalInfo.emergencyContact.relationship}</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground">No emergency contact recorded</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => setEditingEmergencyContact(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Emergency Contact
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Insurance Details */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-500" />
                  <CardTitle className="text-base">Insurance Details</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {patient.medicalInfo?.insuranceDetails ? (
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-muted-foreground">Provider</p>
                      <p>{patient.medicalInfo.insuranceDetails.provider}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Policy Number</p>
                      <p>{patient.medicalInfo.insuranceDetails.policyNumber}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Coverage Type</p>
                      <p>{patient.medicalInfo.insuranceDetails.coverageType}</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground">No insurance details recorded</p>
                    <Button variant="outline" size="sm" className="mt-2" onClick={() => setEditingInsurance(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Insurance Details
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Blood Group */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-red-500" />
                  <CardTitle className="text-base">Blood Group</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {editingMedicalInfo ? (
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
                ) : (
                  <p className="text-lg font-medium">
                    {patient.medicalInfo?.bloodGroup === "not-specified"
                      ? "Not recorded"
                      : patient.medicalInfo?.bloodGroup || "Not recorded"}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Allergies */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-amber-500" />
                  <CardTitle className="text-base">Allergies</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {editingMedicalInfo ? (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add allergy"
                        value={newAllergy}
                        onChange={(e) => setNewAllergy(e.target.value)}
                      />
                      <Button variant="outline" onClick={() => addItemToMedicalInfo("allergies", newAllergy)}>
                        Add
                      </Button>
                    </div>
                    <div className="space-y-1 mt-2 max-h-[200px] overflow-y-auto">
                      {medicalInfoForm.allergies && medicalInfoForm.allergies.length > 0 ? (
                        medicalInfoForm.allergies.map((allergy, index) => (
                          <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
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
                ) : (
                  <div className="max-h-[200px] overflow-y-auto">
                    {patient.medicalInfo?.allergies && patient.medicalInfo.allergies.length > 0 ? (
                      <ul className="list-disc pl-5 space-y-1">
                        {patient.medicalInfo.allergies.map((allergy, index) => (
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
              </CardContent>
            </Card>

            {/* Chronic Conditions */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-purple-500" />
                  <CardTitle className="text-base">Chronic Conditions</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {editingMedicalInfo ? (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add condition"
                        value={newCondition}
                        onChange={(e) => setNewCondition(e.target.value)}
                      />
                      <Button variant="outline" onClick={() => addItemToMedicalInfo("chronicConditions", newCondition)}>
                        Add
                      </Button>
                    </div>
                    <div className="space-y-1 mt-2 max-h-[200px] overflow-y-auto">
                      {medicalInfoForm.chronicConditions && medicalInfoForm.chronicConditions.length > 0 ? (
                        medicalInfoForm.chronicConditions.map((condition, index) => (
                          <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
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
                ) : (
                  <div className="max-h-[200px] overflow-y-auto">
                    {patient.medicalInfo?.chronicConditions && patient.medicalInfo.chronicConditions.length > 0 ? (
                      <ul className="list-disc pl-5 space-y-1">
                        {patient.medicalInfo.chronicConditions.map((condition, index) => (
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
              </CardContent>
            </Card>

            {/* Current Medications */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Pill className="h-5 w-5 text-blue-500" />
                  <CardTitle className="text-base">Current Medications</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {editingMedicalInfo ? (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add medication"
                        value={newMedication}
                        onChange={(e) => setNewMedication(e.target.value)}
                      />
                      <Button variant="outline" onClick={() => addItemToMedicalInfo("medications", newMedication)}>
                        Add
                      </Button>
                    </div>
                    <div className="space-y-1 mt-2 max-h-[200px] overflow-y-auto">
                      {medicalInfoForm.medications && medicalInfoForm.medications.length > 0 ? (
                        medicalInfoForm.medications.map((medication, index) => (
                          <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
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
                ) : (
                  <div className="max-h-[200px] overflow-y-auto">
                    {patient.medicalInfo?.medications && patient.medicalInfo.medications.length > 0 ? (
                      <ul className="list-disc pl-5 space-y-1">
                        {patient.medicalInfo.medications.map((medication, index) => (
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
              </CardContent>
            </Card>

            {/* Surgery History */}
            <Card className="md:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex items-center gap-2">
                  <Clipboard className="h-5 w-5 text-green-500" />
                  <CardTitle className="text-base">Surgery & Procedure History</CardTitle>
                </div>
                <Button variant="outline" size="sm" onClick={() => setEditingSurgeryHistory(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Surgery
                </Button>
              </CardHeader>
              <CardContent>
                {patient.medicalInfo?.surgeryHistory && patient.medicalInfo.surgeryHistory.length > 0 ? (
                  <div className="rounded-md border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Procedure</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Surgeon</TableHead>
                          <TableHead>Hospital</TableHead>
                          <TableHead>Outcome</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {patient.medicalInfo.surgeryHistory.map((surgery, index) => (
                          <TableRow key={index}>
                            <TableCell>{surgery.procedure}</TableCell>
                            <TableCell>{formatDate(surgery.date)}</TableCell>
                            <TableCell>{surgery.surgeon}</TableCell>
                            <TableCell>{surgery.hospital}</TableCell>
                            <TableCell>{surgery.outcome}</TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-red-500"
                                onClick={() => handleRemoveSurgery(index)}
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground">No surgery history recorded</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Medical History */}
            <Card className="md:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex items-center gap-2">
                  <Clipboard className="h-5 w-5 text-green-500" />
                  <CardTitle className="text-base">Medical History</CardTitle>
                </div>
                <Button variant="outline" size="sm" onClick={() => setEditingMedicalHistory(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </CardHeader>
              <CardContent>
                {editingMedicalHistory ? (
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add medical history item"
                        value={newMedicalHistoryItem}
                        onChange={(e) => setNewMedicalHistoryItem(e.target.value)}
                      />
                      <Button variant="outline" onClick={handleAddMedicalHistoryItem}>
                        Add
                      </Button>
                    </div>
                    <div className="space-y-1 mt-2 max-h-[200px] overflow-y-auto">
                      {medicalInfoForm.medicalHistory && medicalInfoForm.medicalHistory.length > 0 ? (
                        medicalInfoForm.medicalHistory.map((item, index) => (
                          <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                            <span>{item}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-red-500"
                              onClick={() => handleRemoveMedicalHistoryItem(index)}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">No medical history recorded</p>
                      )}
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setEditingMedicalHistory(false)}>
                        Cancel
                      </Button>
                      <Button className="bg-purple-600 hover:bg-purple-700" onClick={handleSaveMedicalHistory}>
                        Save Changes
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="max-h-[200px] overflow-y-auto">
                    {patient.medicalInfo?.medicalHistory && patient.medicalInfo.medicalHistory.length > 0 ? (
                      <ul className="list-disc pl-5 space-y-1">
                        {patient.medicalInfo.medicalHistory.map((item, index) => (
                          <li key={index} className="text-sm">
                            {item}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground">No medical history recorded</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Emergency Contact Dialog */}
          <Dialog open={editingEmergencyContact} onOpenChange={setEditingEmergencyContact}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Emergency Contact</DialogTitle>
                <DialogDescription>Add or update emergency contact information</DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Name</label>
                  <Input
                    placeholder="Full name"
                    value={emergencyContactForm.name}
                    onChange={(e) => setEmergencyContactForm({ ...emergencyContactForm, name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Phone Number</label>
                  <Input
                    placeholder="Phone number"
                    value={emergencyContactForm.phone}
                    onChange={(e) => setEmergencyContactForm({ ...emergencyContactForm, phone: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Relationship</label>
                  <Input
                    placeholder="e.g. Spouse, Parent, Child"
                    value={emergencyContactForm.relationship}
                    onChange={(e) => setEmergencyContactForm({ ...emergencyContactForm, relationship: e.target.value })}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setEditingEmergencyContact(false)}>
                  Cancel
                </Button>
                <Button
                  className="bg-purple-600 hover:bg-purple-700"
                  onClick={handleSaveEmergencyContact}
                  disabled={!emergencyContactForm.name || !emergencyContactForm.phone}
                >
                  Save Contact
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Insurance Details Dialog */}
          <Dialog open={editingInsurance} onOpenChange={setEditingInsurance}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Insurance Details</DialogTitle>
                <DialogDescription>Add or update insurance information</DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Insurance Provider</label>
                  <Input
                    placeholder="e.g. Blue Cross Blue Shield"
                    value={insuranceForm.provider}
                    onChange={(e) => setInsuranceForm({ ...insuranceForm, provider: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Policy Number</label>
                  <Input
                    placeholder="Policy number"
                    value={insuranceForm.policyNumber}
                    onChange={(e) => setInsuranceForm({ ...insuranceForm, policyNumber: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Coverage Type</label>
                  <Select
                    value={insuranceForm.coverageType}
                    onValueChange={(value) => setInsuranceForm({ ...insuranceForm, coverageType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select coverage type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Comprehensive">Comprehensive</SelectItem>
                      <SelectItem value="Basic">Basic</SelectItem>
                      <SelectItem value="Catastrophic">Catastrophic</SelectItem>
                      <SelectItem value="Medicare">Medicare</SelectItem>
                      <SelectItem value="Medicaid">Medicaid</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setEditingInsurance(false)}>
                  Cancel
                </Button>
                <Button
                  className="bg-purple-600 hover:bg-purple-700"
                  onClick={handleSaveInsurance}
                  disabled={!insuranceForm.provider || !insuranceForm.policyNumber}
                >
                  Save Insurance Details
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Surgery History Dialog */}
          <Dialog open={editingSurgeryHistory} onOpenChange={setEditingSurgeryHistory}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add Surgery</DialogTitle>
                <DialogDescription>Add a surgery or procedure to the patient's medical history</DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Procedure</label>
                  <Input
                    placeholder="e.g. Appendectomy"
                    value={surgeryForm.procedure}
                    onChange={(e) => setSurgeryForm({ ...surgeryForm, procedure: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Date</label>
                  <Input
                    type="date"
                    value={surgeryForm.date}
                    onChange={(e) => setSurgeryForm({ ...surgeryForm, date: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Surgeon</label>
                  <Input
                    placeholder="Surgeon's name"
                    value={surgeryForm.surgeon}
                    onChange={(e) => setSurgeryForm({ ...surgeryForm, surgeon: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Hospital</label>
                  <Input
                    placeholder="Hospital name"
                    value={surgeryForm.hospital}
                    onChange={(e) => setSurgeryForm({ ...surgeryForm, hospital: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Outcome</label>
                  <Input
                    placeholder="e.g. Successful, with complications"
                    value={surgeryForm.outcome}
                    onChange={(e) => setSurgeryForm({ ...surgeryForm, outcome: e.target.value })}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setEditingSurgeryHistory(false)}>
                  Cancel
                </Button>
                <Button
                  className="bg-purple-600 hover:bg-purple-700"
                  onClick={handleAddSurgery}
                  disabled={!surgeryForm.procedure || !surgeryForm.date}
                >
                  Add Surgery
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* Vitals & Metrics Tab */}
        <TabsContent value="vitals" className="space-y-6 mt-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold">Vitals & Metrics</h3>
            <Button
              variant="outline"
              onClick={() => setAddingVitals(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white hover:text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New Vitals
            </Button>
          </div>

          {/* Add Vitals Dialog */}
          <Dialog open={addingVitals} onOpenChange={setAddingVitals}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Vitals</DialogTitle>
                <DialogDescription>Record the patient's latest vital signs.</DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Date</label>
                  <Input
                    type="date"
                    value={newVitals.date}
                    onChange={(e) => setNewVitals({ ...newVitals, date: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Blood Pressure (mmHg)</label>
                    <Input
                      placeholder="e.g. 120/80"
                      value={newVitals.bloodPressure}
                      onChange={(e) => setNewVitals({ ...newVitals, bloodPressure: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Heart Rate (bpm)</label>
                    <Input
                      type="number"
                      placeholder="e.g. 72"
                      value={newVitals.heartRate || ""}
                      onChange={(e) =>
                        setNewVitals({
                          ...newVitals,
                          heartRate: e.target.value ? Number.parseInt(e.target.value) : undefined,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Temperature (°C)</label>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="e.g. 37.0"
                      value={newVitals.temperature || ""}
                      onChange={(e) =>
                        setNewVitals({
                          ...newVitals,
                          temperature: e.target.value ? Number.parseFloat(e.target.value) : undefined,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Respiratory Rate (breaths/min)</label>
                    <Input
                      type="number"
                      placeholder="e.g. 16"
                      value={newVitals.respiratoryRate || ""}
                      onChange={(e) =>
                        setNewVitals({
                          ...newVitals,
                          respiratoryRate: e.target.value ? Number.parseInt(e.target.value) : undefined,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Oxygen Saturation (%)</label>
                    <Input
                      type="number"
                      placeholder="e.g. 98"
                      value={newVitals.oxygenSaturation || ""}
                      onChange={(e) =>
                        setNewVitals({
                          ...newVitals,
                          oxygenSaturation: e.target.value ? Number.parseInt(e.target.value) : undefined,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Weight (kg)</label>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="e.g. 70.5"
                      value={newVitals.weight || ""}
                      onChange={(e) =>
                        setNewVitals({
                          ...newVitals,
                          weight: e.target.value ? Number.parseFloat(e.target.value) : undefined,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Height (cm)</label>
                  <Input
                    type="number"
                    placeholder="e.g. 175"
                    value={newVitals.height || ""}
                    onChange={(e) =>
                      setNewVitals({
                        ...newVitals,
                        height: e.target.value ? Number.parseInt(e.target.value) : undefined,
                      })
                    }
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setAddingVitals(false)}>
                  Cancel
                </Button>
                <Button className="bg-purple-600 hover:bg-purple-700" onClick={handleAddVitals}>
                  Save Vitals
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Vitals History */}
          <div className="space-y-4">
            {patient.medicalInfo?.vitals && patient.medicalInfo.vitals.length > 0 ? (
              <div className="space-y-6">
                {/* Latest Vitals */}
                <Card>
                  <CardHeader>
                    <CardTitle>Latest Vitals - {formatDate(patient.medicalInfo.vitals[0].date)}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <Heart className="h-4 w-4 text-blue-600" />
                          <p className="text-sm font-medium text-blue-600">Blood Pressure</p>
                        </div>
                        <p className="text-2xl font-bold">{patient.medicalInfo.vitals[0].bloodPressure || "N/A"}</p>
                        <p className="text-xs text-muted-foreground">mmHg</p>
                      </div>

                      <div className="bg-red-50 p-4 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <Activity className="h-4 w-4 text-red-600" />
                          <p className="text-sm font-medium text-red-600">Heart Rate</p>
                        </div>
                        <p className="text-2xl font-bold">{patient.medicalInfo.vitals[0].heartRate || "N/A"}</p>
                        <p className="text-xs text-muted-foreground">bpm</p>
                      </div>

                      <div className="bg-amber-50 p-4 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <Thermometer className="h-4 w-4 text-amber-600" />
                          <p className="text-sm font-medium text-amber-600">Temperature</p>
                        </div>
                        <p className="text-2xl font-bold">{patient.medicalInfo.vitals[0].temperature || "N/A"}</p>
                        <p className="text-xs text-muted-foreground">°C</p>
                      </div>

                      <div className="bg-green-50 p-4 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <Activity className="h-4 w-4 text-green-600" />
                          <p className="text-sm font-medium text-green-600">Oxygen Saturation</p>
                        </div>
                        <p className="text-2xl font-bold">{patient.medicalInfo.vitals[0].oxygenSaturation || "N/A"}</p>
                        <p className="text-xs text-muted-foreground">%</p>
                      </div>

                      <div className="bg-purple-50 p-4 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <Activity className="h-4 w-4 text-purple-600" />
                          <p className="text-sm font-medium text-purple-600">Respiratory Rate</p>
                        </div>
                        <p className="text-2xl font-bold">{patient.medicalInfo.vitals[0].respiratoryRate || "N/A"}</p>
                        <p className="text-xs text-muted-foreground">breaths/min</p>
                      </div>

                      <div className="bg-indigo-50 p-4 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <Weight className="h-4 w-4 text-indigo-600" />
                          <p className="text-sm font-medium text-indigo-600">Weight</p>
                        </div>
                        <p className="text-2xl font-bold">{patient.medicalInfo.vitals[0].weight || "N/A"}</p>
                        <p className="text-xs text-muted-foreground">kg</p>
                      </div>

                      <div className="bg-teal-50 p-4 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <Ruler className="h-4 w-4 text-teal-600" />
                          <p className="text-sm font-medium text-teal-600">Height</p>
                        </div>
                        <p className="text-2xl font-bold">{patient.medicalInfo.vitals[0].height || "N/A"}</p>
                        <p className="text-xs text-muted-foreground">cm</p>
                      </div>

                      {patient.medicalInfo.vitals[0].weight && patient.medicalInfo.vitals[0].height && (
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <Activity className="h-4 w-4 text-gray-600" />
                            <p className="text-sm font-medium text-gray-600">BMI</p>
                          </div>
                          <p className="text-2xl font-bold">
                            {(
                              patient.medicalInfo.vitals[0].weight /
                              Math.pow(patient.medicalInfo.vitals[0].height / 100, 2)
                            ).toFixed(1)}
                          </p>
                          <p className="text-xs text-muted-foreground">kg/m²</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Vitals History Table */}
                <Card>
                  <CardHeader>
                    <CardTitle>Vitals History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-md border overflow-hidden">
                      <div className="max-h-[400px] overflow-y-auto">
                        <Table>
                          <TableHeader className="sticky top-0 bg-white z-10">
                            <TableRow>
                              <TableHead>Date</TableHead>
                              <TableHead>Blood Pressure</TableHead>
                              <TableHead>Heart Rate</TableHead>
                              <TableHead>Temperature</TableHead>
                              <TableHead>Oxygen</TableHead>
                              <TableHead>Respiratory</TableHead>
                              <TableHead>Weight</TableHead>
                              <TableHead>Height</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {patient.medicalInfo.vitals.map((vital, index) => (
                              <TableRow key={index}>
                                <TableCell>{formatDate(vital.date)}</TableCell>
                                <TableCell>{vital.bloodPressure || "N/A"}</TableCell>
                                <TableCell>{vital.heartRate || "N/A"}</TableCell>
                                <TableCell>{vital.temperature || "N/A"}</TableCell>
                                <TableCell>{vital.oxygenSaturation || "N/A"}%</TableCell>
                                <TableCell>{vital.respiratoryRate || "N/A"}</TableCell>
                                <TableCell>{vital.weight || "N/A"}</TableCell>
                                <TableCell>{vital.height || "N/A"}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <Activity className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
                  <p className="mt-2 text-muted-foreground">No vitals history available</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Record the patient's vital signs to track their health over time
                  </p>
                  <Button onClick={() => setAddingVitals(true)} className="bg-purple-600 hover:bg-purple-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Vitals
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Appointments Tab */}
        <TabsContent value="appointments" className="space-y-6 mt-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold">Appointment History</h3>
            <Button
              className="bg-purple-600 hover:bg-purple-700"
              onClick={() => router.push(`/doctor/dashboard/schedule?patient=${patient.id}`)}
            >
              <Calendar className="h-4 w-4 mr-2" />
              Schedule New Appointment
            </Button>
          </div>

          {patient.appointments && patient.appointments.length > 0 ? (
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
                        {getUpcomingAppointments(patient.appointments).length > 0 ? (
                          getUpcomingAppointments(patient.appointments).map((appointment) => (
                            <TableRow key={appointment.id}>
                              <TableCell>
                                <div className="space-y-1">
                                  <p className="font-medium">{formatDate(appointment.date)}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {appointment.startTime} - {appointment.endTime}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell className="capitalize">{appointment.type.replace("-", " ")}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className={getAppointmentStatusColor(appointment.status)}>
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
                                        <DropdownMenuItem className="text-red-600">Cancel Appointment</DropdownMenuItem>
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
                        {getPastAppointments(patient.appointments).length > 0 ? (
                          getPastAppointments(patient.appointments).map((appointment) => (
                            <TableRow key={appointment.id}>
                              <TableCell>
                                <div className="space-y-1">
                                  <p className="font-medium">{formatDate(appointment.date)}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {appointment.startTime} - {appointment.endTime}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell className="capitalize">{appointment.type.replace("-", " ")}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className={getAppointmentStatusColor(appointment.status)}>
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
                <p className="text-sm text-muted-foreground mb-4">This patient hasn't scheduled any appointments yet</p>
                <Button
                  className="bg-purple-600 hover:bg-purple-700"
                  onClick={() => router.push(`/doctor/dashboard/schedule?patient=${patient.id}`)}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule First Appointment
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Notes & Documents Tab */}
        <TabsContent value="notes" className="space-y-6 mt-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold">Medical Notes & Documents</h3>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Notes Section */}
            <Card>
              <CardHeader>
                <CardTitle>Medical Notes</CardTitle>
                <CardDescription>Clinical observations and treatment notes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="max-h-[500px] overflow-y-auto pr-1">
                  {patient.notes && patient.notes.length > 0 ? (
                    <div className="space-y-4">
                      {patient.notes.map((note, index) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="text-sm font-medium">{note.createdBy || "Doctor"}</p>
                              <p className="text-xs text-muted-foreground">{formatDate(note.createdAt)}</p>
                            </div>
                          </div>
                          <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
                      <p className="mt-2 text-muted-foreground">No medical notes available</p>
                      <Button variant="outline" size="sm" className="mt-4" onClick={() => setIsAddNoteOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add First Note
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Documents Section */}
            <Card>
              <CardHeader>
                <CardTitle>Medical Documents</CardTitle>
                <CardDescription>Test results, reports, and other documents</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="max-h-[500px] overflow-y-auto pr-1">
                  {patient.documents && patient.documents.length > 0 ? (
                    <div className="space-y-4">
                      {patient.documents.map((doc, index) => (
                        <div key={index} className="border rounded-lg p-4">
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
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Upload className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
                      <p className="mt-2 text-muted-foreground">No documents available</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-4"
                        onClick={() => setIsUploadDocumentOpen(true)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Upload First Document
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

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
                  <p className="text-xs text-muted-foreground">
                    Supported formats: PDF, JPG, PNG, DOC, DOCX (Max 10MB)
                  </p>
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
        </TabsContent>

        {/* Lab & Diagnostics Tab */}
        <TabsContent value="reports" className="space-y-6 mt-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold">Lab & Diagnostic Reports</h3>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setEditingLabReports(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Lab Report
              </Button>
              <Button variant="outline" onClick={() => setEditingDiagnosticReports(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Diagnostic Report
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Lab Reports Section */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Lab Reports</CardTitle>
                <CardDescription>Blood tests, urine tests, and other laboratory results</CardDescription>
              </CardHeader>
              <CardContent>
                {patient.medicalInfo?.labReports && patient.medicalInfo.labReports.length > 0 ? (
                  <div className="space-y-6">
                    {patient.medicalInfo.labReports.map((report, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className="font-medium">{report.type}</h4>
                            <p className="text-sm text-muted-foreground">Date: {formatDate(report.date)}</p>
                          </div>
                          {report.documentUrl && (
                            <Button variant="outline" size="sm" asChild>
                              <a href={report.documentUrl} target="_blank" rel="noopener noreferrer">
                                View Full Report
                              </a>
                            </Button>
                          )}
                        </div>

                        <div className="rounded-md border overflow-hidden">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Test</TableHead>
                                <TableHead>Result</TableHead>
                                <TableHead>Normal Range</TableHead>
                                <TableHead>Status</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {report.results.map((result, resultIndex) => (
                                <TableRow key={resultIndex}>
                                  <TableCell>{result.name}</TableCell>
                                  <TableCell>{result.value}</TableCell>
                                  <TableCell>{result.normalRange || "N/A"}</TableCell>
                                  <TableCell>
                                    {result.isAbnormal ? (
                                      <Badge variant="outline" className="bg-red-100 text-red-800">
                                        Abnormal
                                      </Badge>
                                    ) : (
                                      <Badge variant="outline" className="bg-green-100 text-green-800">
                                        Normal
                                      </Badge>
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>

                        {report.summary && (
                          <div className="mt-4">
                            <h5 className="text-sm font-medium mb-1">Summary</h5>
                            <p className="text-sm">{report.summary}</p>
                          </div>
                        )}
                        {report.documentUrl && (
                          <div className="mt-4">
                            <h5 className="text-sm font-medium mb-1">Report Image</h5>
                            <div className="aspect-video w-full max-h-[200px] relative rounded-lg overflow-hidden border border-gray-200">
                              <Image
                                src={report.documentUrl || "/placeholder.svg"}
                                alt={report.type}
                                fill
                                className="object-contain"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Activity className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
                    <p className="mt-2 text-muted-foreground">No lab reports available</p>
                    <Button variant="outline" size="sm" className="mt-4" onClick={() => setEditingLabReports(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Lab Report
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Diagnostic Reports Section */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Diagnostic Reports</CardTitle>
                <CardDescription>X-rays, MRIs, CT scans, ultrasounds, and other diagnostic tests</CardDescription>
              </CardHeader>
              <CardContent>
                {patient.medicalInfo?.diagnosticReports && patient.medicalInfo.diagnosticReports.length > 0 ? (
                  <div className="space-y-4">
                    {patient.medicalInfo.diagnosticReports.map((report, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{report.type}</h4>
                            <p className="text-sm text-muted-foreground">Date: {formatDate(report.date)}</p>
                          </div>
                          {report.documentUrl && (
                            <Button variant="outline" size="sm" asChild>
                              <a href={report.documentUrl} target="_blank" rel="noopener noreferrer">
                                View Image/Report
                              </a>
                            </Button>
                          )}
                        </div>
                        <div className="mt-2">
                          <h5 className="text-sm font-medium mb-1">Findings</h5>
                          <p className="text-sm">{report.findings}</p>
                        </div>
                        {report.documentUrl && (
                          <div className="mt-4">
                            <div className="aspect-video w-full max-h-[200px] relative rounded-lg overflow-hidden border border-gray-200">
                              <Image
                                src={report.documentUrl || "/placeholder.svg"}
                                alt={report.type}
                                fill
                                className="object-contain"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Activity className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
                    <p className="mt-2 text-muted-foreground">No diagnostic reports available</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4"
                      onClick={() => setEditingDiagnosticReports(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Diagnostic Report
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Add Lab Report Dialog */}
          <Dialog open={editingLabReports} onOpenChange={setEditingLabReports}>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Add Lab Report</DialogTitle>
                <DialogDescription>Add a new laboratory test report to the patient's record</DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Report Type</label>
                    <Input
                      placeholder="e.g. Complete Blood Count"
                      value={labReportForm.type}
                      onChange={(e) => setLabReportForm({ ...labReportForm, type: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Date</label>
                    <Input
                      type="date"
                      value={labReportForm.date}
                      onChange={(e) => setLabReportForm({ ...labReportForm, date: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Test Results</label>
                  <div className="space-y-2">
                    <div className="grid grid-cols-4 gap-2">
                      <Input
                        placeholder="Test name"
                        value={newLabResult.name}
                        onChange={(e) => setNewLabResult({ ...newLabResult, name: e.target.value })}
                      />
                      <Input
                        placeholder="Value"
                        value={newLabResult.value}
                        onChange={(e) => setNewLabResult({ ...newLabResult, value: e.target.value })}
                      />
                      <Input
                        placeholder="Normal range"
                        value={newLabResult.normalRange || ""}
                        onChange={(e) => setNewLabResult({ ...newLabResult, normalRange: e.target.value })}
                      />
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="isAbnormal"
                          checked={newLabResult.isAbnormal}
                          onChange={(e) => setNewLabResult({ ...newLabResult, isAbnormal: e.target.checked })}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                        <label htmlFor="isAbnormal" className="text-sm">
                          Abnormal
                        </label>
                        <Button variant="outline" size="sm" onClick={handleAddLabResult}>
                          Add
                        </Button>
                      </div>
                    </div>
                  </div>

                  {labReportForm.results.length > 0 && (
                    <div className="mt-2 rounded-md border overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Test</TableHead>
                            <TableHead>Value</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {labReportForm.results.map((result, index) => (
                            <TableRow key={index}>
                              <TableCell>{result.name}</TableCell>
                              <TableCell>{result.value}</TableCell>
                              <TableCell>
                                {result.isAbnormal ? (
                                  <Badge variant="outline" className="bg-red-100 text-red-800">
                                    Abnormal
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="bg-green-100 text-green-800">
                                    Normal
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-red-500"
                                  onClick={() => handleRemoveLabResult(index)}
                                >
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Summary</label>
                  <Textarea
                    placeholder="Enter a summary of the lab report findings"
                    value={labReportForm.summary}
                    onChange={(e) => setLabReportForm({ ...labReportForm, summary: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Image (Optional)</label>
                  {!labImagePreview ? (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleLabImageChange}
                        className="hidden"
                        id="lab-image-upload"
                      />
                      <label
                        htmlFor="lab-image-upload"
                        className="flex flex-col items-center justify-center cursor-pointer"
                      >
                        <Upload className="h-6 w-6 text-gray-400 mb-2" />
                        <p className="text-xs text-gray-500">Click to upload an image of the lab report</p>
                      </label>
                    </div>
                  ) : (
                    <div className="relative">
                      <div className="aspect-video w-full relative rounded-lg overflow-hidden border border-gray-200">
                        <Image
                          src={labImagePreview || "/placeholder.svg"}
                          alt="Preview"
                          fill
                          className="object-contain"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-8 w-8 rounded-full"
                        onClick={() => {
                          setLabReportImage(null)
                          setLabImagePreview(null)
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditingLabReports(false)
                    setLabReportImage(null)
                    setLabImagePreview(null)
                  }}
                >
                  Cancel
                </Button>
                <Button
                  className="bg-purple-600 hover:bg-purple-700"
                  onClick={handleAddLabReport}
                  disabled={!labReportForm.type || labReportForm.results.length === 0 || uploadingLabImage}
                >
                  {uploadingLabImage && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {uploadingLabImage ? "Uploading Image..." : "Save Lab Report"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Add Diagnostic Report Dialog */}
          <Dialog open={editingDiagnosticReports} onOpenChange={setEditingDiagnosticReports}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add Diagnostic Report</DialogTitle>
                <DialogDescription>Add a new diagnostic test or imaging report</DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Report Type</label>
                    <Input
                      placeholder="e.g. Chest X-Ray"
                      value={diagnosticReportForm.type}
                      onChange={(e) => setDiagnosticReportForm({ ...diagnosticReportForm, type: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Date</label>
                    <Input
                      type="date"
                      value={diagnosticReportForm.date}
                      onChange={(e) => setDiagnosticReportForm({ ...diagnosticReportForm, date: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Findings</label>
                  <Textarea
                    placeholder="Enter the diagnostic findings"
                    value={diagnosticReportForm.findings}
                    onChange={(e) => setDiagnosticReportForm({ ...diagnosticReportForm, findings: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Image (Optional)</label>
                  {!diagnosticImagePreview ? (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleDiagnosticImageChange}
                        className="hidden"
                        id="diagnostic-image-upload"
                      />
                      <label
                        htmlFor="diagnostic-image-upload"
                        className="flex flex-col items-center justify-center cursor-pointer"
                      >
                        <Upload className="h-6 w-6 text-gray-400 mb-2" />
                        <p className="text-xs text-gray-500">Click to upload an image</p>
                      </label>
                    </div>
                  ) : (
                    <div className="relative">
                      <div className="aspect-video w-full relative rounded-lg overflow-hidden border border-gray-200">
                        <Image
                          src={diagnosticImagePreview || "/placeholder.svg"}
                          alt="Preview"
                          fill
                          className="object-contain"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-8 w-8 rounded-full"
                        onClick={() => {
                          setDiagnosticReportImage(null)
                          setDiagnosticImagePreview(null)
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditingDiagnosticReports(false)
                    setDiagnosticReportImage(null)
                    setDiagnosticImagePreview(null)
                  }}
                >
                  Cancel
                </Button>
                <Button
                  className="bg-purple-600 hover:bg-purple-700"
                  onClick={handleAddDiagnosticReport}
                  disabled={!diagnosticReportForm.type || !diagnosticReportForm.findings || uploadingDiagnosticImage}
                >
                  {uploadingDiagnosticImage && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {uploadingDiagnosticImage ? "Uploading Image..." : "Save Report"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* Risk Assessment Tab */}
        <TabsContent value="risks" className="space-y-6 mt-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold">Risk Assessment & Management</h3>
            <Button variant="outline" onClick={() => setEditingRiskAssessment(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Risk Assessment
            </Button>
          </div>

          <div className="space-y-6">
            {/* Risk Assessments */}
            <Card>
              <CardHeader>
                <CardTitle>Disease Risk Assessments</CardTitle>
                <CardDescription>Evaluation of patient's risk for various health conditions</CardDescription>
              </CardHeader>
              <CardContent>
                {patient.medicalInfo?.riskAssessments && patient.medicalInfo.riskAssessments.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {patient.medicalInfo.riskAssessments.map((risk, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium">{risk.condition}</h4>
                          <Badge
                            variant="outline"
                            className={
                              risk.riskLevel === "High"
                                ? "bg-red-100 text-red-800"
                                : risk.riskLevel === "Medium"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-green-100 text-green-800"
                            }
                          >
                            {risk.riskLevel} Risk
                          </Badge>
                        </div>

                        <div className="space-y-2 mt-2">
                          <div>
                            <p className="text-xs text-muted-foreground">Probability</p>
                            <p className="text-sm">{risk.probability}%</p>
                          </div>

                          <div>
                            <p className="text-xs text-muted-foreground">Risk Factors</p>
                            <ul className="list-disc pl-5 text-sm">
                              {risk.factors.map((factor, factorIndex) => (
                                <li key={factorIndex}>{factor}</li>
                              ))}
                            </ul>
                          </div>

                          <div>
                            <p className="text-xs text-muted-foreground">Recommendations</p>
                            <ul className="list-disc pl-5 text-sm">
                              {risk.recommendations.map((rec, recIndex) => (
                                <li key={recIndex}>{rec}</li>
                              ))}
                            </ul>
                          </div>

                          <div>
                            <p className="text-xs text-muted-foreground">Last Assessed</p>
                            <p className="text-sm">{formatDate(risk.lastAssessed)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
                    <p className="mt-2 text-muted-foreground">No risk assessments available</p>
                    <Button variant="outline" size="sm" className="mt-4" onClick={() => setEditingRiskAssessment(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Risk Assessment
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Allergy Management */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Allergy Management</CardTitle>
                  <CardDescription>Tracking and management of allergic conditions</CardDescription>
                </div>
                {patient.medicalInfo?.allergyManagement && (
                  <Button variant="outline" size="sm" onClick={() => setEditingAllergyManagement(true)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {patient.medicalInfo?.allergyManagement ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="border rounded-lg p-4">
                        <h4 className="text-sm font-medium mb-2">Severity</h4>
                        <p>{patient.medicalInfo.allergyManagement.severity || "Not specified"}</p>
                      </div>

                      <div className="border rounded-lg p-4">
                        <h4 className="text-sm font-medium mb-2">Frequency</h4>
                        <p>{patient.medicalInfo.allergyManagement.frequency || "Not specified"}</p>
                      </div>

                      <div className="border rounded-lg p-4">
                        <h4 className="text-sm font-medium mb-2">Emergency Plan</h4>
                        <p>{patient.medicalInfo.allergyManagement.emergencyPlan || "No emergency plan specified"}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Recent Reactions</h4>
                      {patient.medicalInfo.allergyManagement.recentReactions &&
                      patient.medicalInfo.allergyManagement.recentReactions.length > 0 ? (
                        <div className="rounded-md border overflow-hidden">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Treatment</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {patient.medicalInfo.allergyManagement.recentReactions.map((reaction, index) => (
                                <TableRow key={index}>
                                  <TableCell>{formatDate(reaction.date)}</TableCell>
                                  <TableCell>{reaction.description}</TableCell>
                                  <TableCell>{reaction.treatment}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No recent reactions recorded</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Preventive Measures</h4>
                      {patient.medicalInfo.allergyManagement.preventiveMeasures &&
                      patient.medicalInfo.allergyManagement.preventiveMeasures.length > 0 ? (
                        <ul className="list-disc pl-5">
                          {patient.medicalInfo.allergyManagement.preventiveMeasures.map((measure, index) => (
                            <li key={index}>{measure}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-muted-foreground">No preventive measures recorded</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
                    <p className="mt-2 text-muted-foreground">No allergy management plan available</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4"
                      onClick={() => setEditingAllergyManagement(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Allergy Management Plan
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Add Risk Assessment Dialog */}
          <Dialog open={editingRiskAssessment} onOpenChange={setEditingRiskAssessment}>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Add Risk Assessment</DialogTitle>
                <DialogDescription>Evaluate the patient's risk for a specific health condition</DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Condition</label>
                    <Input
                      placeholder="e.g. Type 2 Diabetes"
                      value={riskAssessmentForm.condition}
                      onChange={(e) => setRiskAssessmentForm({ ...riskAssessmentForm, condition: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Risk Level</label>
                    <Select
                      value={riskAssessmentForm.riskLevel}
                      onValueChange={(value: "Low" | "Medium" | "High") =>
                        setRiskAssessmentForm({ ...riskAssessmentForm, riskLevel: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select risk level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Low">Low</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="High">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Probability (%)</label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="e.g. 65"
                    value={riskAssessmentForm.probability || ""}
                    onChange={(e) =>
                      setRiskAssessmentForm({
                        ...riskAssessmentForm,
                        probability: e.target.value ? Number(e.target.value) : 0,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Risk Factors</label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add risk factor"
                      value={newRiskFactor}
                      onChange={(e) => setNewRiskFactor(e.target.value)}
                    />
                    <Button variant="outline" onClick={handleAddRiskFactor}>
                      Add
                    </Button>
                  </div>
                  <div className="space-y-1 mt-2 max-h-[100px] overflow-y-auto">
                    {riskAssessmentForm.factors.length > 0 ? (
                      riskAssessmentForm.factors.map((factor, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                          <span>{factor}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-red-500"
                            onClick={() => {
                              const updatedFactors = [...riskAssessmentForm.factors]
                              updatedFactors.splice(index, 1)
                              setRiskAssessmentForm({ ...riskAssessmentForm, factors: updatedFactors })
                            }}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No risk factors added</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Recommendations</label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add recommendation"
                      value={newRecommendation}
                      onChange={(e) => setNewRecommendation(e.target.value)}
                    />
                    <Button variant="outline" onClick={handleAddRecommendation}>
                      Add
                    </Button>
                  </div>
                  <div className="space-y-1 mt-2 max-h-[100px] overflow-y-auto">
                    {riskAssessmentForm.recommendations.length > 0 ? (
                      riskAssessmentForm.recommendations.map((rec, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                          <span>{rec}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-red-500"
                            onClick={() => {
                              const updatedRecs = [...riskAssessmentForm.recommendations]
                              updatedRecs.splice(index, 1)
                              setRiskAssessmentForm({ ...riskAssessmentForm, recommendations: updatedRecs })
                            }}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No recommendations added</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Last Assessed</label>
                  <Input
                    type="date"
                    value={riskAssessmentForm.lastAssessed}
                    onChange={(e) => setRiskAssessmentForm({ ...riskAssessmentForm, lastAssessed: e.target.value })}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setEditingRiskAssessment(false)}>
                  Cancel
                </Button>
                <Button
                  className="bg-purple-600 hover:bg-purple-700"
                  onClick={handleAddRiskAssessment}
                  disabled={!riskAssessmentForm.condition}
                >
                  Save Risk Assessment
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Edit Allergy Management Dialog */}
          <Dialog open={editingAllergyManagement} onOpenChange={setEditingAllergyManagement}>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Allergy Management Plan</DialogTitle>
                <DialogDescription>Create or update the patient's allergy management plan</DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Severity</label>
                    <Select
                      value={allergyManagementForm.severity}
                      onValueChange={(value) => setAllergyManagementForm({ ...allergyManagementForm, severity: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select severity" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Mild">Mild</SelectItem>
                        <SelectItem value="Moderate">Moderate</SelectItem>
                        <SelectItem value="Severe">Severe</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Frequency</label>
                    <Select
                      value={allergyManagementForm.frequency}
                      onValueChange={(value) =>
                        setAllergyManagementForm({ ...allergyManagementForm, frequency: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Rare">Rare</SelectItem>
                        <SelectItem value="Occasional">Occasional</SelectItem>
                        <SelectItem value="Frequent">Frequent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Emergency Plan</label>
                  <Textarea
                    placeholder="Describe the emergency action plan for severe allergic reactions"
                    value={allergyManagementForm.emergencyPlan}
                    onChange={(e) =>
                      setAllergyManagementForm({ ...allergyManagementForm, emergencyPlan: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Recent Reactions</label>
                  <div className="space-y-2">
                    <div className="grid grid-cols-3 gap-2">
                      <Input
                        type="date"
                        value={newReaction.date}
                        onChange={(e) => setNewReaction({ ...newReaction, date: e.target.value })}
                      />
                      <Input
                        placeholder="Description"
                        value={newReaction.description}
                        onChange={(e) => setNewReaction({ ...newReaction, description: e.target.value })}
                      />
                      <div className="flex gap-2">
                        <Input
                          placeholder="Treatment"
                          value={newReaction.treatment}
                          onChange={(e) => setNewReaction({ ...newReaction, treatment: e.target.value })}
                        />
                        <Button variant="outline" size="icon" onClick={handleAddReaction}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {allergyManagementForm.recentReactions.length > 0 && (
                    <div className="mt-2 rounded-md border overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Treatment</TableHead>
                            <TableHead></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {allergyManagementForm.recentReactions.map((reaction, index) => (
                            <TableRow key={index}>
                              <TableCell>{formatDate(reaction.date)}</TableCell>
                              <TableCell>{reaction.description}</TableCell>
                              <TableCell>{reaction.treatment}</TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-red-500"
                                  onClick={() => {
                                    const updatedReactions = [...allergyManagementForm.recentReactions]
                                    updatedReactions.splice(index, 1)
                                    setAllergyManagementForm({
                                      ...allergyManagementForm,
                                      recentReactions: updatedReactions,
                                    })
                                  }}
                                >
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Preventive Measures</label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add preventive measure"
                      value={newPreventiveMeasure}
                      onChange={(e) => setNewPreventiveMeasure(e.target.value)}
                    />
                    <Button variant="outline" onClick={handleAddPreventiveMeasure}>
                      Add
                    </Button>
                  </div>
                  <div className="space-y-1 mt-2 max-h-[100px] overflow-y-auto">
                    {allergyManagementForm.preventiveMeasures.length > 0 ? (
                      allergyManagementForm.preventiveMeasures.map((measure, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                          <span>{measure}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-red-500"
                            onClick={() => {
                              const updatedMeasures = [...allergyManagementForm.preventiveMeasures]
                              updatedMeasures.splice(index, 1)
                              setAllergyManagementForm({
                                ...allergyManagementForm,
                                preventiveMeasures: updatedMeasures,
                              })
                            }}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No preventive measures added</p>
                    )}
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setEditingAllergyManagement(false)}>
                  Cancel
                </Button>
                <Button className="bg-purple-600 hover:bg-purple-700" onClick={handleSaveAllergyManagement}>
                  Save Allergy Management Plan
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* Treatment Plan Tab */}
        <TabsContent value="treatment" className="space-y-6 mt-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold">Treatment Plan</h3>
            {!editingTreatmentPlan ? (
              <Button variant="outline" onClick={() => setEditingTreatmentPlan(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Treatment Plan
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setEditingTreatmentPlan(false)}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  className="bg-purple-600 hover:bg-purple-700"
                  onClick={handleSaveTreatmentPlan}
                  disabled={savingTreatmentPlan}
                >
                  {savingTreatmentPlan && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  <Save className="h-4 w-4 mr-2" />
                  Save Plan
                </Button>
              </div>
            )}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Current Treatment Plan</CardTitle>
              <CardDescription>Comprehensive plan for managing the patient's health</CardDescription>
            </CardHeader>
            <CardContent>
              {editingTreatmentPlan ? (
                <Textarea
                  placeholder="Enter the treatment plan for this patient..."
                  className="min-h-[300px]"
                  value={treatmentPlan}
                  onChange={(e) => setTreatmentPlan(e.target.value)}
                />
              ) : treatmentPlan ? (
                <div className="prose max-w-none">
                  <div className="whitespace-pre-wrap">{treatmentPlan}</div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clipboard className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
                  <p className="mt-2 text-muted-foreground">No treatment plan available</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Create a comprehensive treatment plan for this patient
                  </p>
                  <Button variant="outline" onClick={() => setEditingTreatmentPlan(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Treatment Plan
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Medical Images Tab */}
        <TabsContent value="images" className="space-y-6 mt-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold">Medical Images</h3>
            <Button
              variant="outline"
              onClick={() => setIsUploadImageOpen(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white hover:text-white"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Medical Image
            </Button>
          </div>

          <MedicalImageGallery
            patientId={patient.id}
            images={patient.medicalImages || []}
            onDelete={(imageId) => {
              // Update the patient state by removing the deleted image
              if (patient && patient.medicalImages) {
                const updatedImages = patient.medicalImages.filter((img) => img.id !== imageId)
                setPatient({
                  ...patient,
                  medicalImages: updatedImages,
                })
              }
            }}
          />

          {/* Upload Image Dialog */}
          <Dialog open={isUploadImageOpen} onOpenChange={setIsUploadImageOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Upload Medical Image</DialogTitle>
                <DialogDescription>Upload a medical image for this patient's record</DialogDescription>
              </DialogHeader>

              <MedicalImageUploader
                patientId={patient.id}
                doctorId={doctor?.id || ""}
                doctorName={doctor?.name || "Doctor"}
                onSuccess={(newImage) => {
                  // Update the patient state with the new image
                  const updatedImages = [...(patient.medicalImages || []), newImage]
                  setPatient({
                    ...patient,
                    medicalImages: updatedImages,
                  })
                  setIsUploadImageOpen(false)
                }}
                onCancel={() => setIsUploadImageOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>
    </div>
  )
}


"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Download,
  FileText,
  Filter,
  Pill,
  Search,
  Syringe,
  TestTube,
  Upload,
  AlertCircle,
  Loader2,
  BarChart,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import { uploadPatientDocument } from "@/lib/patient-firebase"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"
import { storage, db } from "@/lib/firebase"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { collection, addDoc, doc, updateDoc, arrayUnion } from "firebase/firestore"

export default function MedicalRecordsPage() {
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedReport, setSelectedReport] = useState<any>(null)
  const [isReportOpen, setIsReportOpen] = useState(false)
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const isMobile = useMobile()

  // Add new state variables for Firebase data
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [documentFile, setDocumentFile] = useState<File | null>(null)
  const [documentName, setDocumentName] = useState("")
  const [documentType, setDocumentType] = useState("lab-report")
  const [uploadingDocument, setUploadingDocument] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [documentDate, setDocumentDate] = useState(new Date().toISOString().split("T")[0])

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A"
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date)
  }

  // Handle document upload
  const handleUploadDocument = async () => {
    if (!user?.id || !documentFile || !documentName.trim()) {
      setError("Please fill in all required fields")
      return
    }

    try {
      setUploadingDocument(true)
      setError(null)

      // 1. Upload file to Cloudinary
      const formData = new FormData()
      formData.append('file', documentFile)

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file')
      }

      const { url: downloadURL } = await uploadResponse.json()

      // 2. Create document metadata
      const documentData = {
        name: documentName,
        type: documentType,
        uploadedAt: new Date().toISOString(),
        uploadedBy: user.email || "Patient",
        documentUrl: downloadURL,
        date: documentDate,
        status: "active",
      }

      // 3. Add to Firestore based on document type
      const patientRef = doc(db, "patients", user.id)
      
      // Update the appropriate array in the patient document
      let fieldToUpdate = ""
      switch (documentType) {
        case "lab-report":
          fieldToUpdate = "labReports"
          break
        case "prescription":
          fieldToUpdate = "prescriptions"
          break
        case "vaccination":
          fieldToUpdate = "vaccinations"
          break
        case "imaging":
          fieldToUpdate = "imaging"
          break
        case "discharge":
          fieldToUpdate = "dischargeSummaries"
          break
        default:
          fieldToUpdate = "otherDocuments"
      }

      await updateDoc(patientRef, {
        [fieldToUpdate]: arrayUnion(documentData)
      })

      // Show success message and reset form
      setUploadSuccess(true)
      setDocumentFile(null)
      setDocumentName("")
      setDocumentType("lab-report")

      // Close dialog after a delay
      setTimeout(() => {
        setIsUploadOpen(false)
        setUploadSuccess(false)
        // Refresh the page or update the UI
        window.location.reload()
      }, 2000)

    } catch (err) {
      console.error("Error uploading document:", err)
      setError("Failed to upload document. Please try again.")
    } finally {
      setUploadingDocument(false)
    }
  }

  if (!user) {
    return null
  }

  // Get data directly from user object
  const labReports = user.labReports || []
  const prescriptions = user.prescriptions || []
  const vaccinations = user.vaccinations || []
  const allergies = user.allergies || []
  const chronicConditions = user.chronicConditions || []
  const medications = user.medications || []
  const healthAnalysis = user.healthAnalysis || []

  // Filter lab reports based on search query
  const filteredLabReports = labReports.filter(
    (report) =>
      report.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.type?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Medical Records</h1>
          <p className="text-muted-foreground">Access and manage your complete medical history</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex items-center gap-2" onClick={() => setIsUploadOpen(true)}>
            <Upload className="h-4 w-4" />
            Upload Records
          </Button>
          <Button className="bg-green-600 hover:bg-green-700">Request Records</Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="lab-reports" className="w-full">
        <TabsList className={cn("grid w-full", isMobile ? "grid-cols-3 overflow-x-auto" : "grid-cols-5")}>
          <TabsTrigger value="lab-reports" className="flex items-center gap-2">
            <TestTube className="h-4 w-4" />
            <span className={isMobile ? "sr-only" : ""}>Lab Reports</span>
          </TabsTrigger>
          <TabsTrigger value="prescriptions" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className={isMobile ? "sr-only" : ""}>Prescriptions</span>
          </TabsTrigger>
          <TabsTrigger value="vaccinations" className="flex items-center gap-2">
            <Syringe className="h-4 w-4" />
            <span className={isMobile ? "sr-only" : ""}>Vaccinations</span>
          </TabsTrigger>
          <TabsTrigger value="conditions" className="flex items-center gap-2">
            <Pill className="h-4 w-4" />
            <span className={isMobile ? "sr-only" : ""}>Conditions</span>
          </TabsTrigger>
          <TabsTrigger value="health-analysis" className="flex items-center gap-2">
            <BarChart className="h-4 w-4" />
            <span className={isMobile ? "sr-only" : ""}>Health Analysis</span>
          </TabsTrigger>
        </TabsList>

        {/* Lab Reports Tab */}
        <TabsContent value="lab-reports" className="space-y-4 mt-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search lab reports..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Lab Reports & Test Results</CardTitle>
              <CardDescription>View and download your lab reports and diagnostic test results</CardDescription>
            </CardHeader>
            <CardContent>
              {filteredLabReports.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Report Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Doctor</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLabReports.map((report, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{report.name}</TableCell>
                          <TableCell>{report.type}</TableCell>
                          <TableCell>{formatDate(report.date)}</TableCell>
                          <TableCell>{report.doctorName || "Not specified"}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedReport(report)
                                  setIsReportOpen(true)
                                }}
                              >
                                View
                              </Button>
                              {report.documentUrl && (
                                <Button variant="outline" size="sm" asChild>
                                  <a href={report.documentUrl} download target="_blank" rel="noopener noreferrer">
                                    <Download className="h-4 w-4" />
                                  </a>
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <TestTube className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Lab Reports Found</h3>
                  <p className="text-muted-foreground text-center max-w-md mx-auto mb-6">
                    {searchQuery
                      ? "No lab reports match your search criteria. Try adjusting your search terms."
                      : "You don't have any lab reports in your records yet."}
                  </p>
                  <Button className="bg-green-600 hover:bg-green-700" onClick={() => setIsUploadOpen(true)}>
                    Upload Lab Report
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Prescriptions Tab */}
        <TabsContent value="prescriptions" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Prescriptions & Medications</CardTitle>
              <CardDescription>View your current and past prescriptions</CardDescription>
            </CardHeader>
            <CardContent>
              {prescriptions.length > 0 ? (
                <div className="space-y-4">
                  {prescriptions.map((prescription, index) => (
                    <Card key={index}>
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row justify-between mb-4">
                          <div>
                            <h3 className="font-bold text-lg">Prescription from {prescription.doctorName}</h3>
                            <p className="text-muted-foreground">{formatDate(prescription.date)}</p>
                          </div>
                          <div className="flex items-center gap-2 mt-2 md:mt-0">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedReport(prescription)
                                setIsReportOpen(true)
                              }}
                            >
                              View Details
                            </Button>
                            {prescription.documentUrl && (
                              <Button variant="outline" size="sm" asChild>
                                <a href={prescription.documentUrl} download target="_blank" rel="noopener noreferrer">
                                  <Download className="h-4 w-4" />
                                </a>
                              </Button>
                            )}
                          </div>
                        </div>
                        <Separator className="my-4" />
                        <div>
                          <h4 className="font-medium mb-2">Medications</h4>
                          <ul className="space-y-2">
                            {prescription.medications?.map((medication, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <Pill className="h-5 w-5 text-green-600 mt-0.5" />
                                <span>{medication}</span>
                              </li>
                            )) || <li className="text-muted-foreground">No medication details available</li>}
                          </ul>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Prescriptions Found</h3>
                  <p className="text-muted-foreground text-center max-w-md mx-auto mb-6">
                    You don't have any prescriptions in your records yet.
                  </p>
                  <Button className="bg-green-600 hover:bg-green-700" onClick={() => setIsUploadOpen(true)}>
                    Upload Prescription
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Vaccinations Tab */}
        <TabsContent value="vaccinations" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Vaccination History</CardTitle>
              <CardDescription>Track your immunization records and upcoming vaccinations</CardDescription>
            </CardHeader>
            <CardContent>
              {vaccinations && vaccinations.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Vaccine</TableHead>
                        <TableHead>Date Administered</TableHead>
                        <TableHead>Next Due</TableHead>
                        <TableHead className="text-right">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {vaccinations.map((vaccination, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{vaccination.name}</TableCell>
                          <TableCell>{formatDate(vaccination.date)}</TableCell>
                          <TableCell>
                            {vaccination.nextDue ? formatDate(vaccination.nextDue) : "Not required"}
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge
                              className={
                                vaccination.nextDue && new Date(vaccination.nextDue) < new Date()
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-green-100 text-green-800"
                              }
                            >
                              {vaccination.nextDue && new Date(vaccination.nextDue) < new Date()
                                ? "Due for renewal"
                                : "Up to date"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Syringe className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Vaccination Records Found</h3>
                  <p className="text-muted-foreground text-center max-w-md mx-auto mb-6">
                    You don't have any vaccination records in your profile yet.
                  </p>
                  <Button className="bg-green-600 hover:bg-green-700" onClick={() => setIsUploadOpen(true)}>
                    Add Vaccination Record
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Conditions Tab */}
        <TabsContent value="conditions" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Allergies</CardTitle>
                <CardDescription>Known allergies and sensitivities</CardDescription>
              </CardHeader>
              <CardContent>
                {allergies && allergies.length > 0 ? (
                  <ul className="space-y-2">
                    {allergies.map((allergy, index) => (
                      <li key={index} className="flex items-start gap-2 p-2 rounded-md bg-red-50">
                        <div className="h-5 w-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-red-600 text-xs">!</span>
                        </div>
                        <span>{allergy}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-muted-foreground">No allergies recorded</p>
                    <Button variant="outline" size="sm" className="mt-2">
                      Add Allergy
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Chronic Conditions</CardTitle>
                <CardDescription>Ongoing health conditions</CardDescription>
              </CardHeader>
              <CardContent>
                {chronicConditions && chronicConditions.length > 0 ? (
                  <ul className="space-y-2">
                    {chronicConditions.map((condition, index) => (
                      <li key={index} className="flex items-start gap-2 p-2 rounded-md bg-blue-50">
                        <div className="h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-blue-600 text-xs">i</span>
                        </div>
                        <span>{condition}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-muted-foreground">No chronic conditions recorded</p>
                    <Button variant="outline" size="sm" className="mt-2">
                      Add Condition
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Current Medications</CardTitle>
              <CardDescription>Medications you are currently taking</CardDescription>
            </CardHeader>
            <CardContent>
              {medications && medications.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {medications.map((medication, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 border rounded-md">
                      <Pill className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <p className="font-medium">{medication}</p>
                        <p className="text-sm text-muted-foreground">Take as prescribed</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-muted-foreground">No medications recorded</p>
                  <Button variant="outline" size="sm" className="mt-2">
                    Add Medication
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Health Analysis Tab */}
        <TabsContent value="health-analysis" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Health Metrics & Analysis</CardTitle>
              <CardDescription>Track your health metrics and see trends over time</CardDescription>
            </CardHeader>
            <CardContent>
              {healthAnalysis && healthAnalysis.length > 0 ? (
                <div className="space-y-6">
                  {/* Group health metrics by category */}
                  {Object.entries(
                    healthAnalysis.reduce(
                      (acc, item) => {
                        if (!acc[item.category]) {
                          acc[item.category] = []
                        }
                        acc[item.category].push(item)
                        return acc
                      },
                      {} as Record<string, any[]>,
                    ),
                  ).map(([category, items]) => (
                    <div key={category} className="space-y-3">
                      <h3 className="text-lg font-medium capitalize">{category}</h3>
                      <div className="space-y-4">
                        {items.map((item, idx) => {
                          // Calculate progress percentage if normal range exists
                          let progressPercentage = 50
                          let status = "normal"

                          if (item.normalRange) {
                            const range = item.normalRange.max - item.normalRange.min
                            progressPercentage = Math.min(
                              100,
                              Math.max(0, ((item.value - item.normalRange.min) / range) * 100),
                            )

                            if (item.value < item.normalRange.min) {
                              status = "below"
                            } else if (item.value > item.normalRange.max) {
                              status = "above"
                            }
                          }

                          return (
                            <div key={idx} className="border rounded-lg p-4">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <h4 className="font-medium">{item.category}</h4>
                                  <p className="text-sm text-muted-foreground">Last updated: {formatDate(item.date)}</p>
                                </div>
                                <Badge
                                  variant="outline"
                                  className={
                                    item.trend === "improving"
                                      ? "bg-green-100 text-green-800"
                                      : item.trend === "declining"
                                        ? "bg-red-100 text-red-800"
                                        : "bg-blue-100 text-blue-800"
                                  }
                                >
                                  {item.trend
                                    ? `${item.trend.charAt(0).toUpperCase()}${item.trend.slice(1)}`
                                    : "Stable"}
                                </Badge>
                              </div>

                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-2xl font-bold">{item.value}</span>
                                <span className="text-sm text-muted-foreground">{item.unit}</span>
                              </div>

                              {item.normalRange && (
                                <div className="space-y-1">
                                  <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>
                                      {item.normalRange.min} {item.unit}
                                    </span>
                                    <span>Normal Range</span>
                                    <span>
                                      {item.normalRange.max} {item.unit}
                                    </span>
                                  </div>
                                  <Progress
                                    value={progressPercentage}
                                    className={
                                      status === "normal"
                                        ? "bg-gray-100"
                                        : status === "below"
                                          ? "bg-amber-100"
                                          : "bg-red-100"
                                    }
                                  />
                                </div>
                              )}

                              {item.doctorNotes && (
                                <div className="mt-3 p-2 bg-gray-50 rounded text-sm">
                                  <p className="font-medium text-xs text-muted-foreground mb-1">Doctor's Notes:</p>
                                  <p>{item.doctorNotes}</p>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <BarChart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Health Analysis Available</h3>
                  <p className="text-muted-foreground text-center max-w-md mx-auto mb-6">
                    Your doctor hasn't provided any health analysis data yet.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* View Report Dialog */}
      <Dialog open={isReportOpen} onOpenChange={setIsReportOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{selectedReport?.name}</DialogTitle>
            <DialogDescription>
              {selectedReport?.type} • {selectedReport && formatDate(selectedReport.date)}
              {selectedReport?.doctorName && ` • Dr. ${selectedReport.doctorName}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {selectedReport?.documentUrl && (
              <div className="aspect-video w-full relative rounded-lg overflow-hidden border border-gray-200">
                <img
                  src={selectedReport.documentUrl || "/placeholder.svg"}
                  alt={selectedReport.name}
                  className="object-contain w-full h-full"
                />
              </div>
            )}

            {selectedReport?.results && selectedReport.results.length > 0 && (
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
                    {selectedReport.results.map((result, index) => (
                      <TableRow key={index}>
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
            )}

            {selectedReport?.summary && (
              <div>
                <h4 className="text-sm font-medium mb-1">Summary</h4>
                <div className="p-3 bg-gray-50 rounded-md">
                  <p className="text-sm">{selectedReport.summary}</p>
                </div>
              </div>
            )}

            {selectedReport?.medications && selectedReport.medications.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-1">Medications</h4>
                <div className="p-3 bg-gray-50 rounded-md">
                  <ul className="space-y-1">
                    {selectedReport.medications.map((med, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <Pill className="h-4 w-4 text-green-600" />
                        <span className="text-sm">{med}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex justify-between sm:justify-between">
            <Button variant="outline" onClick={() => setIsReportOpen(false)}>
              Close
            </Button>
            {selectedReport?.documentUrl && (
              <Button className="bg-green-600 hover:bg-green-700" asChild>
                <a href={selectedReport.documentUrl} download target="_blank" rel="noopener noreferrer">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </a>
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload Records Dialog */}
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Medical Records</DialogTitle>
            <DialogDescription>Add new medical records to your profile</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {uploadSuccess && (
              <Alert className="bg-green-50 text-green-800 border-green-200">
                <AlertDescription>Document uploaded successfully!</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Record Type</label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
              >
                <option value="">Select record type</option>
                <option value="lab-report">Lab Report</option>
                <option value="prescription">Prescription</option>
                <option value="vaccination">Vaccination Record</option>
                <option value="imaging">Imaging (X-ray, MRI, etc.)</option>
                <option value="discharge">Hospital Discharge Summary</option>
                <option value="other">Other Medical Document</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Document Name</label>
              <Input
                placeholder="Enter a name for this document"
                value={documentName}
                onChange={(e) => setDocumentName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Date of Record</label>
              <Input 
                type="date" 
                value={documentDate}
                onChange={(e) => setDocumentDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Upload File</label>
              <div className="border-2 border-dashed rounded-md p-6 text-center">
                <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Drag and drop files here, or click to select files</p>
                <p className="text-xs text-muted-foreground mt-1">Supports PDF, JPG, PNG up to 10MB</p>
                <Input
                  type="file"
                  className="mt-2 mx-auto"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setDocumentFile(e.target.files[0])
                    }
                  }}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUploadOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={handleUploadDocument}
              disabled={!documentFile || !documentName || uploadingDocument}
            >
              {uploadingDocument ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                "Upload Record"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}


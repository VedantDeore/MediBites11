"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Upload, X } from "lucide-react"
import Image from "next/image"
import { uploadPatientMedicalImage } from "@/lib/patient-service"
import type { PatientMedicalImage } from "@/lib/patient-service"

interface MedicalImageUploaderProps {
  patientId: string
  doctorId: string
  doctorName: string
  onSuccess: (image: PatientMedicalImage) => void
  onCancel: () => void
}

export function MedicalImageUploader({
  patientId,
  doctorId,
  doctorName,
  onSuccess,
  onCancel,
}: MedicalImageUploaderProps) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [name, setName] = useState("")
  const [category, setCategory] = useState("general")
  const [description, setDescription] = useState("")
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

      setFile(selectedFile)
      setName(selectedFile.name)
      setError(null)

      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreview(e.target?.result as string)
      }
      reader.readAsDataURL(selectedFile)
    }
  }

  // Clear selected file
  const clearFile = () => {
    setFile(null)
    setPreview(null)
    setName("")
    setError(null)
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!file) {
      setError("Please select an image file")
      return
    }

    if (!name.trim()) {
      setError("Please enter a name for the image")
      return
    }

    try {
      setUploading(true)
      setError(null)

      // Create form data for upload
      const formData = new FormData()
      formData.append("file", file)
      formData.append("path", "patients/medical-images")
      formData.append("patientId", patientId)

      // Upload to Supabase via API route
      const response = await fetch("/api/upload-image", {
        method: "POST",
        body: formData,
      })

      const responseData = await response.json()

      if (!response.ok) {
        throw new Error(responseData.error || "Failed to upload image")
      }

      // Create image data object
      const imageData: Omit<PatientMedicalImage, "id"> = {
        url: responseData.fileUrl,
        name: name,
        type: file.type,
        category: category,
        description: description,
        uploadedAt: new Date().toISOString(),
        uploadedBy: doctorName,
        doctorId: doctorId,
      }

      // Save image data to Firebase
      const savedImage = await uploadPatientMedicalImage(patientId, imageData)

      // Call success callback
      onSuccess(savedImage)
    } catch (err) {
      console.error("Error uploading image:", err)
      setError(err instanceof Error ? err.message : "Failed to upload image")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      {error && <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        {!preview ? (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <Input type="file" accept="image/*" onChange={handleFileChange} className="hidden" id="image-upload" />
            <label htmlFor="image-upload" className="flex flex-col items-center justify-center cursor-pointer">
              <Upload className="h-10 w-10 text-gray-400 mb-2" />
              <p className="text-sm text-gray-500">Click to upload a medical image</p>
              <p className="text-xs text-gray-400 mt-1">PNG, JPG, JPEG up to 5MB</p>
            </label>
          </div>
        ) : (
          <div className="relative">
            <div className="aspect-video w-full relative rounded-lg overflow-hidden border border-gray-200">
              <Image src={preview || "/placeholder.svg"} alt="Preview" fill className="object-contain" />
            </div>
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 h-8 w-8 rounded-full"
              onClick={clearFile}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium">Image Name</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter a name for this image"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Category</label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="general">General</SelectItem>
              <SelectItem value="x-ray">X-Ray</SelectItem>
              <SelectItem value="mri">MRI</SelectItem>
              <SelectItem value="ct-scan">CT Scan</SelectItem>
              <SelectItem value="ultrasound">Ultrasound</SelectItem>
              <SelectItem value="pathology">Pathology</SelectItem>
              <SelectItem value="dermatology">Dermatology</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Description (Optional)</label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter a description for this image"
            rows={3}
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" className="bg-purple-600 hover:bg-purple-700" disabled={!file || uploading}>
            {uploading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {uploading ? "Uploading..." : "Upload Image"}
          </Button>
        </div>
      </form>
    </div>
  )
}


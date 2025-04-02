"use client"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, FileText, ImageIcon, Trash } from "lucide-react"
import { deletePatientMedicalImage } from "@/lib/patient-service"
import type { PatientMedicalImage } from "@/lib/patient-service"

interface MedicalImageGalleryProps {
  patientId: string
  images: PatientMedicalImage[]
  onDelete: (imageId: string) => void
}

export function MedicalImageGallery({ patientId, images, onDelete }: MedicalImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<PatientMedicalImage | null>(null)
  const [viewerOpen, setViewerOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [activeCategory, setActiveCategory] = useState<string>("all")

  // Get unique categories from images
  const categories = ["all", ...Array.from(new Set(images.map((img) => img.category)))].filter(Boolean)

  // Filter images by category
  const filteredImages = activeCategory === "all" ? images : images.filter((img) => img.category === activeCategory)

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A"
    try {
      const date = new Date(dateString)
      return new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
      }).format(date)
    } catch (e) {
      return dateString
    }
  }

  // Handle image deletion
  const handleDeleteImage = async () => {
    if (!selectedImage) return

    try {
      setDeleting(true)
      await deletePatientMedicalImage(patientId, selectedImage.id)
      onDelete(selectedImage.id)
      setViewerOpen(false)
      setSelectedImage(null)
    } catch (error) {
      console.error("Error deleting image:", error)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Category tabs */}
      {categories.length > 1 && (
        <Tabs defaultValue="all" value={activeCategory} onValueChange={setActiveCategory}>
          <TabsList className="mb-4">
            {categories.map((category) => (
              <TabsTrigger key={category} value={category} className="capitalize">
                {category === "all" ? "All Images" : category.replace(/-/g, " ")}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      )}

      {/* Image grid */}
      {filteredImages.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredImages.map((image) => (
            <Card
              key={image.id}
              className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => {
                setSelectedImage(image)
                setViewerOpen(true)
              }}
            >
              <div className="aspect-square relative">
                <Image src={image.url || "/placeholder.svg"} alt={image.name} fill className="object-cover" />
              </div>
              <CardContent className="p-2">
                <p className="text-sm font-medium truncate">{image.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{image.category.replace(/-/g, " ")}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 border rounded-lg">
          <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
          <p className="mt-2 text-muted-foreground">No medical images found</p>
          {activeCategory !== "all" && (
            <p className="text-sm text-muted-foreground">Try selecting a different category</p>
          )}
        </div>
      )}

      {/* Image viewer dialog */}
      <Dialog open={viewerOpen} onOpenChange={setViewerOpen}>
        <DialogContent className="sm:max-w-3xl">
          {selectedImage && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedImage.name}</DialogTitle>
                <DialogDescription className="capitalize">
                  {selectedImage.category.replace(/-/g, " ")}
                </DialogDescription>
              </DialogHeader>

              <div className="relative aspect-video w-full rounded-lg overflow-hidden border border-gray-200 my-4">
                <Image
                  src={selectedImage.url || "/placeholder.svg"}
                  alt={selectedImage.name}
                  fill
                  className="object-contain"
                />
              </div>

              <div className="space-y-4">
                {selectedImage.description && (
                  <div>
                    <h4 className="text-sm font-medium mb-1">Description</h4>
                    <p className="text-sm">{selectedImage.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">Uploaded on</p>
                    </div>
                    <p className="text-sm">{formatDate(selectedImage.uploadedAt)}</p>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">Uploaded by</p>
                    </div>
                    <p className="text-sm">{selectedImage.uploadedBy}</p>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button variant="destructive" size="sm" onClick={handleDeleteImage} disabled={deleting}>
                    {deleting ? (
                      <>Deleting...</>
                    ) : (
                      <>
                        <Trash className="h-4 w-4 mr-2" />
                        Delete Image
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}


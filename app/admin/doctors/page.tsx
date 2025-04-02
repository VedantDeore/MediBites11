"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { ResponsiveAdminPageWrapper } from "@/components/responsive-admin-page-wrapper"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  startAfter,
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function DoctorsPage() {
  const [loading, setLoading] = useState(true)
  const [doctors, setDoctors] = useState<any[]>([])
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | undefined>(undefined)
  const [hasMore, setHasMore] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDoctors()
  }, [])

  const fetchDoctors = async (reset = false) => {
    try {
      setLoading(true)
      setError(null)

      let doctorsQuery

      if (reset || !lastDoc) {
        doctorsQuery = query(collection(db, "doctors"), orderBy("name"), limit(10))
      } else {
        doctorsQuery = query(collection(db, "doctors"), orderBy("name"), startAfter(lastDoc), limit(10))
      }

      console.log("Fetching doctors with query:", reset ? "reset query" : "pagination query")
      const snapshot = await getDocs(doctorsQuery)
      console.log("Fetched", snapshot.size, "doctors")

      const doctorsList: any[] = []
      snapshot.forEach((doc) => {
        doctorsList.push({
          id: doc.id,
          ...doc.data(),
        })
      })

      if (reset) {
        setDoctors(doctorsList)
      } else {
        setDoctors((prev) => [...prev, ...doctorsList])
      }

      const lastVisible = snapshot.docs[snapshot.docs.length - 1]
      setLastDoc(lastVisible)
      setHasMore(snapshot.size === 10)
    } catch (error) {
      console.error("Error fetching doctors:", error)
      setError("Failed to load doctors. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      fetchDoctors()
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // Reset and apply search
    fetchDoctors(true)
  }

  const filteredDoctors = doctors.filter(
    (doctor) =>
      doctor.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.specialty?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <ResponsiveAdminPageWrapper title="Doctors">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-3xl font-bold tracking-tight">Doctors</h1>
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              placeholder="Search doctors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-auto"
            />
            <Button type="submit">Search</Button>
          </form>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <span className="block sm:inline">{error}</span>
            <Button 
              onClick={() => fetchDoctors(true)}
              variant="link"
              size="sm"
              className="text-red-500"
            >
              Try Again
            </Button>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Doctor Directory</CardTitle>
            <CardDescription>View and manage all registered doctors</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Doctor</TableHead>
                    <TableHead>Specialty</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Patients</TableHead>
                    <TableHead>Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading && doctors.length === 0 ? (
                    Array(5)
                      .fill(0)
                      .map((_, i) => (
                        <TableRow key={i}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Skeleton className="h-10 w-10 rounded-full" />
                              <Skeleton className="h-4 w-[150px]" />
                            </div>
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-[120px]" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-[180px]" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-[60px]" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-[80px]" />
                          </TableCell>
                        </TableRow>
                      ))
                  ) : filteredDoctors.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4">
                        No doctors found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredDoctors.map((doctor) => (
                      <TableRow key={doctor.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              {doctor.profilePicture ? (
                                <AvatarImage src={doctor.profilePicture} alt={doctor.name} />
                              ) : (
                                <AvatarFallback className="bg-green-100 text-green-600">
                                  {doctor.name?.charAt(0) || "D"}
                                </AvatarFallback>
                              )}
                            </Avatar>
                            <div>
                              <p className="font-medium">{doctor.name}</p>
                              <p className="text-xs text-muted-foreground">ID: {doctor.id.slice(0, 8)}...</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{doctor.specialty || "General"}</TableCell>
                        <TableCell>{doctor.email || "N/A"}</TableCell>
                        <TableCell>{doctor.totalPatients || 0}</TableCell>
                        <TableCell>${doctor.revenue?.toFixed(2) || "0.00"}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {hasMore && (
              <div className="mt-4 flex justify-center">
                <Button variant="outline" onClick={handleLoadMore} disabled={loading || !hasMore}>
                  {loading ? "Loading..." : "Load More"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ResponsiveAdminPageWrapper>
  )
}


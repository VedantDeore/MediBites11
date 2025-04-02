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

export default function PatientsPage() {
  const [loading, setLoading] = useState(true)
  const [patients, setPatients] = useState<any[]>([])
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | undefined>(undefined)
  const [hasMore, setHasMore] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    fetchPatients()
  }, [])

  const fetchPatients = async (reset = false) => {
    try {
      setLoading(true)

      let patientsQuery

      if (reset || !lastDoc) {
        patientsQuery = query(collection(db, "patients"), orderBy("name"), limit(10))
      } else {
        patientsQuery = query(collection(db, "patients"), orderBy("name"), startAfter(lastDoc), limit(10))
      }

      const snapshot = await getDocs(patientsQuery)

      const patientsList: any[] = []
      snapshot.forEach((doc) => {
        patientsList.push({
          id: doc.id,
          ...doc.data(),
        })
      })

      if (reset) {
        setPatients(patientsList)
      } else {
        setPatients((prev) => [...prev, ...patientsList])
      }

      const lastVisible = snapshot.docs[snapshot.docs.length - 1]
      setLastDoc(lastVisible)
      setHasMore(snapshot.size === 10)
    } catch (error) {
      console.error("Error fetching patients:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      fetchPatients()
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // Reset and apply search
    fetchPatients(true)
  }

  const filteredPatients = patients.filter(
    (patient) =>
      patient.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.email?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <ResponsiveAdminPageWrapper title="Patients">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-3xl font-bold tracking-tight">Patients</h1>
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              placeholder="Search patients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-auto"
            />
            <Button type="submit">Search</Button>
          </form>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Patient Directory</CardTitle>
            <CardDescription>View and manage all registered patients</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Doctor</TableHead>
                    <TableHead>Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading && patients.length === 0 ? (
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
                            <Skeleton className="h-4 w-[180px]" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-[100px]" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-[120px]" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-[100px]" />
                          </TableCell>
                        </TableRow>
                      ))
                  ) : filteredPatients.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4">
                        No patients found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPatients.map((patient) => (
                      <TableRow key={patient.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              {patient.profilePicture ? (
                                <AvatarImage src={patient.profilePicture} alt={patient.name} />
                              ) : (
                                <AvatarFallback className="bg-blue-100 text-blue-600">
                                  {patient.name?.charAt(0) || "P"}
                                </AvatarFallback>
                              )}
                            </Avatar>
                            <div>
                              <p className="font-medium">{patient.name}</p>
                              <p className="text-xs text-muted-foreground">ID: {patient.id.slice(0, 8)}...</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{patient.email || "N/A"}</TableCell>
                        <TableCell>{patient.phone || "N/A"}</TableCell>
                        <TableCell>{patient.doctorName || "Unassigned"}</TableCell>
                        <TableCell>
                          {patient.createdAt ? new Date(patient.createdAt).toLocaleDateString() : "N/A"}
                        </TableCell>
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


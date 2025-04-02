"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { ResponsiveAdminPageWrapper } from "@/components/responsive-admin-page-wrapper"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getTransactions } from "@/lib/admin-service"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import type { DocumentData, QueryDocumentSnapshot } from "firebase/firestore"

export default function TransactionsPage() {
  const [loading, setLoading] = useState(true)
  const [transactions, setTransactions] = useState<any[]>([])
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | undefined>(undefined)
  const [hasMore, setHasMore] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [transactionType, setTransactionType] = useState("all")

  useEffect(() => {
    fetchTransactions()
  }, [])

  const fetchTransactions = async (reset = false) => {
    try {
      setLoading(true)
      const lastDocToUse = reset ? undefined : lastDoc

      const result = await getTransactions(lastDocToUse, 10)

      if (reset) {
        setTransactions(result.transactions)
      } else {
        setTransactions((prev) => [...prev, ...result.transactions])
      }

      setLastDoc(result.lastDoc)
      setHasMore(result.hasMore)
    } catch (error) {
      console.error("Error fetching transactions:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      fetchTransactions()
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // Reset and apply filters
    fetchTransactions(true)
  }

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A"

    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
      return date.toLocaleDateString() + " " + date.toLocaleTimeString()
    } catch (error) {
      return "Invalid date"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-600 bg-green-50 border-green-200"
      case "pending":
        return "text-yellow-600 bg-yellow-50 border-yellow-200"
      case "failed":
        return "text-red-600 bg-red-50 border-red-200"
      default:
        return "text-gray-600 bg-gray-50 border-gray-200"
    }
  }

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch =
      transaction.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (transaction.patientName && transaction.patientName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (transaction.doctorName && transaction.doctorName.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesType = transactionType === "all" || transaction.type === transactionType

    return matchesSearch && matchesType
  })

  return (
    <ResponsiveAdminPageWrapper title="Transactions">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2">
            <div>
              <Input
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-auto"
              />
            </div>
            <div>
              <Select value={transactionType} onValueChange={setTransactionType}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Transaction Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="payment">Payment</SelectItem>
                  <SelectItem value="appointment">Appointment</SelectItem>
                  <SelectItem value="refund">Refund</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit">Filter</Button>
          </form>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
            <CardDescription>View all financial transactions in the system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Doctor</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading && transactions.length === 0 ? (
                    Array(5)
                      .fill(0)
                      .map((_, i) => (
                        <TableRow key={i}>
                          <TableCell>
                            <Skeleton className="h-4 w-[120px]" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-[100px]" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-[80px]" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-[60px]" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-[100px]" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-[100px]" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-[80px]" />
                          </TableCell>
                        </TableRow>
                      ))
                  ) : filteredTransactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-4">
                        No transactions found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTransactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell className="font-medium">{transaction.id.slice(0, 8)}...</TableCell>
                        <TableCell>{formatDate(transaction.timestamp)}</TableCell>
                        <TableCell className="capitalize">{transaction.type}</TableCell>
                        <TableCell className={transaction.type === "refund" ? "text-red-600" : "text-green-600"}>
                          {transaction.type === "refund" ? "-" : "+"}${Number.parseFloat(transaction.amount).toFixed(2)}
                        </TableCell>
                        <TableCell>{transaction.patientName || "N/A"}</TableCell>
                        <TableCell>{transaction.doctorName || "N/A"}</TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(transaction.status)}`}
                          >
                            {transaction.status}
                          </span>
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


"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, ArrowUpRight, ArrowDownLeft } from "lucide-react"
import { getPatientTransactions } from "@/lib/patient-firebase"
import type { Transaction } from "@/lib/patient-firebase"
import { Chain } from "@/lib/blockchain"

interface TransactionHistoryProps {
  userId: string
}

export function TransactionHistory({ userId }: TransactionHistoryProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [blockchainStatus, setBlockchainStatus] = useState<{
    [key: string]: 'pending' | 'confirmed' | 'failed'
  }>({})

  useEffect(() => {
    const fetchTransactions = async () => {
      if (userId) {
        setLoading(true)
        try {
          const transactionData = await getPatientTransactions(userId)
          setTransactions(transactionData)
          
          // Check blockchain status for each transaction
          const blockchainStatuses: { [key: string]: 'pending' | 'confirmed' | 'failed' } = {}
          transactionData.forEach(transaction => {
            const block = Chain.instance.chain.find(
              block => block.transaction.toString().includes(transaction.id)
            )
            blockchainStatuses[transaction.id] = block ? 'confirmed' : 'pending'
          })
          setBlockchainStatus(blockchainStatuses)
        } catch (error) {
          console.error("Error fetching transactions:", error)
        } finally {
          setLoading(false)
        }
      }
    }

    fetchTransactions()
  }, [userId])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "numeric",
    }).format(date)
  }

  const getStatusBadge = (status: 'pending' | 'confirmed' | 'failed') => {
    const badges = {
      pending: (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <span className="animate-pulse mr-1">⏳</span> Processing
        </span>
      ),
      confirmed: (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <span className="mr-1">✓</span> Confirmed
        </span>
      ),
      failed: (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <span className="mr-1">❌</span> Failed
        </span>
      )
    }
    return badges[status]
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : transactions.length > 0 ? (
          <div className="space-y-4">
            {transactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between border-b pb-3">
                <div className="flex items-start gap-3">
                  <div
                    className={`rounded-full p-2 ${transaction.type === "deposit" ? "bg-green-100" : "bg-blue-100"}`}
                  >
                    {transaction.type === "deposit" ? (
                      <ArrowDownLeft
                        className={`h-4 w-4 ${transaction.type === "deposit" ? "text-green-600" : "text-blue-600"}`}
                      />
                    ) : (
                      <ArrowUpRight
                        className={`h-4 w-4 ${transaction.type === "deposit" ? "text-green-600" : "text-blue-600"}`}
                      />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{transaction.description}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(transaction.date)}</p>
                    {transaction.reference && (
                      <p className="text-xs text-muted-foreground">Ref: {transaction.reference}</p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-medium ${transaction.type === "deposit" ? "text-green-600" : "text-blue-600"}`}>
                    {transaction.type === "deposit" ? "+" : "-"}${transaction.amount.toFixed(2)}
                  </p>
                  <Badge variant="outline" className={transaction.type === "deposit" ? "bg-green-50" : "bg-blue-50"}>
                    {transaction.type === "deposit" ? "Deposit" : "Payment"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No transactions yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}


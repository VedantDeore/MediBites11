"use client"

import { useState } from "react"
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { DollarSign, Plus, CreditCard } from "lucide-react"
import { addFundsToPatient } from "@/lib/patient-firebase"
import { toast } from "@/components/ui/use-toast"

interface BalanceCardProps {
  balance: number
  userId: string
  onBalanceUpdated: (newBalance: number) => void
}

export function BalanceCard({ balance, userId, onBalanceUpdated }: BalanceCardProps) {
  const [isAddingFunds, setIsAddingFunds] = useState(false)
  const [amount, setAmount] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)

  const handleAddFunds = async () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid amount greater than 0",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)
    try {
      const amountToAdd = Number(amount)
      const newBalance = await addFundsToPatient(userId, amountToAdd)
      onBalanceUpdated(newBalance)
      toast({
        title: "Funds added successfully",
        description: `$${amountToAdd.toFixed(2)} has been added to your account`,
      })
      setAmount("")
      setIsAddingFunds(false)
    } catch (error) {
      console.error("Error adding funds:", error)
      toast({
        title: "Error adding funds",
        description: "There was a problem adding funds to your account. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Account Balance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          <DollarSign className="h-6 w-6 text-green-600" />
          <span className="text-3xl font-bold">${balance.toFixed(2)}</span>
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          Use your balance to pay for appointments and medical services
        </p>
        <div className="mt-4">
          <Dialog open={isAddingFunds} onOpenChange={setIsAddingFunds}>
            <DialogTrigger asChild>
              <Button id="add-funds-button" variant="outline" className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Funds
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Funds to Your Account</DialogTitle>
                <DialogDescription>Enter the amount you would like to add to your healthcare wallet.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Amount</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="number"
                      placeholder="0.00"
                      className="pl-9"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Payment Method</label>
                  <div className="border rounded-md p-3 flex items-center gap-3">
                    <CreditCard className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Credit Card ending in 1234</p>
                      <p className="text-xs text-muted-foreground">Expires 12/25</p>
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddingFunds(false)}>
                  Cancel
                </Button>
                <Button className="bg-green-600 hover:bg-green-700" onClick={handleAddFunds} disabled={isProcessing}>
                  {isProcessing ? "Processing..." : "Add Funds"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </>
  )
}


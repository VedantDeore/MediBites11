"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Bot, Send, Mic, Calendar, Clock, User, DollarSign, CheckCircle2, AlertCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useAuth } from "@/lib/auth-context"
import { DashboardNav } from "@/components/dashboard-nav"
import { BottomNav } from "@/components/bottom-nav"
import { useMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { db } from "@/lib/firebase"
import { doc, getDoc } from "firebase/firestore"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://medi-care-backend-josm.onrender.com/';

interface Message {
  role: "user" | "assistant" | "system"
  content: string
  isVoice?: boolean
  metadata?: {
    type?: "appointment_confirmation" | "payment_request"
    data?: any
  }
}

export default function BookAppointmentPage() {
  const { user } = useAuth()
  const router = useRouter()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I'm your medical appointment assistant. How can I help you today?",
    },
  ])
  const [isLoading, setIsLoading] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState("")
  const recognitionRef = useRef<any>(null)
  const [balance, setBalance] = useState(0)
  const { toast } = useToast()
  const isMobile = useMobile()
  const [paymentDetails, setPaymentDetails] = useState<{
    appointmentId: string
    amount: number
    otp: string
    showOtpField: boolean
  } | null>(null)
  const synthRef = useRef<SpeechSynthesis | null>(null)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Initialize speech recognition
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition()
        recognitionRef.current.continuous = false
        recognitionRef.current.interimResults = true
        recognitionRef.current.lang = 'en-US'

        recognitionRef.current.onresult = (event: any) => {
          const transcript = Array.from(event.results)
            .map((result: any) => result[0])
            .map((result) => result.transcript)
            .join('')
          setTranscript(transcript)
        }

        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error', event.error)
          toast({
            title: "Voice Recognition Error",
            description: event.error === 'not-allowed' 
              ? "Please enable microphone permissions." 
              : "Error processing voice command.",
            variant: "destructive",
          })
        }

        recognitionRef.current.onend = () => {
          if (isRecording) {
            recognitionRef.current?.start()
          }
        }
      }

      // Initialize speech synthesis
      synthRef.current = window.speechSynthesis
    }

    // Fetch user balance
    const fetchBalance = async () => {
      if (!user?.id) return
      try {
        const patientRef = doc(db, "patients", user.id)
        const patientDoc = await getDoc(patientRef)
        if (patientDoc.exists()) {
          setBalance(patientDoc.data().balance || 0)
        }
      } catch (error) {
        console.error("Error fetching balance:", error)
      }
    }

    fetchBalance()

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
      if (synthRef.current && utteranceRef.current) {
        synthRef.current.cancel()
      }
    }
  }, [user, toast])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const speak = (text: string) => {
    if (!synthRef.current) return
    
    synthRef.current.cancel()
    
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 1.0
    utterance.pitch = 1.0
    utterance.volume = 1.0
    
    const voices = synthRef.current.getVoices()
    const preferredVoice = voices.find(v => v.name.includes('English'))
    if (preferredVoice) {
      utterance.voice = preferredVoice
    }
    
    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event)
    }
    
    synthRef.current.speak(utterance)
    utteranceRef.current = utterance
  }

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop()
      setIsRecording(false)
      if (transcript.trim()) {
        handleSubmit(transcript)
      }
      setTranscript("")
    } else {
      setTranscript("")
      recognitionRef.current?.start()
      setIsRecording(true)
    }
  }

  const handleSubmit = async (text?: string) => {
    const userMessage = text || input.trim()
    if (!userMessage || isLoading || !user) return

    if (!text) setInput("")
    
    setMessages(prev => [...prev, { 
      role: "user", 
      content: userMessage,
      isVoice: !!text
    }])
    setIsLoading(true)

    try {
      const patientInfo = {
        id: user.id,
        email: user.email || "",
        name: user.name || user.email?.split("@")[0] || "Patient"
      }

      const response = await fetch(`${API_BASE_URL}/api/ai-appointment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          history: messages.map(m => ({ role: m.role, content: m.content })),
          patient_info: patientInfo
        }),
      })

      if (!response.ok) {
        throw new Error(await response.text())
      }

      const data = await response.json()
      
      const aiMessage: Message = {
        role: "assistant",
        content: data.text_response,
        metadata: data.action ? {
          type: data.action.type,
          data: data.action.details
        } : undefined
      }
      
      setMessages(prev => [...prev, aiMessage])
      speak(data.text_response)

      if (data.action?.type === "appointment_booked") {
        setPaymentDetails({
          appointmentId: data.action.details.appointmentId,
          amount: data.action.details.cost,
          otp: "",
          showOtpField: true
        })
      }

    } catch (error) {
      console.error("Error:", error)
      setMessages(prev => [
        ...prev,
        {
          role: "assistant",
          content: error instanceof Error ? error.message : "Sorry, I encountered an error.",
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handlePaymentSubmit = async () => {
    if (!paymentDetails || !user?.id) return
    
    setIsLoading(true)
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/process-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patient_id: user.id,
          amount: paymentDetails.amount,
          appointment_id: paymentDetails.appointmentId,
          otp: paymentDetails.otp
        }),
      })

      if (!response.ok) {
        throw new Error(await response.text())
      }

      const data = await response.json()
      
      if (data.success) {
        setBalance(data.newBalance)
        setPaymentDetails(null)
        
        setMessages(prev => [
          ...prev,
          {
            role: "assistant",
            content: data.message || `Payment successful! New balance: $${data.newBalance.toFixed(2)}`,
          },
        ])

        toast({
          title: "Payment Successful",
          description: "Your appointment has been confirmed.",
        })
      } else {
        throw new Error(data.error || "Payment failed")
      }

    } catch (error) {
      console.error("Payment error:", error)
      setMessages(prev => [
        ...prev,
        {
          role: "assistant",
          content: error instanceof Error ? error.message : "Payment failed.",
        },
      ])
      toast({
        title: "Payment Failed",
        description: error instanceof Error ? error.message : "Payment processing error",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const renderAppointmentConfirmation = (data: any) => (
    <Card className="mt-4 border-green-200 bg-green-50">
      <div className="p-4">
        <div className="flex items-center gap-2 text-green-700 mb-2">
          <CheckCircle2 className="h-5 w-5" />
          <h3 className="font-semibold">Appointment Scheduled</h3>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span>Dr. {data.doctorName}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{new Date(data.date).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>{data.time}</span>
          </div>
          {data.cost && (
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span>${data.cost.toFixed(2)}</span>
            </div>
          )}
        </div>
        
        {data.cost && balance < data.cost && (
          <Alert className="mt-3 bg-red-50 border-red-200">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertTitle>Insufficient Balance</AlertTitle>
            <AlertDescription>
              Your balance (${balance.toFixed(2)}) is less than the appointment cost.
            </AlertDescription>
          </Alert>
        )}
        
        {paymentDetails?.appointmentId === data.appointmentId && paymentDetails.showOtpField && (
          <div className="mt-3 space-y-2">
            <Input
              placeholder="Enter OTP"
              value={paymentDetails.otp}
              onChange={(e) => setPaymentDetails({
                ...paymentDetails,
                otp: e.target.value
              })}
            />
            <Button 
              className="w-full bg-green-600 hover:bg-green-700"
              onClick={handlePaymentSubmit}
              disabled={isLoading || paymentDetails.otp.length !== 6}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Confirm Payment of ${data.cost.toFixed(2)}
            </Button>
          </div>
        )}
      </div>
    </Card>
  )

  return (
    <div className="flex min-h-screen flex-col">
      {!isMobile && <DashboardNav />}
      <div className={cn("flex-1 flex flex-col", isMobile ? "" : "ml-64")}>
        <header className="h-14 border-b flex items-center justify-between px-4 md:px-6 bg-background sticky top-0 z-10">
          <h1 className="text-lg font-semibold">AI Appointment Booking</h1>
          <div className="flex items-center gap-4">
            {user && (
              <div className="hidden md:flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">${balance.toFixed(2)}</span>
              </div>
            )}
            {!user && (
              <Button onClick={() => router.push("/login")} className="bg-green-600 hover:bg-green-700">
                Sign in
              </Button>
            )}
          </div>
        </header>

        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message, index) => (
              <div key={index} className="flex flex-col">
                <Card
                  className={cn(
                    "p-4 max-w-[85%] shadow-sm",
                    message.role === "assistant" ? "ml-0 mr-auto bg-background" : "ml-auto mr-0 bg-green-50",
                  )}
                >
                  {message.role === "assistant" && (
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center">
                        <Bot className="h-4 w-4 text-green-600" />
                      </div>
                      <span className="font-medium">AI Assistant</span>
                    </div>
                  )}
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </Card>
                
                {message.metadata?.type === "appointment_confirmation" && (
                  renderAppointmentConfirmation(message.metadata.data)
                )}
              </div>
            ))}
            
            {isRecording && transcript && (
              <Card className="p-4 max-w-[85%] ml-auto mr-0 bg-green-50">
                <p className="text-sm text-muted-foreground">{transcript}</p>
              </Card>
            )}
            
            {isLoading && (
              <Card className="p-4 max-w-[85%] ml-0 mr-auto bg-background">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex gap-1">
                    <div className="h-2 w-2 rounded-full bg-green-600 animate-bounce" />
                    <div className="h-2 w-2 rounded-full bg-green-600 animate-bounce [animation-delay:0.2s]" />
                    <div className="h-2 w-2 rounded-full bg-green-600 animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              </Card>
            )}
            <div ref={messagesEndRef} />
          </div>

          <footer className={cn("p-4 border-t bg-background sticky bottom-0 z-10", isMobile ? "pb-20" : "")}>
            <form 
              onSubmit={(e) => {
                e.preventDefault()
                handleSubmit()
              }} 
              className="flex gap-2 max-w-4xl mx-auto"
            >
              <Input
                value={isRecording ? transcript : input}
                onChange={(e) => isRecording ? setTranscript(e.target.value) : setInput(e.target.value)}
                placeholder={user ? 
                  (isRecording ? "Speak now..." : "Type your message...") : 
                  "Sign in to chat"}
                disabled={!user || isLoading}
                className="flex-1"
              />
              <Button
                type="button"
                variant={isRecording ? "destructive" : "outline"}
                size="icon"
                onClick={toggleRecording}
                disabled={!user || isLoading}
              >
                {isRecording ? (
                  <div className="h-4 w-4 rounded-full bg-red-500 animate-pulse" />
                ) : (
                  <Mic className="h-4 w-4" />
                )}
              </Button>
              <Button
                type="submit"
                disabled={!user || (!input.trim() && !transcript.trim()) || isLoading}
                className="bg-green-600 hover:bg-green-700"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </form>
          </footer>
        </main>
      </div>
      {isMobile && <BottomNav />}
    </div>
  )
}
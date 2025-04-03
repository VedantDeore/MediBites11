"use client"

import type React from "react"

import { useState } from "react"
import { useDoctorAuth } from "@/lib/doctor-auth-context"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  FileQuestion,
  HelpCircle,
  Info,
  LifeBuoy,
  MessageSquare,
  Phone,
  Search,
  Send,
  ThumbsUp,
  Video,
} from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

// Types for support data
interface SupportArticle {
  id: string
  title: string
  category: string
  excerpt: string
  views: number
  helpful: number
}

interface FAQ {
  question: string
  answer: string
  category: "general" | "appointments" | "patients" | "billing" | "technical"
}

interface SupportAgent {
  id: string
  name: string
  role: string
  avatar?: string
  status: "online" | "offline" | "busy"
}

export default function DoctorSupportPage() {
  const { doctor } = useDoctorAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [ticketSubject, setTicketSubject] = useState("")
  const [ticketDescription, setTicketDescription] = useState("")
  const [ticketSubmitted, setTicketSubmitted] = useState(false)

  // Mock data for FAQs
  const faqs: FAQ[] = [
    {
      question: "How do I reschedule a patient appointment?",
      answer:
        "To reschedule a patient appointment, go to the Schedule page, find the appointment you want to change, click the three dots menu, and select 'Reschedule'. You can then select a new date and time and save the changes. The patient will automatically be notified of the change.",
      category: "appointments",
    },
    {
      question: "How can I update my availability?",
      answer:
        "You can update your availability by going to the Settings page and selecting the 'Availability' tab. There you can set your working hours for each day of the week, block out vacation time, and set recurring unavailable slots.",
      category: "appointments",
    },
    {
      question: "How do I add a new patient to the system?",
      answer:
        "To add a new patient, go to the Patients page and click the 'Add New Patient' button in the top right corner. Fill out the required information in the form that appears and click 'Save'. The patient will then be added to your patient list.",
      category: "patients",
    },
    {
      question: "Can I export patient data?",
      answer:
        "Yes, you can export patient data by going to the Patients page, selecting the patients you want to export using the checkboxes, and then clicking the 'Export' button. You can choose to export in CSV or PDF format.",
      category: "patients",
    },
    {
      question: "How do I generate invoices for patients?",
      answer:
        "To generate an invoice, go to the Billing section, click 'Create New Invoice', select the patient and the services provided, add any additional details, and click 'Generate Invoice'. The invoice can then be sent to the patient via email or printed.",
      category: "billing",
    },
    {
      question: "What payment methods are accepted?",
      answer:
        "The system currently supports credit/debit cards, bank transfers, and integration with popular payment platforms. Patients can pay online through the patient portal or in person at your clinic.",
      category: "billing",
    },
    {
      question: "How do I reset my password?",
      answer:
        "To reset your password, click on your profile picture in the top right corner, select 'Settings', go to the 'Security' tab, and click 'Change Password'. You'll need to enter your current password and then your new password twice.",
      category: "technical",
    },
    {
      question: "What should I do if the system is running slowly?",
      answer:
        "If the system is running slowly, try clearing your browser cache and cookies, ensure you're using a supported browser (Chrome, Firefox, Safari, or Edge), and check your internet connection. If problems persist, please contact technical support.",
      category: "technical",
    },
    {
      question: "How do I enable two-factor authentication?",
      answer:
        "To enable two-factor authentication, go to Settings > Security, and toggle on the 'Two-Factor Authentication' option. You'll be guided through the setup process, which typically involves installing an authenticator app on your mobile device.",
      category: "technical",
    },
    {
      question: "What are the system requirements for using the platform?",
      answer:
        "The platform works best on modern browsers like Chrome, Firefox, Safari, or Edge. We recommend having at least 4GB of RAM and a stable internet connection with at least 10 Mbps download speed for optimal performance.",
      category: "general",
    },
  ]

  // Mock data for support articles
  const supportArticles: SupportArticle[] = [
    {
      id: "art1",
      title: "Getting Started with MediBites Doctor Dashboard",
      category: "Guides",
      excerpt: "Learn how to navigate the dashboard, set up your profile, and manage your first patient appointments.",
      views: 1245,
      helpful: 98,
    },
    {
      id: "art2",
      title: "Advanced Scheduling Techniques",
      category: "Tutorials",
      excerpt: "Master the scheduling system with recurring appointments, group sessions, and automated reminders.",
      views: 876,
      helpful: 92,
    },
    {
      id: "art3",
      title: "Managing Patient Records Efficiently",
      category: "Best Practices",
      excerpt: "Tips and tricks for organizing patient information, medical history, and treatment plans.",
      views: 1032,
      helpful: 95,
    },
    {
      id: "art4",
      title: "Integrating with External Medical Systems",
      category: "Technical",
      excerpt: "How to connect MediBites with your existing EMR, laboratory systems, and other medical software.",
      views: 654,
      helpful: 87,
    },
    {
      id: "art5",
      title: "Securing Patient Data and Compliance",
      category: "Security",
      excerpt: "Best practices for maintaining HIPAA compliance and protecting sensitive patient information.",
      views: 892,
      helpful: 96,
    },
    {
      id: "art6",
      title: "Optimizing Your Clinical Workflow",
      category: "Best Practices",
      excerpt: "Strategies to improve efficiency in your practice using MediBites's automation features.",
      views: 765,
      helpful: 91,
    },
  ]

  // Mock data for support agents
  const supportAgents: SupportAgent[] = [
    {
      id: "agent1",
      name: "Alex Johnson",
      role: "Technical Support Specialist",
      status: "online",
    },
    {
      id: "agent2",
      name: "Maria Garcia",
      role: "Clinical Workflow Consultant",
      status: "online",
    },
    {
      id: "agent3",
      name: "David Kim",
      role: "Integration Specialist",
      status: "busy",
    },
    {
      id: "agent4",
      name: "Sarah Williams",
      role: "Account Manager",
      status: "offline",
    },
  ]

  // Filter FAQs based on category and search query
  const filteredFAQs = faqs.filter((faq) => {
    const matchesCategory = selectedCategory === "all" || faq.category === selectedCategory
    const matchesSearch =
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  // Filter articles based on search query
  const filteredArticles = supportArticles.filter(
    (article) =>
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.category.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  // Handle support ticket submission
  const handleSubmitTicket = (e: React.FormEvent) => {
    e.preventDefault()
    // In a real app, this would send the ticket to a backend
    console.log("Submitting ticket:", { subject: ticketSubject, description: ticketDescription })
    setTicketSubmitted(true)
    // Reset form after submission
    setTimeout(() => {
      setTicketSubject("")
      setTicketDescription("")
      setTicketSubmitted(false)
    }, 5000)
  }

  // Get status color for support agents
  const getStatusColor = (status: SupportAgent["status"]) => {
    switch (status) {
      case "online":
        return "bg-green-500"
      case "busy":
        return "bg-amber-500"
      case "offline":
        return "bg-gray-400"
      default:
        return "bg-gray-400"
    }
  }

  if (!doctor) {
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Support Center</h1>
          <p className="text-muted-foreground">Get help, find answers, and connect with our support team</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" className="flex items-center gap-2 w-full sm:w-auto">
            <Phone className="h-4 w-4" />
            <span>Call Support</span>
          </Button>
          <Button className="bg-purple-600 hover:bg-purple-700 flex items-center gap-2 w-full sm:w-auto">
            <Video className="h-4 w-4" />
            <span>Video Chat</span>
          </Button>
        </div>
      </div>

      {/* System Status */}
      <Alert className="bg-green-50 border-green-200">
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <AlertTitle className="text-green-600">All Systems Operational</AlertTitle>
        <AlertDescription>
          All MediBites services are running normally. View our{" "}
          <a href="#" className="text-green-600 underline">
            system status page
          </a>{" "}
          for more details.
        </AlertDescription>
      </Alert>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          className="pl-10 py-6 text-lg"
          placeholder="Search for help, articles, and FAQs..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <Tabs defaultValue="faq">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
          <TabsTrigger value="faq" className="flex items-center gap-2">
            <HelpCircle className="h-4 w-4" />
            <span>FAQs</span>
          </TabsTrigger>
          <TabsTrigger value="articles" className="flex items-center gap-2">
            <FileQuestion className="h-4 w-4" />
            <span>Knowledge Base</span>
          </TabsTrigger>
          <TabsTrigger value="contact" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            <span>Contact Support</span>
          </TabsTrigger>
          <TabsTrigger value="chat" className="flex items-center gap-2">
            <LifeBuoy className="h-4 w-4" />
            <span>Live Support</span>
          </TabsTrigger>
        </TabsList>

        {/* FAQs Tab */}
        <TabsContent value="faq" className="space-y-4 mt-4">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedCategory === "all" ? "default" : "outline"}
              className={selectedCategory === "all" ? "bg-purple-600 hover:bg-purple-700" : ""}
              onClick={() => setSelectedCategory("all")}
            >
              All
            </Button>
            <Button
              variant={selectedCategory === "general" ? "default" : "outline"}
              className={selectedCategory === "general" ? "bg-purple-600 hover:bg-purple-700" : ""}
              onClick={() => setSelectedCategory("general")}
            >
              General
            </Button>
            <Button
              variant={selectedCategory === "appointments" ? "default" : "outline"}
              className={selectedCategory === "appointments" ? "bg-purple-600 hover:bg-purple-700" : ""}
              onClick={() => setSelectedCategory("appointments")}
            >
              Appointments
            </Button>
            <Button
              variant={selectedCategory === "patients" ? "default" : "outline"}
              className={selectedCategory === "patients" ? "bg-purple-600 hover:bg-purple-700" : ""}
              onClick={() => setSelectedCategory("patients")}
            >
              Patients
            </Button>
            <Button
              variant={selectedCategory === "billing" ? "default" : "outline"}
              className={selectedCategory === "billing" ? "bg-purple-600 hover:bg-purple-700" : ""}
              onClick={() => setSelectedCategory("billing")}
            >
              Billing
            </Button>
            <Button
              variant={selectedCategory === "technical" ? "default" : "outline"}
              className={selectedCategory === "technical" ? "bg-purple-600 hover:bg-purple-700" : ""}
              onClick={() => setSelectedCategory("technical")}
            >
              Technical
            </Button>
          </div>

          <Card>
            <CardContent className="pt-6">
              {filteredFAQs.length > 0 ? (
                <Accordion type="single" collapsible className="w-full">
                  {filteredFAQs.map((faq, index) => (
                    <AccordionItem key={index} value={`item-${index}`}>
                      <AccordionTrigger className="text-left">
                        <div className="flex items-start gap-2">
                          <HelpCircle className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                          <span>{faq.question}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pl-7">
                        <div className="space-y-2">
                          <p className="text-muted-foreground">{faq.answer}</p>
                          <div className="flex items-center justify-between">
                            <Badge variant="outline" className="bg-purple-50">
                              {faq.category.charAt(0).toUpperCase() + faq.category.slice(1)}
                            </Badge>
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="sm" className="h-8 text-muted-foreground">
                                <ThumbsUp className="h-4 w-4 mr-1" />
                                Helpful
                              </Button>
                              <Button variant="ghost" size="sm" className="h-8 text-muted-foreground">
                                Copy Link
                              </Button>
                            </div>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              ) : (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium">No FAQs Found</h3>
                  <p className="text-muted-foreground mt-1">Try adjusting your search or category filters</p>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between border-t px-6 py-4">
              <p className="text-sm text-muted-foreground">
                Showing {filteredFAQs.length} of {faqs.length} FAQs
              </p>
              <Button variant="outline" size="sm">
                View All FAQs
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Knowledge Base Tab */}
        <TabsContent value="articles" className="space-y-4 mt-4">
          <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
            {filteredArticles.map((article) => (
              <Card key={article.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="bg-purple-50">
                      {article.category}
                    </Badge>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Info className="h-3 w-3 mr-1" />
                      {article.views} views
                    </div>
                  </div>
                  <CardTitle className="text-lg mt-2">{article.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{article.excerpt}</p>
                </CardContent>
                <CardFooter className="flex justify-between border-t pt-4">
                  <div className="flex items-center text-xs text-muted-foreground">
                    <ThumbsUp className="h-3 w-3 mr-1" />
                    {article.helpful}% found this helpful
                  </div>
                  <Button variant="ghost" size="sm" className="text-purple-600 hover:text-purple-700">
                    Read More
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>

          {filteredArticles.length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium">No Articles Found</h3>
                <p className="text-muted-foreground mt-1">Try adjusting your search terms</p>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-center">
            <Button className="bg-purple-600 hover:bg-purple-700">Browse All Articles</Button>
          </div>
        </TabsContent>

        {/* Contact Support Tab */}
        <TabsContent value="contact" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Submit a Support Ticket</CardTitle>
              <CardDescription>Our support team typically responds within 24 hours on business days.</CardDescription>
            </CardHeader>
            <CardContent>
              {ticketSubmitted ? (
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertTitle className="text-green-600">Ticket Submitted Successfully</AlertTitle>
                  <AlertDescription>
                    Thank you for contacting us. We've received your support ticket and will respond shortly.
                  </AlertDescription>
                </Alert>
              ) : (
                <form onSubmit={handleSubmitTicket} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Subject</label>
                    <Input
                      placeholder="Brief description of your issue"
                      value={ticketSubject}
                      onChange={(e) => setTicketSubject(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Description</label>
                    <Textarea
                      placeholder="Please provide as much detail as possible..."
                      className="min-h-[150px]"
                      value={ticketDescription}
                      onChange={(e) => setTicketDescription(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Attachments (Optional)</label>
                    <div className="border-2 border-dashed rounded-md p-6 text-center">
                      <p className="text-sm text-muted-foreground">
                        Drag and drop files here, or click to select files
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Supports images, PDFs, and documents up to 10MB
                      </p>
                      <Button variant="outline" size="sm" className="mt-2">
                        Select Files
                      </Button>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
                      Submit Ticket
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                    <Phone className="h-5 w-5 text-purple-600" />
                  </div>
                  <CardTitle>Phone Support</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Call our dedicated doctor support line for immediate assistance.
                </p>
                <p className="font-medium mt-2">+1 (800) 555-1234</p>
                <p className="text-sm text-muted-foreground mt-1">Available Monday-Friday, 8AM-8PM EST</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                    <MessageSquare className="h-5 w-5 text-purple-600" />
                  </div>
                  <CardTitle>Email Support</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Send us an email and we'll get back to you within 24 hours.</p>
                <p className="font-medium mt-2">doctor-support@MediBites.com</p>
                <p className="text-sm text-muted-foreground mt-1">For non-urgent inquiries</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                    <Video className="h-5 w-5 text-purple-600" />
                  </div>
                  <CardTitle>Video Consultation</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Schedule a video call with our support team for personalized help.
                </p>
                <Button className="w-full mt-4 bg-purple-600 hover:bg-purple-700">Schedule Call</Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Live Support Tab */}
        <TabsContent value="chat" className="space-y-4 mt-4">
          <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
            <div className="md:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Available Support Agents</CardTitle>
                  <CardDescription>Connect with a specialist for immediate assistance</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {supportAgents.map((agent) => (
                    <div
                      key={agent.id}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          {agent.avatar ? (
                            <AvatarImage src={agent.avatar} alt={agent.name} />
                          ) : (
                            <AvatarFallback className="bg-purple-100 text-purple-600">
                              {agent.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          )}
                          <div
                            className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${getStatusColor(agent.status)}`}
                          />
                        </Avatar>
                        <div>
                          <p className="font-medium">{agent.name}</p>
                          <p className="text-xs text-muted-foreground">{agent.role}</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        disabled={agent.status !== "online"}
                        className={agent.status === "online" ? "bg-purple-600 hover:bg-purple-700" : ""}
                      >
                        Chat
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <div className="md:col-span-2">
              <Card className="h-full flex flex-col">
                <CardHeader className="border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-purple-100 text-purple-600">MG</AvatarFallback>
                        <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-green-500" />
                      </Avatar>
                      <div>
                        <CardTitle>Maria Garcia</CardTitle>
                        <CardDescription>Clinical Workflow Consultant</CardDescription>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="icon">
                        <Phone className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon">
                        <Video className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 p-0 flex flex-col">
                  <div className="flex-1 p-4 space-y-4 overflow-auto">
                    <div className="flex gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-purple-100 text-purple-600">MG</AvatarFallback>
                      </Avatar>
                      <div className="bg-gray-100 rounded-lg p-3 max-w-[80%]">
                        <p className="text-sm">Hello Dr. Smith! How can I help you today?</p>
                        <p className="text-xs text-muted-foreground mt-1">10:32 AM</p>
                      </div>
                    </div>

                    <div className="flex gap-3 justify-end">
                      <div className="bg-purple-100 rounded-lg p-3 max-w-[80%]">
                        <p className="text-sm">
                          Hi Maria, I'm having trouble setting up my recurring appointments for my weekly clinic.
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">10:34 AM</p>
                      </div>
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-blue-100 text-blue-600">SS</AvatarFallback>
                      </Avatar>
                    </div>

                    <div className="flex gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-purple-100 text-purple-600">MG</AvatarFallback>
                      </Avatar>
                      <div className="bg-gray-100 rounded-lg p-3 max-w-[80%]">
                        <p className="text-sm">
                          I'd be happy to help with that! Let me walk you through the process. First, could you tell me
                          what specific issue you're encountering?
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">10:36 AM</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-center">
                      <Badge variant="outline" className="text-xs text-muted-foreground">
                        Today
                      </Badge>
                    </div>
                  </div>
                  <div className="p-4 border-t">
                    <div className="flex gap-2">
                      <Input placeholder="Type your message..." className="flex-1" />
                      <Button className="bg-purple-600 hover:bg-purple-700">
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}


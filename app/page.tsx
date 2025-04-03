"use client"

import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { ArrowRight, Calendar, Dumbbell, FileText, HeartPulse, Phone, PieChart, Search, Stethoscope, Users } from "lucide-react"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/lib/auth-context"
import { type BlogPost, formatPublishedDate, getHealthBlogs } from "@/lib/blog-service"
import { Skeleton } from "@/components/ui/skeleton"
import { AnimatedHealth } from "@/components/animated-health"
import { PartnershipBanner } from "@/components/partner"

export default function Home() {
  const { user } = useAuth()
  const router = useRouter()
  const [blogs, setBlogs] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchBlogs() {
      setLoading(true)
      try {
        const fetchedBlogs = await getHealthBlogs(3) // Only fetch 3 for the homepage
        setBlogs(fetchedBlogs)
      } catch (error) {
        console.error("Error fetching blogs:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchBlogs()
    const disabledRightClick = (event : Event) => event.preventDefault();
    document.addEventListener('contextmenu' , disabledRightClick);
    return () => {
      document.removeEventListener('contextmenu' , disabledRightClick);
    }
    
  }, [])

  const handleGetStarted = () => {
    if (user) {
      router.push("/dashboard")
    } else {
      router.push("/book-appointment")
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <HeartPulse className="h-6 w-6 text-green-600" />
            <span className="text-xl font-bold">MediBites</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-sm font-medium hover:text-green-600 transition-colors">
              Home
            </Link>
            <Link href="#features" className="text-sm font-medium hover:text-green-600 transition-colors">
              Features
            </Link>
            <Link href="#services" className="text-sm font-medium hover:text-green-600 transition-colors">
              Services
            </Link>
            <Link href="#testimonials" className="text-sm font-medium hover:text-green-600 transition-colors">
              Testimonials
            </Link>
            <Link href="/blogs" className="text-sm font-medium hover:text-green-600 transition-colors">
              Blog
            </Link>
            <Link href="#faq" className="text-sm font-medium hover:text-green-600 transition-colors">
              FAQ
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            {user ? (
              <Button variant="outline" className="hidden md:flex" onClick={() => router.push("/dashboard")}>
                Dashboard
              </Button>
            ) : (
              <div className="hidden md:flex gap-2">
                <Button variant="outline" onClick={() => router.push("/login")}>
                  Patient Login
                </Button>
                <Button variant="outline" onClick={() => router.push("/doctor/login")}>
                  Doctor Login
                </Button>
              </div>
            )}
            <Button className="bg-green-600 hover:bg-green-700" onClick={handleGetStarted}>
              Get Started
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 xl:grid-cols-2">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                    Your <AnimatedHealth /> Our Priority
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
                    Advanced healthcare solutions with personalized care. Book appointments, access medical records, and
                    get expert advice all in one place.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Button className="bg-green-600 hover:bg-green-700" onClick={handleGetStarted}>
                    {user ? "View Dashboard" : "Book Appointment"}
                  </Button>
                  <Button variant="outline">Explore Services</Button>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <Image
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-CB0Q2IrIewq189ab2ddbv6R5xRH1g8.png"
                  width={550}
                  height={550}
                  alt="Medical Team"
                  className="rounded-lg object-cover"
                  priority
                />
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="w-full py-12 md:py-24">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-green-100 px-3 py-1 text-sm text-green-600">Features</div>
                <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">Comprehensive Healthcare Solutions</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl">
                  Our platform offers a wide range of features designed to make healthcare accessible and convenient.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 mt-8">
              <Card>
                <CardHeader>
                  <Calendar className="h-10 w-10 text-green-600 mb-2" />
                  <CardTitle>Appointment Booking</CardTitle>
                  <CardDescription>
                    Schedule appointments with doctors and specialists with just a few clicks.
                  </CardDescription>
                </CardHeader>
                <CardFooter>
                  <Button variant="outline" className="w-full">
                    Learn More
                  </Button>
                </CardFooter>
              </Card>
              <Card>
                <CardHeader>
                  <FileText className="h-10 w-10 text-green-600 mb-2" />
                  <CardTitle>Digital Medical Records</CardTitle>
                  <CardDescription>
                    Access your medical history, test results, and prescriptions anytime, anywhere.
                  </CardDescription>
                </CardHeader>
                <CardFooter>
                  <Button variant="outline" className="w-full">
                    Learn More
                  </Button>
                </CardFooter>
              </Card>
              <Card>
                <CardHeader>
                  <Stethoscope className="h-10 w-10 text-green-600 mb-2" />
                  <CardTitle>Telemedicine</CardTitle>
                  <CardDescription>
                    Consult with healthcare professionals remotely through secure video calls.
                  </CardDescription>
                </CardHeader>
                <CardFooter>
                  <Button variant="outline" className="w-full">
                    Learn More
                  </Button>
                </CardFooter>
              </Card>
              <Card>
                <CardHeader>
                  <Search className="h-10 w-10 text-green-600 mb-2" />
                  <CardTitle>FlexiCare</CardTitle>
                  <CardDescription>
                    Get a personalized AI workout guide
                  </CardDescription>
                </CardHeader>
                <CardFooter>
                  <Button variant="outline" className="w-full">
                    Learn More
                  </Button>
                </CardFooter>
              </Card>
              <Card>
                <CardHeader>
                  <PieChart className="h-10 w-10 text-green-600 mb-2" />
                  <CardTitle>Health Analytics</CardTitle>
                  <CardDescription>
                    Track your health metrics and receive personalized insights and recommendations.
                  </CardDescription>
                </CardHeader>
                <CardFooter>
                  <Button variant="outline" className="w-full">
                    Learn More
                  </Button>
                </CardFooter>
              </Card>
              <Card>
                <CardHeader>
                  <Phone className="h-10 w-10 text-green-600 mb-2" />
                  <CardTitle>Emergency Support</CardTitle>
                  <CardDescription>
                    Quick access to emergency contacts and services when you need them most.
                  </CardDescription>
                </CardHeader>
                <CardFooter>
                  <Button variant="outline" className="w-full">
                    Learn More
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </section>

        <section id="statistics" className="w-full py-12 md:py-24 bg-gray-50">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-green-100 px-3 py-1 text-sm text-green-600">Statistics</div>
                <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">Our Impact in Numbers</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl">
                  We're proud of the difference we've made in healthcare accessibility and patient outcomes.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl grid-cols-2 gap-6 md:grid-cols-4 mt-8">
              <Card className="text-center">
                <CardHeader className="pb-2">
                  <CardTitle className="text-4xl font-bold text-green-600">50k+</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm font-medium">Patients Served</p>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardHeader className="pb-2">
                  <CardTitle className="text-4xl font-bold text-green-600">500+</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm font-medium">Healthcare Providers</p>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardHeader className="pb-2">
                  <CardTitle className="text-4xl font-bold text-green-600">98%</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm font-medium">Patient Satisfaction</p>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardHeader className="pb-2">
                  <CardTitle className="text-4xl font-bold text-green-600">24/7</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm font-medium">Support Available</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section id="testimonials" className="w-full py-12 md:py-24">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-green-100 px-3 py-1 text-sm text-green-600">
                  Testimonials
                </div>
                <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">What Our Patients Say</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl">
                  Real stories from patients who have experienced our healthcare services.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 mt-8">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="rounded-full bg-green-100 p-2">
                      <Users className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Sarah Johnson</CardTitle>
                      <CardDescription>Patient since 2021</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    "The appointment booking system is so convenient. I can schedule appointments with my doctor
                    anytime, and the reminders ensure I never miss one."
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="rounded-full bg-green-100 p-2">
                      <Users className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Michael Brown</CardTitle>
                      <CardDescription>Patient since 2020</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    "Having all my medical records in one place has been a game-changer. I can access my test results
                    and prescriptions whenever I need them."
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="rounded-full bg-green-100 p-2">
                      <Users className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Emily Davis</CardTitle>
                      <CardDescription>Patient since 2022</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    "The telemedicine feature saved me during the pandemic. I could consult with my doctor without
                    leaving home, and the quality of care was excellent."
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section id="blog" className="w-full py-12 md:py-24 bg-gray-50">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-green-100 px-3 py-1 text-sm text-green-600">Health Blog</div>
                <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">Latest Health Articles</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl">
                  Stay informed with the latest health news, tips, and medical advancements.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 mt-8">
              {loading
                ? // Loading skeletons
                  Array(3)
                    .fill(0)
                    .map((_, index) => (
                      <Card key={index}>
                        <Skeleton className="w-full h-48 rounded-t-lg" />
                        <CardHeader>
                          <Skeleton className="h-6 w-3/4 mb-2" />
                          <Skeleton className="h-4 w-1/2" />
                        </CardHeader>
                        <CardContent>
                          <Skeleton className="h-4 w-full mb-2" />
                          <Skeleton className="h-4 w-full mb-2" />
                          <Skeleton className="h-4 w-3/4" />
                        </CardContent>
                        <CardFooter>
                          <Skeleton className="h-10 w-full" />
                        </CardFooter>
                      </Card>
                    ))
                : blogs.length > 0
                  ? blogs.map((blog) => (
                      <Card key={blog.id}>
                        <Image
                          src={blog.image_url || "/placeholder.svg"}
                          width={400}
                          height={200}
                          alt={blog.title}
                          className="w-full object-cover rounded-t-lg h-48"
                        />
                        <CardHeader>
                          <CardTitle className="line-clamp-2">{blog.title}</CardTitle>
                          <CardDescription>{formatPublishedDate(blog.published_at)}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground line-clamp-3">
                            {blog.description || "Read the full article for more information."}
                          </p>
                        </CardContent>
                        <CardFooter>
                          <Button variant="outline" className="w-full" onClick={() => router.push(`/blogs/${blog.id}`)}>
                            Read More
                          </Button>
                        </CardFooter>
                      </Card>
                    ))
                  : // Fallback content if no blogs are available
                    Array(3)
                      .fill(0)
                      .map((_, index) => (
                        <Card key={index}>
                          <Image
                            src="/placeholder.svg?height=200&width=400"
                            width={400}
                            height={200}
                            alt="Blog Image"
                            className="w-full object-cover rounded-t-lg h-48"
                          />
                          <CardHeader>
                            <CardTitle>Understanding Preventive Healthcare</CardTitle>
                            <CardDescription>May 10, 2023</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-muted-foreground">
                              Learn about the importance of preventive healthcare and how regular check-ups can help
                              detect health issues early.
                            </p>
                          </CardContent>
                          <CardFooter>
                            <Button variant="outline" className="w-full">
                              Read More
                            </Button>
                          </CardFooter>
                        </Card>
                      ))}
            </div>
            <div className="flex justify-center mt-8">
              <Button className="bg-green-600 hover:bg-green-700" onClick={() => router.push("/blogs")}>
                View All Articles
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </section>

        <section id="faq" className="w-full py-12 md:py-24">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-green-100 px-3 py-1 text-sm text-green-600">FAQs</div>
                <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">Frequently Asked Questions</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl">
                  Find answers to common questions about our services and healthcare in general.
                </p>
              </div>
            </div>
            <div className="mx-auto max-w-3xl space-y-4 mt-8">
              <Card>
                <CardHeader>
                  <CardTitle>How do I book an appointment?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    You can book an appointment through our online portal by selecting your preferred doctor, date, and
                    time. Alternatively, you can call our customer service number for assistance.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Can I access my medical records online?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Yes, all registered patients can access their medical records through our secure patient portal.
                    This includes test results, prescriptions, and doctor's notes.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>How does telemedicine work?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Telemedicine allows you to consult with healthcare professionals remotely through video calls. You
                    can book a telemedicine appointment through our portal and receive a link to join the video
                    consultation at the scheduled time.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>What should I do in case of a medical emergency?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    In case of a medical emergency, call emergency services immediately. Our platform also provides
                    quick access to emergency contacts and nearby emergency facilities.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section id="emergency" className="w-full py-12 md:py-24 bg-green-50">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-green-100 px-3 py-1 text-sm text-green-600">Emergency</div>
                <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">Emergency Contacts & Help</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl">
                  Quick access to emergency services and support when you need it most.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2 mt-8">
              <Card className="bg-red-50 border-red-200">
                <CardHeader>
                  <CardTitle className="text-red-600">Emergency Hotline</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 mb-4">
                    <Phone className="h-5 w-5 text-red-600" />
                    <span className="text-xl font-bold">911</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    For life-threatening emergencies, call 911 immediately.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>24/7 Medical Helpline</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 mb-4">
                    <Phone className="h-5 w-5 text-green-600" />
                    <span className="text-xl font-bold">1-800-MediBites</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    For medical advice and non-emergency situations, our medical professionals are available 24/7.
                  </p>
                </CardContent>
              </Card>
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Find Nearby Emergency Facilities</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                    <p className="text-muted-foreground">Interactive Map Placeholder</p>
                  </div>
                  <div className="mt-4">
                    <Button
                      className="w-full bg-green-600 hover:bg-green-700"
                      onClick={() => router.push("/nearby-hospitals")}
                    >
                      Find Nearest Emergency Room
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-24">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">
                  Ready to Take Control of Your Health?
                </h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl">
                  Join thousands of patients who have transformed their healthcare experience with our platform.
                </p>
              </div>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                <Button className="bg-green-600 hover:bg-green-700" onClick={handleGetStarted}>
                  Get Started Today
                </Button>
                <Button variant="outline">Contact Us</Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      <PartnershipBanner/>
      <footer className="w-full border-t bg-gray-50 py-12">
        <div className="container px-4 md:px-6">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-5">
            <div className="col-span-2 lg:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <HeartPulse className="h-6 w-6 text-green-600" />
                <span className="text-xl font-bold">MediBites</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Providing comprehensive healthcare solutions for a healthier tomorrow.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-4">Services</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="#" className="text-muted-foreground hover:text-green-600 transition-colors">
                    Appointments
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-muted-foreground hover:text-green-600 transition-colors">
                    Telemedicine
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-muted-foreground hover:text-green-600 transition-colors">
                    Medical Records
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-muted-foreground hover:text-green-600 transition-colors">
                    Find Specialists
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-4">Company</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/about-us" className="text-muted-foreground hover:text-green-600 transition-colors">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-muted-foreground hover:text-green-600 transition-colors">
                    Careers
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-muted-foreground hover:text-green-600 transition-colors">
                    Press
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-muted-foreground hover:text-green-600 transition-colors">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-4">Legal</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="#" className="text-muted-foreground hover:text-green-600 transition-colors">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-muted-foreground hover:text-green-600 transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-muted-foreground hover:text-green-600 transition-colors">
                    HIPAA Compliance
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-muted-foreground hover:text-green-600 transition-colors">
                    Accessibility
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          {/* Add this section right after your main hero section */}
          <div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground">
            <p>© 2023 MediBites. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}


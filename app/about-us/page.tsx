"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Github, Linkedin, Mail, Sparkles, Check } from "lucide-react";
import { NavigationMenu } from "@/components/ui/navigation-menu";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Calendar,
  Dumbbell,
  FileText,
  HeartPulse,
  Phone,
  PieChart,
  Search,
  Stethoscope,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/lib/auth-context";
import {
  type BlogPost,
  formatPublishedDate,
  getHealthBlogs,
} from "@/lib/blog-service";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatedHealth } from "@/components/animated-health";
import { PartnershipBanner } from "@/components/partner";

const teamMembers = [
  {
    name: "Vedant Deore",
    role: "Full Stack Developer",
    bio: "Passionate about creating innovative food tech solutions that enhance the dining experience.",
    image:
      "https://media.licdn.com/dms/image/v2/D4D03AQGBczx7Az5SFA/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1723009716230?e=1749081600&v=beta&t=yFFdfbfCxDn7Fpm2ALh3CXph1vdtecb7pFleaQ90ijY",
    linkedin: "https://www.linkedin.com/in/vedantdeore/",
    github: "https://github.com/vedantdeore",
    email: "vedant@MediBites.com",
  },
  {
    name: "Samyak Raka",
    role: "Backend Developer",
    bio: "Tech enthusiast with expertise in building scalable applications and AI-powered solutions.",
    image:
      "https://media.licdn.com/dms/image/v2/D4D03AQHca2m6F2mP4g/profile-displayphoto-shrink_800_800/B4DZXI.qKKG8Ac-/0/1742833624833?e=1749081600&v=beta&t=nkpyERgqkGJX4cNq0HJWOljIJwCxTlO1BXWeqa2WTr0",
    linkedin: "https://www.linkedin.com/in/samyakraka/",
    github: "https://github.com/samyakraka",
    email: "samyak@MediBites.com",
  },
  {
    name: "Ritesh Sakhare",
    role: "Frontend Developer",
    bio: "Product strategist focused on creating intuitive user experiences and solving customer pain points.",
    image:
      "https://media.licdn.com/dms/image/v2/D4D03AQGiNTE8gW2IYQ/profile-displayphoto-shrink_800_800/B4DZXyn3SVG8Ac-/0/1743532292388?e=1749081600&v=beta&t=XXvHTgPubF72lGqhuDxQCLFiYm7W_v8qzYXs_6vm2HA",
    linkedin: "https://www.linkedin.com/in/ritesh-sakhare-559342258/",
    github: "https://github.com/riteshsakhare",
    email: "ritesh.s@MediBites.com",
  },
  {
    name: "Ritesh Borse",
    role: "BlockChain Developer",
    bio: "Operations expert with a background in streamlining processes and ensuring customer satisfaction.",
    image:
      "https://media.licdn.com/dms/image/v2/D4D03AQHPVOtEVdufkA/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1709465192531?e=1749081600&v=beta&t=KC5qUIc7SDKOXTXCoJcXTZGYf1m6T6iML_cegqWoXdg",
    linkedin: "https://www.linkedin.com/in/ritesh-borse-293564223/",
    github: "https://github.com/riteshborse",
    email: "ritesh.b@MediBites.com",
  },
];

const values = [
  {
    title: "Innovation",
    description:
      "We constantly push the boundaries of what's possible in food tech to create better experiences.",
  },
  {
    title: "Quality",
    description:
      "We're committed to excellence in every aspect of our service and the food we help deliver.",
  },
  {
    title: "Community",
    description:
      "We believe in building strong relationships with customers, restaurants, and communities.",
  },
];

export default function AboutPage() {
  const { user } = useAuth();
  const router = useRouter();
  return (
    <div className="relative overflow-hidden bg-white">
      <header className="sticky top-0 z-50 w-full border-b bg-background">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <HeartPulse className="h-6 w-6 text-green-600" />
            <span className="text-xl font-bold">MediBites</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/"
              className="text-sm font-medium hover:text-green-600 transition-colors"
            >
              Home
            </Link>
            <Link
              href="#features"
              className="text-sm font-medium hover:text-green-600 transition-colors"
            >
              Features
            </Link>
            <Link
              href="#services"
              className="text-sm font-medium hover:text-green-600 transition-colors"
            >
              Services
            </Link>
            <Link
              href="#testimonials"
              className="text-sm font-medium hover:text-green-600 transition-colors"
            >
              Testimonials
            </Link>
            <Link
              href="/blogs"
              className="text-sm font-medium hover:text-green-600 transition-colors"
            >
              Blog
            </Link>
            <Link
              href="#faq"
              className="text-sm font-medium hover:text-green-600 transition-colors"
            >
              FAQ
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            {user ? (
              <Button
                variant="outline"
                className="hidden md:flex"
                onClick={() => router.push("/dashboard")}
              >
                Dashboard
              </Button>
            ) : (
              <div className="hidden md:flex gap-2">
                <Button variant="outline" onClick={() => router.push("/login")}>
                  Patient Login
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push("/doctor/login")}
                >
                  Doctor Login
                </Button>
              </div>
            )}
            <Button className="bg-green-600 hover:bg-green-700">
              Get Started
            </Button>
          </div>
        </div>
      </header>
      {/* Floating particles - adjusted for light theme */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.3, 0] }}
          transition={{
            duration: 4 + Math.random() * 4,
            repeat: Infinity,
            delay: Math.random() * 2,
            repeatDelay: Math.random() * 5,
          }}
          className="absolute"
          style={{
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            fontSize: `${8 + Math.random() * 8}px`,
          }}
        >
          <Sparkles className="text-green-400/70" />
        </motion.div>
      ))}

      <div className="container mx-auto py-12 relative z-10 px-14">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto mb-16 text-center"
        >
          <motion.h1
            className="text-4xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-green-500 to-green-700"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            About MediBites
          </motion.h1>
          <motion.p
            className="text-lg text-gray-600 mb-8 max-w-3xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Revolutionizing the restaurant experience through innovative
            technology and personalized service.
          </motion.p>
        </motion.div>

        {/* Mission Section */}
        <motion.section
          className="mb-16 bg-green-50 rounded-2xl p-8 border border-green-100"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <motion.h2
            className="text-2xl font-semibold mb-6 text-gray-800 flex items-center gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <Check className="h-6 w-6 text-green-600" />
            Our Mission
          </motion.h2>
          <motion.div
            className="space-y-4 text-gray-700"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            <p>
              At MediBites, we are dedicated to transforming healthcare through
              innovative technology and patient-centered solutions. Our mission
              is to make quality healthcare more accessible, efficient, and
              personalized for everyone.
            </p>
            <p>
              Our AI-powered platform helps patients connect with trusted
              healthcare providers, manage appointments seamlessly, and access
              personalized health insights. We empower doctors with intelligent
              tools to enhance patient care and improve health outcomes.
            </p>
          </motion.div>
        </motion.section>

        {/* Story Section */}
        <motion.section
          className="mb-16"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
        >
          <motion.h2
            className="text-2xl font-semibold mb-6 text-gray-800"
            whileInView={{ x: [-20, 0], opacity: [0, 1] }}
            viewport={{ once: true }}
          >
            Our Story
          </motion.h2>
          <motion.div
            className="grid md:grid-cols-2 gap-8"
            whileInView={{ opacity: [0, 1] }}
            viewport={{ once: true }}
          >
           <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100">
  <p className="text-gray-700">
    <strong>2023 – The Beginning:</strong>  
    MediBites was founded by a team of healthcare professionals and tech innovators with a vision to improve the way patients access medical care. What started as a simple idea to streamline patient-doctor interactions quickly grew into a comprehensive digital healthcare platform.
  </p>
</div>

<div className="bg-blue-50 rounded-2xl p-6 border border-blue-100">
  <p className="text-gray-700">
    <strong>2024 – Expansion & Growth:</strong>  
    Our platform expanded to support online appointment scheduling, AI-powered health insights, and remote consultations. We partnered with clinics and hospitals to make healthcare more accessible and efficient.
  </p>
</div>

<div className="bg-blue-50 rounded-2xl p-6 border border-blue-100">
  <p className="text-gray-700">
    <strong>Present – Empowering Healthcare:</strong>  
    Today, we serve thousands of patients and healthcare providers, helping to improve patient outcomes through advanced technology, data-driven insights, and seamless care coordination.
  </p>
</div>

          </motion.div>
        </motion.section>

        {/* Team Section */}
        <motion.section
          className="mb-16"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4 }}
        >
          <motion.h2
            className="text-2xl font-semibold mb-8 text-gray-800 text-center"
            whileInView={{ y: [20, 0], opacity: [0, 1] }}
            viewport={{ once: true }}
          >
            Meet Our Team
          </motion.h2>
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ staggerChildren: 0.1 }}
          >
            {teamMembers.map((member, index) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 * index }}
                whileHover={{ y: -5 }}
                className="bg-white rounded-2xl overflow-hidden border border-gray-200 hover:border-green-400 transition-all shadow-sm hover:shadow-md"
              >
                <div className="aspect-square relative">
                  <Image
                    src={member.image}
                    alt={member.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-gray-800">
                    {member.name}
                  </h3>
                  <p className="text-green-600 font-medium mb-3">
                    {member.role}
                  </p>
                  <p className="text-gray-600 mb-4">{member.bio}</p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="border-gray-300 text-gray-700 hover:bg-green-50 hover:border-green-400 hover:text-green-700"
                      asChild
                    >
                      <Link
                        href={member.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Linkedin className="h-4 w-4" />
                        <span className="sr-only">LinkedIn</span>
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="border-gray-300 text-gray-700 hover:bg-green-50 hover:border-green-400 hover:text-green-700"
                      asChild
                    >
                      <Link
                        href={member.github}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Github className="h-4 w-4" />
                        <span className="sr-only">GitHub</span>
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="border-gray-300 text-gray-700 hover:bg-green-50 hover:border-green-400 hover:text-green-700"
                      asChild
                    >
                      <Link href={`mailto:${member.email}`}>
                        <Mail className="h-4 w-4" />
                        <span className="sr-only">Email</span>
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </motion.div>
            ))}
          </motion.div>
        </motion.section>

        {/* Values Section */}
        <motion.section
          className="mb-16"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.6 }}
        >
          <motion.h2
            className="text-2xl font-semibold mb-8 text-gray-800 text-center"
            whileInView={{ y: [20, 0], opacity: [0, 1] }}
            viewport={{ once: true }}
          >
            Our Values
          </motion.h2>
          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ staggerChildren: 0.1 }}
          >
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 * index }}
                whileHover={{ scale: 1.03 }}
                className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-green-400 transition-all shadow-sm hover:shadow-md"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-green-100 p-2 rounded-full">
                    <Check className="h-5 w-5 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800">
                    {value.title}
                  </h3>
                </div>
                <p className="text-gray-600">{value.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </motion.section>

        {/* CTA Section */}
       
      </div>
      <footer className="w-full border-t bg-gray-50 py-12 ">
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
                  <Link href="#" className="text-muted-foreground hover:text-green-600 transition-colors">
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
          <div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground ">
            <p>© 2023 MediBites. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

"use client"

import Link from "next/link"
import { HeartPulse, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useDoctorAuth } from "@/lib/doctor-auth-context"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { usePathname } from "next/navigation"

interface DoctorMobileHeaderProps {
  title: string
}

export function DoctorMobileHeader({ title }: DoctorMobileHeaderProps) {
  const { doctor, logout } = useDoctorAuth()
  const pathname = usePathname()

  // Navigation items for the doctor mobile menu
  const navItems = [
    {
      title: "Dashboard",
      href: "/doctor/dashboard",
      icon: "dashboard",
    },
    {
      title: "My Schedule",
      href: "/doctor/dashboard/schedule",
      icon: "calendar",
    },
    {
      title: "Patients",
      href: "/doctor/dashboard/patients",
      icon: "users",
    },
    {
      title: "Profile",
      href: "/doctor/dashboard/profile",
      icon: "user",
    },
    {
      title: "Activity",
      href: "/doctor/dashboard/activity",
      icon: "activity",
    },
    {
      title: "Support",
      href: "/doctor/dashboard/support",
      icon: "message-square",
    },
    {
      title: "Settings",
      href: "/doctor/dashboard/settings",
      icon: "settings",
    },
  ]

  return (
    <header className="h-14 border-b flex items-center justify-between px-4 bg-background sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <div className="flex h-14 items-center border-b px-4">
              <Link href="/" className="flex items-center gap-2">
                <HeartPulse className="h-6 w-6 text-purple-600" />
                <span className="text-lg font-bold">MediBites</span>
              </Link>
            </div>
            <nav className="grid gap-1 p-2">
              {navItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-foreground",
                      isActive && "bg-purple-50 text-purple-600 font-medium",
                    )}
                  >
                    <span>{item.title}</span>
                  </Link>
                )
              })}
            </nav>
            <div className="mt-auto border-t p-4">
              <div className="flex items-center gap-3 mb-4">
                <Avatar>
                  {doctor?.profilePicture ? (
                    <AvatarImage src={doctor.profilePicture} alt={doctor.name} />
                  ) : (
                    <AvatarFallback className="bg-purple-100 text-purple-600">{doctor?.name?.charAt(0)}</AvatarFallback>
                  )}
                </Avatar>
                <div className="overflow-hidden">
                  <p className="text-sm font-medium leading-none truncate">{doctor?.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{doctor?.specialty}</p>
                </div>
              </div>
              <Button variant="outline" className="w-full justify-center gap-2" onClick={() => logout()}>
                Sign Out
              </Button>
            </div>
          </SheetContent>
        </Sheet>
        <h1 className="text-lg font-semibold">{title}</h1>
      </div>
      <Link href="/doctor/dashboard/profile">
        <Avatar className="h-8 w-8">
          {doctor?.profilePicture ? (
            <AvatarImage src={doctor.profilePicture} alt={doctor.name} />
          ) : (
            <AvatarFallback className="bg-purple-100 text-purple-600">{doctor?.name?.charAt(0)}</AvatarFallback>
          )}
        </Avatar>
      </Link>
    </header>
  )
}


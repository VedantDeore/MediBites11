"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Activity, Calendar, HeartPulse, Home, LogOut, MessageSquare, Settings, Users, User } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useDoctorAuth } from "@/lib/doctor-auth-context"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function DoctorNav() {
  const pathname = usePathname()
  const { doctor, logout } = useDoctorAuth()

  const navItems = [
    {
      title: "Dashboard",
      href: "/doctor/dashboard",
      icon: Home,
    },
    {
      title: "My Schedule",
      href: "/doctor/dashboard/schedule",
      icon: Calendar,
    },
    {
      title: "Patients",
      href: "/doctor/dashboard/patients",
      icon: Users,
    },
    {
      title: "Profile",
      href: "/doctor/dashboard/profile",
      icon: User,
    },
    {
      title: "Activity",
      href: "/doctor/dashboard/activity",
      icon: Activity,
    },
    {
      title: "Support",
      href: "/doctor/dashboard/support",
      icon: MessageSquare,
    },
    {
      title: "Settings",
      href: "/doctor/dashboard/settings",
      icon: Settings,
    },
  ]

  return (
    <div className="fixed left-0 top-0 bottom-0 w-64 flex flex-col border-r bg-white z-10">
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/" className="flex items-center gap-2">
          <HeartPulse className="h-6 w-6 text-purple-600" />
          <span className="text-lg font-bold">MediCare</span>
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto py-2">
        <nav className="grid items-start px-2 text-sm">
          {navItems.map((item, index) => (
            <Link
              key={index}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-foreground",
                pathname === item.href && "bg-purple-50 text-purple-600 font-medium",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.title}
            </Link>
          ))}
        </nav>
      </div>
      <div className="border-t p-4">
        <div className="flex items-center gap-3 mb-4">
          <Avatar>
            {doctor?.profilePicture ? (
              <AvatarImage src={doctor.profilePicture} alt={doctor.name} />
            ) : (
              <AvatarFallback className="bg-purple-100 text-purple-600">{doctor?.name.charAt(0)}</AvatarFallback>
            )}
          </Avatar>
          <div className="overflow-hidden">
            <p className="text-sm font-medium leading-none truncate">{doctor?.name}</p>
            <p className="text-xs text-muted-foreground truncate">{doctor?.specialty}</p>
          </div>
        </div>
        <Button variant="outline" className="w-full justify-start gap-2" onClick={() => logout()}>
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  )
}


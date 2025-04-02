"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Calendar, Users, User, LayoutDashboard, Activity } from "lucide-react"
import { cn } from "@/lib/utils"

export function DoctorBottomNav() {
  const pathname = usePathname()

  // Main navigation items for doctors
  const navItems = [
    {
      title: "Dashboard",
      href: "/doctor/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Schedule",
      href: "/doctor/dashboard/schedule",
      icon: Calendar,
    },
    {
      title: "Patients",
      href: "/doctor/dashboard/patients",
      icon: Users,
    },
    {
      title: "Activity",
      href: "/doctor/dashboard/activity",
      icon: Activity,
    },
    {
      title: "Profile",
      href: "/doctor/dashboard/profile",
      icon: User,
    },
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t flex justify-around items-center h-16 px-2">
      {navItems.map((item, index) => {
        // Check if the current path starts with the item's href
        const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))

        return (
          <Link
            key={index}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center gap-1 w-full h-full text-xs",
              isActive ? "text-purple-600" : "text-muted-foreground",
            )}
          >
            <item.icon className="h-5 w-5" />
            <span className="text-[10px]">{item.title}</span>
          </Link>
        )
      })}
    </div>
  )
}


"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Users, Stethoscope, CreditCard, Settings, LogOut, HeartPulse } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useAdminAuth } from "@/lib/admin-auth-context"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export function AdminNav() {
  const pathname = usePathname()
  const { admin, logout } = useAdminAuth()

  const navItems = [
    {
      title: "Dashboard",
      href: "/admin/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Patients",
      href: "/admin/patients",
      icon: Users,
    },
    {
      title: "Doctors",
      href: "/admin/doctors",
      icon: Stethoscope,
    },
    {
      title: "Transactions",
      href: "/admin/transactions",
      icon: CreditCard,
    },
    {
      title: "Settings",
      href: "/admin/settings",
      icon: Settings,
    },
  ]

  return (
    <div className="fixed left-0 top-0 h-full w-64 flex flex-col border-r bg-background z-10">
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/" className="flex items-center gap-2">
          <HeartPulse className="h-6 w-6 text-green-600" />
          <span className="text-lg font-bold">MediCare Admin</span>
        </Link>
      </div>
      <div className="flex-1 overflow-auto py-2">
        <nav className="grid items-start px-2 text-sm">
          {navItems.map((item, index) => {
            // Check if the current path starts with the item's href
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))

            return (
              <Link
                key={index}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-foreground",
                  isActive && "bg-green-50 text-green-600 font-medium",
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.title}
              </Link>
            )
          })}
        </nav>
      </div>
      <div className="mt-auto border-t p-4">
        <div className="flex items-center gap-3 mb-4">
          <Avatar>
            <AvatarFallback className="bg-green-100 text-green-600">{admin?.name?.charAt(0) || "A"}</AvatarFallback>
          </Avatar>
          <div className="overflow-hidden">
            <p className="text-sm font-medium leading-none truncate">{admin?.name || "Admin"}</p>
            <p className="text-xs text-muted-foreground truncate">{admin?.email || ""}</p>
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


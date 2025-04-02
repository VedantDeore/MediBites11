"use client"

import Link from "next/link"
import { HeartPulse, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAdminAuth } from "@/lib/admin-auth-context"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { usePathname } from "next/navigation"

interface AdminMobileHeaderProps {
  title: string
}

export function AdminMobileHeader({ title }: AdminMobileHeaderProps) {
  const { admin, logout } = useAdminAuth()
  const pathname = usePathname()

  // Navigation items for the mobile menu
  const navItems = [
    {
      title: "Dashboard",
      href: "/admin/dashboard",
      icon: "dashboard",
    },
    {
      title: "Patients",
      href: "/admin/patients",
      icon: "users",
    },
    {
      title: "Doctors",
      href: "/admin/doctors",
      icon: "stethoscope",
    },
    {
      title: "Transactions",
      href: "/admin/transactions",
      icon: "credit-card",
    },
    {
      title: "Settings",
      href: "/admin/settings",
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
                <HeartPulse className="h-6 w-6 text-green-600" />
                <span className="text-lg font-bold">MediCare Admin</span>
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
                      isActive && "bg-green-50 text-green-600 font-medium",
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
                  <AvatarFallback className="bg-green-100 text-green-600">
                    {admin?.name?.charAt(0) || "A"}
                  </AvatarFallback>
                </Avatar>
                <div className="overflow-hidden">
                  <p className="text-sm font-medium leading-none truncate">{admin?.name || "Admin"}</p>
                  <p className="text-xs text-muted-foreground truncate">{admin?.email || ""}</p>
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
      <Avatar className="h-8 w-8">
        <AvatarFallback className="bg-green-100 text-green-600">{admin?.name?.charAt(0) || "A"}</AvatarFallback>
      </Avatar>
    </header>
  )
}


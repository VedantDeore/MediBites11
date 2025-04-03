"use client"

import Link from "next/link"
import { HeartPulse, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { usePathname } from "next/navigation"

interface MobileHeaderProps {
  title: string
}

export function MobileHeader({ title }: MobileHeaderProps) {
  const { user, logout } = useAuth()
  const pathname = usePathname()

  // Navigation items for the mobile menu
  const navItems = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: "home",
    },
    {
      title: "SymptomSense AI",
      href: "/symptom-analyzer",
      icon: "stethoscope",
    },
    {
      title: "AI Booking",
      href: "/book-appointment",
      icon: "book",
    },
    {
      title: "Appointments",
      href: "/dashboard/appointments",
      icon: "calendar",
    },
    {
      title: "Medical Records",
      href: "/dashboard/records",
      icon: "file",
    },
    {
      title: "Health Analytics",
      href: "/dashboard/analytics",
      icon: "chart",
    },
    {
      title: "Consultations",
      href: "/dashboard/consultations",
      icon: "video",
    },
    {
      title: "Profile",
      href: "/dashboard/profile",
      icon: "user",
    },
    {
      title: "Settings",
      href: "/dashboard/settings",
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
                  {user?.profilePicture ? (
                    <AvatarImage src={user.profilePicture} alt={user.name} />
                  ) : (
                    <AvatarFallback className="bg-green-100 text-green-600">{user?.name?.charAt(0)}</AvatarFallback>
                  )}
                </Avatar>
                <div className="overflow-hidden">
                  <p className="text-sm font-medium leading-none truncate">{user?.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
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
      <Link href="/dashboard/profile">
        <Avatar className="h-8 w-8">
          {user?.profilePicture ? (
            <AvatarImage src={user.profilePicture} alt={user.name} />
          ) : (
            <AvatarFallback className="bg-green-100 text-green-600">{user?.name?.charAt(0)}</AvatarFallback>
          )}
        </Avatar>
      </Link>
    </header>
  )
}


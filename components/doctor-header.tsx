"use client"

import { Bell, Search, Settings } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useDoctorAuth } from "@/lib/doctor-auth-context"

export function DoctorHeader() {
  const { doctor } = useDoctorAuth()

  return (
    <header className="sticky top-0 z-10 h-16 border-b bg-white flex items-center px-6">
      <div className="flex-1 flex items-center">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input type="search" placeholder="Search patients..." className="w-full pl-8 bg-gray-50 border-none" />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500"></span>
        </Button>
        <Button variant="ghost" size="icon">
          <Settings className="h-5 w-5" />
        </Button>
        <Avatar className="h-8 w-8">
          {doctor?.profilePicture ? (
            <AvatarImage src={doctor.profilePicture} alt={doctor.name} />
          ) : (
            <AvatarFallback className="bg-purple-100 text-purple-600">{doctor?.name.charAt(0)}</AvatarFallback>
          )}
        </Avatar>
      </div>
    </header>
  )
}


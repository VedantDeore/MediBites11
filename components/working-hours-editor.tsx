"use client"
import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

// Define types for our working hours data structure
export type TimeSlot = {
  start: string
  end: string
  startPeriod: "AM" | "PM"
  endPeriod: "AM" | "PM"
}

export type WorkingHoursData = {
  [key: string]: {
    enabled: boolean
    timeSlots: TimeSlot[]
  }
}

// Default empty working hours structure
export const defaultWorkingHours: WorkingHoursData = {
  monday: { enabled: true, timeSlots: [{ start: "09:00", end: "05:00", startPeriod: "AM", endPeriod: "PM" }] },
  tuesday: { enabled: true, timeSlots: [{ start: "09:00", end: "05:00", startPeriod: "AM", endPeriod: "PM" }] },
  wednesday: { enabled: true, timeSlots: [{ start: "09:00", end: "05:00", startPeriod: "AM", endPeriod: "PM" }] },
  thursday: { enabled: true, timeSlots: [{ start: "09:00", end: "05:00", startPeriod: "AM", endPeriod: "PM" }] },
  friday: { enabled: true, timeSlots: [{ start: "09:00", end: "05:00", startPeriod: "AM", endPeriod: "PM" }] },
  saturday: { enabled: false, timeSlots: [{ start: "09:00", end: "01:00", startPeriod: "AM", endPeriod: "PM" }] },
  sunday: { enabled: false, timeSlots: [] },
}

// Helper function to format working hours for display
export const formatWorkingHours = (workingHours: WorkingHoursData): string => {
  const days = Object.keys(workingHours)
  const formattedDays = days
    .filter((day) => workingHours[day].enabled && workingHours[day].timeSlots.length > 0)
    .map((day) => {
      const dayName = day.charAt(0).toUpperCase() + day.slice(1)
      const timeSlots = workingHours[day].timeSlots
        .map((slot) => `${slot.start} ${slot.startPeriod} - ${slot.end} ${slot.endPeriod}`)
        .join(", ")
      return `${dayName}: ${timeSlots}`
    })
    .join("; ")

  return formattedDays || "No working hours set"
}

// Helper function to parse working hours from string format (for backward compatibility)
export const parseWorkingHours = (workingHoursData: any): WorkingHoursData => {
  // If it's already an object with the expected structure, return it
  if (workingHoursData && typeof workingHoursData === "object" && !Array.isArray(workingHoursData)) {
    // Check if it has at least one day key
    if (
      Object.keys(workingHoursData).some((key) =>
        ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].includes(key),
      )
    ) {
      return workingHoursData
    }
  }

  // If it's a string, try to parse it as JSON
  if (typeof workingHoursData === "string") {
    try {
      const parsed = JSON.parse(workingHoursData)
      if (parsed && typeof parsed === "object") {
        return parsed
      }
    } catch (e) {
      // If JSON parsing fails, it's probably the old text format
      // We'll return the default working hours
      console.log("Failed to parse working hours string as JSON, using default")
    }
  }

  // Return default working hours if all else fails
  return defaultWorkingHours
}

interface WorkingHoursEditorProps {
  value: WorkingHoursData
  onChange: (value: WorkingHoursData) => void
}

export function WorkingHoursEditor({ value, onChange }: WorkingHoursEditorProps) {
  const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
  const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, "0"))
  const minutes = ["00", "15", "30", "45"]

  const handleDayToggle = (day: string, enabled: boolean) => {
    onChange({
      ...value,
      [day]: {
        ...value[day],
        enabled,
      },
    })
  }

  const handleAddTimeSlot = (day: string) => {
    const newTimeSlot: TimeSlot = { start: "09:00", end: "05:00", startPeriod: "AM", endPeriod: "PM" }
    onChange({
      ...value,
      [day]: {
        ...value[day],
        timeSlots: [...value[day].timeSlots, newTimeSlot],
      },
    })
  }

  const handleRemoveTimeSlot = (day: string, index: number) => {
    onChange({
      ...value,
      [day]: {
        ...value[day],
        timeSlots: value[day].timeSlots.filter((_, i) => i !== index),
      },
    })
  }

  const handleTimeSlotChange = (day: string, index: number, field: keyof TimeSlot, newValue: string) => {
    const updatedTimeSlots = [...value[day].timeSlots]
    updatedTimeSlots[index] = {
      ...updatedTimeSlots[index],
      [field]: newValue,
    }

    onChange({
      ...value,
      [day]: {
        ...value[day],
        timeSlots: updatedTimeSlots,
      },
    })
  }

  return (
    <div className="space-y-4">
      {days.map((day) => (
        <Card key={day}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base capitalize">{day}</CardTitle>
              <div className="flex items-center space-x-2">
                <Switch
                  id={`${day}-toggle`}
                  checked={value[day]?.enabled || false}
                  onCheckedChange={(checked) => handleDayToggle(day, checked)}
                />
                <Label htmlFor={`${day}-toggle`} className="text-sm">
                  {value[day]?.enabled ? "Open" : "Closed"}
                </Label>
              </div>
            </div>
          </CardHeader>
          {value[day]?.enabled && (
            <CardContent>
              <div className="space-y-3">
                {value[day]?.timeSlots.map((timeSlot, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <div className="grid grid-cols-2 gap-2 flex-1">
                      <div className="flex items-center space-x-1">
                        <Select
                          value={timeSlot.start}
                          onValueChange={(newValue) => handleTimeSlotChange(day, index, "start", newValue)}
                        >
                          <SelectTrigger className="w-20">
                            <SelectValue placeholder="Start" />
                          </SelectTrigger>
                          <SelectContent>
                            {hours.map((hour) =>
                              minutes.map((minute) => (
                                <SelectItem key={`${hour}:${minute}`} value={`${hour}:${minute}`}>
                                  {hour}:{minute}
                                </SelectItem>
                              )),
                            )}
                          </SelectContent>
                        </Select>
                        <Select
                          value={timeSlot.startPeriod}
                          onValueChange={(newValue) =>
                            handleTimeSlotChange(day, index, "startPeriod", newValue as "AM" | "PM")
                          }
                        >
                          <SelectTrigger className="w-16">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="AM">AM</SelectItem>
                            <SelectItem value="PM">PM</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Select
                          value={timeSlot.end}
                          onValueChange={(newValue) => handleTimeSlotChange(day, index, "end", newValue)}
                        >
                          <SelectTrigger className="w-20">
                            <SelectValue placeholder="End" />
                          </SelectTrigger>
                          <SelectContent>
                            {hours.map((hour) =>
                              minutes.map((minute) => (
                                <SelectItem key={`${hour}:${minute}`} value={`${hour}:${minute}`}>
                                  {hour}:{minute}
                                </SelectItem>
                              )),
                            )}
                          </SelectContent>
                        </Select>
                        <Select
                          value={timeSlot.endPeriod}
                          onValueChange={(newValue) =>
                            handleTimeSlotChange(day, index, "endPeriod", newValue as "AM" | "PM")
                          }
                        >
                          <SelectTrigger className="w-16">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="AM">AM</SelectItem>
                            <SelectItem value="PM">PM</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveTimeSlot(day, index)}
                      disabled={value[day]?.timeSlots.length <= 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" className="mt-2" onClick={() => handleAddTimeSlot(day)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Time Slot
                </Button>
              </div>
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  )
}


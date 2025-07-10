"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { CalendarDays, Users, Phone, Video, Plus, ChevronLeft, ChevronRight } from "lucide-react"
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  parseISO,
} from "date-fns"

const appointmentTypes = [
  { value: "meeting", label: "Meeting", vietnamese: "Cuộc họp" },
  { value: "call", label: "Phone Call", vietnamese: "Cuộc gọi" },
  { value: "demo", label: "Demo", vietnamese: "Trình diễn" },
  { value: "presentation", label: "Presentation", vietnamese: "Thuyết trình" },
  { value: "followup", label: "Follow-up", vietnamese: "Theo dõi" },
]

const getAppointmentIcon = (type: string) => {
  switch (type) {
    case "meeting":
      return <Users className="h-3 w-3" />
    case "call":
      return <Phone className="h-3 w-3" />
    case "demo":
    case "presentation":
      return <Video className="h-3 w-3" />
    default:
      return <CalendarDays className="h-3 w-3" />
  }
}

const getAppointmentColor = (type: string) => {
  switch (type) {
    case "meeting":
      return "bg-blue-500 text-white"
    case "call":
      return "bg-green-500 text-white"
    case "demo":
    case "presentation":
      return "bg-purple-500 text-white"
    default:
      return "bg-gray-500 text-white"
  }
}

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date())
  const [appointments, setAppointments] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [newAppointment, setNewAppointment] = useState({
    title: "",
    type: "meeting",
    time: "",
    location: "",
    attendees: "",
    description: "",
  })

  // Fetch appointments from Supabase
  useEffect(() => {
    fetchAppointments()
    // eslint-disable-next-line
  }, [currentMonth])

  useEffect(() => {
  console.log("Appointments from Supabase: ", appointments);
}, [appointments]);

  
  const fetchAppointments = async () => {
    setLoading(true)
    // Get range for current month
    const start = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
    const end = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0, 23, 59, 59)
    const { data, error } = await supabase
      .from("appointments")
      .select("*")
      .gte("scheduled_at", start.toISOString())
      .lte("scheduled_at", end.toISOString())
      .order("scheduled_at", { ascending: true })

    if (!error && data) setAppointments(data)
    setLoading(false)
  }

  // Generate calendar grid
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 }) // Sunday
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  const handlePreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1))
  }

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1))
  }

  const handleDayClick = (date: Date) => {
    setSelectedDate(date)
    setNewAppointment({
      title: "",
      type: "meeting",
      time: "",
      location: "",
      attendees: "",
      description: "",
    })
    setIsDialogOpen(true)
  }

  // Save appointment to Supabase
  const handleSaveAppointment = async () => {
    if (!selectedDate || !newAppointment.title || !newAppointment.time) return
    setLoading(true)

    // Lấy user id từ session Supabase Auth
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (!user || userError) {
      alert("Bạn chưa đăng nhập hoặc không lấy được user id")
      setLoading(false)
      return
    }
    const userId = user.id

    // Combine date + time to ISO string
    const yyyy = selectedDate.getFullYear()
    const mm = String(selectedDate.getMonth() + 1).padStart(2, '0')
    const dd = String(selectedDate.getDate()).padStart(2, '0')
    const time = newAppointment.time // "09:00"
    const scheduled_at = `${yyyy}-${mm}-${dd}T${time}:00+07:00` // adjust timezone if needed

    // attendees là array (nếu cột trong DB là text[])
    const attendeesArray = newAppointment.attendees
      ? newAppointment.attendees.split(",").map((s) => s.trim())
      : []

    const { error } = await supabase.from("appointments").insert([{
      title: newAppointment.title,
      type: newAppointment.type,
      scheduled_at,
      note: newAppointment.description || newAppointment.location || "",
      attendees: attendeesArray,
      created_by: userId,
    }])

    if (!error) {
      await fetchAppointments()
      setIsDialogOpen(false)
      setSelectedDate(null)
    } else {
      alert("Lỗi khi tạo appointment: " + error.message)
    }
    setLoading(false)
  }

  // Chuyển đổi appointment từ Supabase sang format cho calendar grid
  const getAppointmentsForDate = (date: Date) => {
  const filtered = appointments.filter((apt) => {
    const aptDate = apt.scheduled_at ? parseISO(apt.scheduled_at) : null
    return aptDate && isSameDay(aptDate, date)
  });
  console.log("Date: ", date, "Filtered: ", filtered);
  return filtered.map((apt) => ({
    ...apt,
    time: apt.scheduled_at ? format(parseISO(apt.scheduled_at), "HH:mm") : "",
    description: apt.note || ""
  }))
}

  // Monthly statistics
  const monthlyAppointments = appointments.filter((apt) => {
    const aptDate = apt.scheduled_at ? parseISO(apt.scheduled_at) : null
    return aptDate &&
      aptDate.getMonth() === currentMonth.getMonth() &&
      aptDate.getFullYear() === currentMonth.getFullYear()
  })

  const stats = {
    total: monthlyAppointments.length,
    meetings: monthlyAppointments.filter((apt) => apt.type === "meeting").length,
    calls: monthlyAppointments.filter((apt) => apt.type === "call").length,
    demos: monthlyAppointments.filter((apt) => apt.type === "demo" || apt.type === "presentation").length,
  }

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  const dayNamesVietnamese = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"]

  return (
    <TooltipProvider>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
            <p className="text-muted-foreground">Lịch hẹn - Manage your appointments and schedule</p>
          </div>
          <Button className="gap-2" onClick={() => handleDayClick(new Date())}>
            <Plus className="h-4 w-4" />
            Schedule Appointment
            <span className="text-xs ml-1">Đặt lịch hẹn</span>
          </Button>
        </div>

        {/* Monthly Statistics */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Appointments</CardTitle>
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">Tổng số cuộc hẹn</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Meetings</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.meetings}</div>
              <p className="text-xs text-muted-foreground">Cuộc họp</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Calls</CardTitle>
              <Phone className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.calls}</div>
              <p className="text-xs text-muted-foreground">Cuộc gọi</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Demos</CardTitle>
              <Video className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.demos}</div>
              <p className="text-xs text-muted-foreground">Demo sản phẩm</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Calendar */}
        <div className="grid gap-8 lg:grid-cols-4">
          <div className="lg:col-span-3">
            <Card className="shadow-lg border-2">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePreviousMonth}
                    className="h-8 w-8 p-0 bg-transparent"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="text-center">
                    <CardTitle className="text-2xl font-bold">{format(currentMonth, "MMMM yyyy")}</CardTitle>
                    <CardDescription>
                      Click on any date to schedule an appointment / Nhấp vào ngày để đặt lịch
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleNextMonth} className="h-8 w-8 p-0 bg-transparent">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1 mb-4">
                  {/* Day Headers */}
                  {dayNames.map((day, index) => (
                    <div key={day} className="p-3 text-center font-semibold text-sm text-muted-foreground">
                      <div>{day}</div>
                      <div className="text-xs text-muted-foreground/70">{dayNamesVietnamese[index]}</div>
                    </div>
                  ))}
                </div>

                {/* Calendar Days */}
                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((day) => {
                    const dayAppointments = getAppointmentsForDate(day)
                    const isCurrentMonth = isSameMonth(day, currentMonth)
                    const isDayToday = isToday(day)

                    return (
                      <div
                        key={day.toISOString()}
                        onClick={() => handleDayClick(day)}
                        className={`
                          min-h-[100px] p-2 border border-gray-200 cursor-pointer transition-colors hover:bg-accent
                          ${isCurrentMonth ? "bg-white" : "bg-gray-50"}
                          ${isDayToday ? "bg-blue-50 border-blue-300 border-2" : ""}
                          relative
                        `}
                      >
                        <div
                          className={`
                            text-sm font-medium mb-1
                            ${isCurrentMonth ? "text-gray-900" : "text-gray-400"}
                            ${isDayToday ? "text-blue-600 font-bold" : ""}
                          `}
                        >
                          {format(day, "d")}
                        </div>

                        {/* Appointment indicators */}
                        <div className="space-y-1">
                          {dayAppointments.slice(0, 3).map((appointment: any) => (
                            <Tooltip key={appointment.id}>
                              <TooltipTrigger asChild>
                                <div
                                  className={`
                                    text-xs p-1 rounded text-white truncate flex items-center gap-1
                                    ${getAppointmentColor(appointment.type)}
                                  `}
                                >
                                  {getAppointmentIcon(appointment.type)}
                                  <span className="truncate">{appointment.time}</span>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <div className="text-sm">
                                  <div className="font-medium">{appointment.title}</div>
                                  <div className="text-xs">{appointment.time}</div>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          ))}
                          {dayAppointments.length > 3 && (
                            <div className="text-xs text-muted-foreground">+{dayAppointments.length - 3} more</div>
                          )}
                        </div>

                        {/* Appointment count badge */}
                        {dayAppointments.length > 0 && (
                          <Badge variant="secondary" className="absolute top-1 right-1 h-5 w-5 p-0 text-xs">
                            {dayAppointments.length}
                          </Badge>
                        )}
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
                <CardDescription>Hành động nhanh</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2 bg-transparent"
                  onClick={() => handleDayClick(new Date())}
                >
                  <Users className="h-4 w-4" />
                  Schedule Meeting
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2 bg-transparent"
                  onClick={() => {
                    setNewAppointment({ ...newAppointment, type: "call" })
                    handleDayClick(new Date())
                  }}
                >
                  <Phone className="h-4 w-4" />
                  Schedule Call
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2 bg-transparent"
                  onClick={() => {
                    setNewAppointment({ ...newAppointment, type: "demo" })
                    handleDayClick(new Date())
                  }}
                >
                  <Video className="h-4 w-4" />
                  Schedule Demo
                </Button>
              </CardContent>
            </Card>

            {/* Today's Appointments */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5" />
                  Today's Schedule
                </CardTitle>
                <CardDescription>Lịch trình hôm nay</CardDescription>
              </CardHeader>
              <CardContent>
                {getAppointmentsForDate(new Date()).length > 0 ? (
                  <div className="space-y-2">
                    {getAppointmentsForDate(new Date()).map((appointment: any) => (
                      <div key={appointment.id} className="flex items-center gap-2 p-2 border rounded">
                        <div className={`p-1 rounded ${getAppointmentColor(appointment.type)}`}>
                          {getAppointmentIcon(appointment.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{appointment.title}</div>
                          <div className="text-xs text-muted-foreground">{appointment.time}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No appointments today
                    <br />
                    Không có cuộc hẹn hôm nay
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Appointment Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Schedule Appointment</DialogTitle>
              <DialogDescription>
                Đặt lịch hẹn - Create a new appointment for {selectedDate && format(selectedDate, "MMMM d, yyyy")}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">
                  Title <span className="text-xs text-muted-foreground">/ Tiêu đề</span>
                </Label>
                <Input
                  id="title"
                  value={newAppointment.title}
                  onChange={(e) => setNewAppointment({ ...newAppointment, title: e.target.value })}
                  placeholder="Enter appointment title..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">
                    Type <span className="text-xs text-muted-foreground">/ Loại</span>
                  </Label>
                  <Select
                    value={newAppointment.type}
                    onValueChange={(value) => setNewAppointment({ ...newAppointment, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {appointmentTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label} / {type.vietnamese}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="time">
                    Time <span className="text-xs text-muted-foreground">/ Thời gian</span>
                  </Label>
                  <Input
                    id="time"
                    type="time"
                    value={newAppointment.time}
                    onChange={(e) => setNewAppointment({ ...newAppointment, time: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">
                  Location <span className="text-xs text-muted-foreground">/ Địa điểm</span>
                </Label>
                <Input
                  id="location"
                  value={newAppointment.location}
                  onChange={(e) => setNewAppointment({ ...newAppointment, location: e.target.value })}
                  placeholder="Meeting location..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="attendees">
                  Attendees <span className="text-xs text-muted-foreground">/ Người tham dự</span>
                </Label>
                <Input
                  id="attendees"
                  value={newAppointment.attendees}
                  onChange={(e) => setNewAppointment({ ...newAppointment, attendees: e.target.value })}
                  placeholder="Enter attendee names, separated by commas..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">
                  Description <span className="text-xs text-muted-foreground">/ Mô tả</span>
                </Label>
                <Textarea
                  id="description"
                  value={newAppointment.description}
                  onChange={(e) => setNewAppointment({ ...newAppointment, description: e.target.value })}
                  placeholder="Additional notes..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel / Hủy
              </Button>
              <Button onClick={handleSaveAppointment} disabled={!newAppointment.title || !newAppointment.time || loading}>
                {loading ? "Scheduling..." : "Schedule / Đặt lịch"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  )
}

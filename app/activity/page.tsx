"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Search, CalendarIcon, User, UserPlus, Edit, Mail, FileText, Settings, Download } from "lucide-react"
import { format } from "date-fns"
import type { DateRange } from "react-day-picker"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

// Mock activity data
const activities = [
  {
    id: 1,
    type: "contact_added",
    action: "Contact Added",
    vietnamese: "Đã thêm liên hệ",
    description: "John Smith was added to contacts",
    vietnameseDescription: "John Smith đã được thêm vào danh bạ",
    user: "Sarah Wilson",
    userAvatar: "/placeholder.svg?height=32&width=32",
    timestamp: "2024-01-15 10:30",
    details: {
      contactName: "John Smith",
      contactEmail: "john@company.com",
      source: "Website Form",
    },
  },
  {
    id: 2,
    type: "pipeline_moved",
    action: "Pipeline Updated",
    vietnamese: "Cập nhật quy trình",
    description: "Maria Garcia moved from Lead to Opportunity",
    vietnameseDescription: "Maria Garcia chuyển từ Lead sang Opportunity",
    user: "Mike Johnson",
    userAvatar: "/placeholder.svg?height=32&width=32",
    timestamp: "2024-01-15 09:45",
    details: {
      contactName: "Maria Garcia",
      fromStage: "Lead",
      toStage: "Opportunity",
      value: "$12,000",
    },
  },
  {
    id: 3,
    type: "appointment_scheduled",
    action: "Appointment Scheduled",
    vietnamese: "Đã lên lịch cuộc hẹn",
    description: "Demo meeting scheduled with David Wilson",
    vietnameseDescription: "Cuộc họp demo đã được lên lịch với David Wilson",
    user: "Lisa Brown",
    userAvatar: "/placeholder.svg?height=32&width=32",
    timestamp: "2024-01-15 08:20",
    details: {
      contactName: "David Wilson",
      appointmentDate: "2024-01-18 14:00",
      type: "Demo",
      duration: "60 minutes",
    },
  },
  {
    id: 4,
    type: "contact_edited",
    action: "Contact Updated",
    vietnamese: "Cập nhật liên hệ",
    description: "Updated contact information for Alice Johnson",
    vietnameseDescription: "Cập nhật thông tin liên hệ cho Alice Johnson",
    user: "Sarah Wilson",
    userAvatar: "/placeholder.svg?height=32&width=32",
    timestamp: "2024-01-14 16:15",
    details: {
      contactName: "Alice Johnson",
      fieldsUpdated: ["phone", "company"],
      previousCompany: "Old Corp",
      newCompany: "New Corp",
    },
  },
  {
    id: 5,
    type: "email_sent",
    action: "Email Sent",
    vietnamese: "Đã gửi email",
    description: "Follow-up email sent to Bob Smith",
    vietnameseDescription: "Email theo dõi đã được gửi cho Bob Smith",
    user: "Mike Johnson",
    userAvatar: "/placeholder.svg?height=32&width=32",
    timestamp: "2024-01-14 14:30",
    details: {
      contactName: "Bob Smith",
      subject: "Follow-up on our conversation",
      template: "Follow-up Template",
    },
  },
  {
    id: 6,
    type: "user_login",
    action: "User Login",
    vietnamese: "Đăng nhập",
    description: "Lisa Brown logged into the system",
    vietnameseDescription: "Lisa Brown đã đăng nhập vào hệ thống",
    user: "Lisa Brown",
    userAvatar: "/placeholder.svg?height=32&width=32",
    timestamp: "2024-01-14 09:00",
    details: {
      ipAddress: "192.168.1.100",
      device: "Chrome on Windows",
      location: "Ho Chi Minh City",
    },
  },
]

const activityTypes = [
  { value: "all", label: "All Activities / Tất cả hoạt động" },
  { value: "contact_added", label: "Contact Added / Thêm liên hệ" },
  { value: "contact_edited", label: "Contact Updated / Cập nhật liên hệ" },
  { value: "pipeline_moved", label: "Pipeline Changes / Thay đổi quy trình" },
  { value: "appointment_scheduled", label: "Appointments / Cuộc hẹn" },
  { value: "email_sent", label: "Email Sent / Gửi email" },
  { value: "user_login", label: "User Login / Đăng nhập" },
]

const users = ["All Users", "Sarah Wilson", "Mike Johnson", "Lisa Brown", "David Chen"]

export default function ActivityPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedType, setSelectedType] = useState("all")
  const [selectedUser, setSelectedUser] = useState("All Users")
  const [dateRange, setDateRange] = useState<DateRange | undefined>()

  const filteredActivities = activities.filter((activity) => {
    const matchesSearch =
      activity.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.user.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = selectedType === "all" || activity.type === selectedType
    const matchesUser = selectedUser === "All Users" || activity.user === selectedUser

    // Date range filtering would be implemented here
    return matchesSearch && matchesType && matchesUser
  })

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "contact_added":
        return UserPlus
      case "contact_edited":
        return Edit
      case "pipeline_moved":
        return FileText
      case "appointment_scheduled":
        return CalendarIcon
      case "email_sent":
        return Mail
      case "user_login":
        return User
      default:
        return Settings
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case "contact_added":
        return "bg-green-100 text-green-800"
      case "contact_edited":
        return "bg-blue-100 text-blue-800"
      case "pipeline_moved":
        return "bg-purple-100 text-purple-800"
      case "appointment_scheduled":
        return "bg-yellow-100 text-yellow-800"
      case "email_sent":
        return "bg-indigo-100 text-indigo-800"
      case "user_login":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const exportActivities = () => {
    // Create CSV content
    const headers = "Timestamp,User,Action,Description,Type"
    const csvData = filteredActivities
      .map(
        (activity) =>
          `${activity.timestamp},${activity.user},${activity.action},"${activity.description}",${activity.type}`,
      )
      .join("\n")

    const csvContent = `${headers}\n${csvData}`

    // Download file
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `activity_log_${format(new Date(), "yyyy-MM-dd")}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Activity Log</h1>
          <p className="text-muted-foreground">Nhật ký hoạt động hệ thống</p>
        </div>
        <Button onClick={exportActivities}>
          <Download className="mr-2 h-4 w-4" />
          Export Log / Xuất nhật ký
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters / Bộ lọc</CardTitle>
          <CardDescription>
            Filter activities by type, user, and date range
            <br />
            Lọc hoạt động theo loại, người dùng và khoảng thời gian
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search activities... / Tìm kiếm hoạt động..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger>
                <SelectValue placeholder="Activity Type / Loại hoạt động" />
              </SelectTrigger>
              <SelectContent>
                {activityTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger>
                <SelectValue placeholder="User / Người dùng" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user} value={user}>
                    {user}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-start text-left font-normal bg-transparent">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(dateRange.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Date range / Khoảng thời gian</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>
      </Card>

      {/* Activity Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                <FileText className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Total Activities</p>
                <p className="text-xs text-muted-foreground">Tổng hoạt động</p>
              </div>
            </div>
            <p className="text-2xl font-bold mt-2">{filteredActivities.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                <UserPlus className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Contacts Added</p>
                <p className="text-xs text-muted-foreground">Liên hệ đã thêm</p>
              </div>
            </div>
            <p className="text-2xl font-bold mt-2">
              {filteredActivities.filter((a) => a.type === "contact_added").length}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                <FileText className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Pipeline Changes</p>
                <p className="text-xs text-muted-foreground">Thay đổi quy trình</p>
              </div>
            </div>
            <p className="text-2xl font-bold mt-2">
              {filteredActivities.filter((a) => a.type === "pipeline_moved").length}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-yellow-100 flex items-center justify-center">
                <CalendarIcon className="h-4 w-4 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Appointments</p>
                <p className="text-xs text-muted-foreground">Cuộc hẹn</p>
              </div>
            </div>
            <p className="text-2xl font-bold mt-2">
              {filteredActivities.filter((a) => a.type === "appointment_scheduled").length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Activity Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Timeline ({filteredActivities.length})</CardTitle>
          <CardDescription>Dòng thời gian hoạt động ({filteredActivities.length})</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredActivities.map((activity, index) => {
              const IconComponent = getActivityIcon(activity.type)

              return (
                <div key={activity.id} className="flex gap-4 p-4 border rounded-lg">
                  <div className="flex-shrink-0">
                    <div
                      className={`h-10 w-10 rounded-full flex items-center justify-center ${getActivityColor(activity.type)}`}
                    >
                      <IconComponent className="h-5 w-5" />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm">{activity.action}</h4>
                      <Badge className={getActivityColor(activity.type)}>{activity.type.replace("_", " ")}</Badge>
                    </div>

                    <p className="text-xs text-muted-foreground mb-1">{activity.vietnamese}</p>

                    <p className="text-sm text-gray-700 mb-2">{activity.description}</p>

                    <p className="text-xs text-muted-foreground mb-2">{activity.vietnameseDescription}</p>

                    {/* Activity Details */}
                    {activity.details && (
                      <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                        {activity.type === "contact_added" && (
                          <div className="space-y-1">
                            <p>
                              <strong>Contact:</strong> {activity.details.contactName}
                            </p>
                            <p>
                              <strong>Email:</strong> {activity.details.contactEmail}
                            </p>
                            <p>
                              <strong>Source:</strong> {activity.details.source}
                            </p>
                          </div>
                        )}
                        {activity.type === "pipeline_moved" && (
                          <div className="space-y-1">
                            <p>
                              <strong>Contact:</strong> {activity.details.contactName}
                            </p>
                            <p>
                              <strong>From:</strong> {activity.details.fromStage} → <strong>To:</strong>{" "}
                              {activity.details.toStage}
                            </p>
                            <p>
                              <strong>Value:</strong> {activity.details.value}
                            </p>
                          </div>
                        )}
                        {activity.type === "appointment_scheduled" && (
                          <div className="space-y-1">
                            <p>
                              <strong>Contact:</strong> {activity.details.contactName}
                            </p>
                            <p>
                              <strong>Date:</strong> {activity.details.appointmentDate}
                            </p>
                            <p>
                              <strong>Type:</strong> {activity.details.type} ({activity.details.duration})
                            </p>
                          </div>
                        )}
                        {activity.type === "contact_edited" && (
                          <div className="space-y-1">
                            <p>
                              <strong>Contact:</strong> {activity.details.contactName}
                            </p>
                            <p>
                              <strong>Fields Updated:</strong> {activity.details.fieldsUpdated.join(", ")}
                            </p>
                            {activity.details.previousCompany && (
                              <p>
                                <strong>Company:</strong> {activity.details.previousCompany} →{" "}
                                {activity.details.newCompany}
                              </p>
                            )}
                          </div>
                        )}
                        {activity.type === "email_sent" && (
                          <div className="space-y-1">
                            <p>
                              <strong>To:</strong> {activity.details.contactName}
                            </p>
                            <p>
                              <strong>Subject:</strong> {activity.details.subject}
                            </p>
                            <p>
                              <strong>Template:</strong> {activity.details.template}
                            </p>
                          </div>
                        )}
                        {activity.type === "user_login" && (
                          <div className="space-y-1">
                            <p>
                              <strong>IP:</strong> {activity.details.ipAddress}
                            </p>
                            <p>
                              <strong>Device:</strong> {activity.details.device}
                            </p>
                            <p>
                              <strong>Location:</strong> {activity.details.location}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={activity.userAvatar || "/placeholder.svg"} />
                          <AvatarFallback>
                            {activity.user
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs font-medium">{activity.user}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{activity.timestamp}</span>
                    </div>
                  </div>
                </div>
              )
            })}

            {filteredActivities.length === 0 && (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No activities found</p>
                <p className="text-sm text-muted-foreground">Không tìm thấy hoạt động nào</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

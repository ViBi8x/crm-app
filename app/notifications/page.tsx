"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Bell, Calendar, User, Settings, Check } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

// Mock notifications data
const notifications = [
  {
    id: 1,
    type: "appointment",
    title: "Upcoming Appointment",
    vietnamese: "Cuộc hẹn sắp tới",
    message: "Meeting with John Smith in 30 minutes",
    vietnameseMessage: "Cuộc họp với John Smith trong 30 phút nữa",
    time: "2024-01-15 09:30",
    priority: "high",
    read: false,
    contactId: 1,
    contactName: "John Smith",
    avatar: "/placeholder.svg?height=32&width=32",
  },
  {
    id: 2,
    type: "contact",
    title: "New Contact Added",
    vietnamese: "Đã thêm liên hệ mới",
    message: "Maria Garcia has been added to your contacts",
    vietnameseMessage: "Maria Garcia đã được thêm vào danh bạ của bạn",
    time: "2024-01-15 08:45",
    priority: "medium",
    read: false,
    contactId: 2,
    contactName: "Maria Garcia",
    avatar: "/placeholder.svg?height=32&width=32",
  },
  {
    id: 3,
    type: "pipeline",
    title: "Contact Moved to Opportunity",
    vietnamese: "Liên hệ chuyển sang Cơ hội",
    message: "David Wilson moved to Opportunity stage",
    vietnameseMessage: "David Wilson đã chuyển sang giai đoạn Cơ hội",
    time: "2024-01-15 07:20",
    priority: "medium",
    read: true,
    contactId: 3,
    contactName: "David Wilson",
    avatar: "/placeholder.svg?height=32&width=32",
  },
  {
    id: 4,
    type: "system",
    title: "Weekly Report Ready",
    vietnamese: "Báo cáo tuần đã sẵn sàng",
    message: "Your weekly performance report is now available",
    vietnameseMessage: "Báo cáo hiệu suất tuần của bạn đã có sẵn",
    time: "2024-01-15 06:00",
    priority: "low",
    read: true,
    contactId: null,
    contactName: null,
    avatar: null,
  },
]

const notificationSettings = [
  {
    id: "appointments",
    title: "Appointment Reminders",
    vietnamese: "Nhắc nhở cuộc hẹn",
    description: "Get notified before appointments",
    vietnameseDescription: "Nhận thông báo trước cuộc hẹn",
    enabled: true,
  },
  {
    id: "new_contacts",
    title: "New Contacts",
    vietnamese: "Liên hệ mới",
    description: "Notifications when new contacts are added",
    vietnameseDescription: "Thông báo khi có liên hệ mới được thêm",
    enabled: true,
  },
  {
    id: "pipeline_changes",
    title: "Pipeline Changes",
    vietnamese: "Thay đổi quy trình",
    description: "Updates when contacts move between stages",
    vietnameseDescription: "Cập nhật khi liên hệ di chuyển giữa các giai đoạn",
    enabled: true,
  },
  {
    id: "system_updates",
    title: "System Updates",
    vietnamese: "Cập nhật hệ thống",
    description: "System maintenance and feature updates",
    vietnameseDescription: "Bảo trì hệ thống và cập nhật tính năng",
    enabled: false,
  },
  {
    id: "reports",
    title: "Reports",
    vietnamese: "Báo cáo",
    description: "Weekly and monthly performance reports",
    vietnameseDescription: "Báo cáo hiệu suất hàng tuần và hàng tháng",
    enabled: true,
  },
]

export default function NotificationsPage() {
  const [selectedFilter, setSelectedFilter] = useState("all")
  const [settings, setSettings] = useState(notificationSettings)

  const filteredNotifications = notifications.filter((notification) => {
    if (selectedFilter === "all") return true
    if (selectedFilter === "unread") return !notification.read
    if (selectedFilter === "high") return notification.priority === "high"
    return notification.type === selectedFilter
  })

  const unreadCount = notifications.filter((n) => !n.read).length

  const handleSettingChange = (settingId: string, enabled: boolean) => {
    setSettings(settings.map((setting) => (setting.id === settingId ? { ...setting, enabled } : setting)))
  }

  const markAsRead = (notificationId: number) => {
    // In a real app, this would update the backend
    console.log(`Marking notification ${notificationId} as read`)
  }

  const markAllAsRead = () => {
    // In a real app, this would update the backend
    console.log("Marking all notifications as read")
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "appointment":
        return Calendar
      case "contact":
        return User
      case "pipeline":
        return Bell
      case "system":
        return Settings
      default:
        return Bell
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "low":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground">
            Quản lý thông báo và cài đặt
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount} unread
              </Badge>
            )}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button onClick={markAllAsRead}>
            <Check className="mr-2 h-4 w-4" />
            Mark All Read / Đánh dấu đã đọc
          </Button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Notifications List */}
        <div className="md:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Recent Notifications / Thông báo gần đây</CardTitle>
                <Select value={selectedFilter} onValueChange={setSelectedFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All / Tất cả</SelectItem>
                    <SelectItem value="unread">Unread / Chưa đọc</SelectItem>
                    <SelectItem value="high">High Priority / Ưu tiên cao</SelectItem>
                    <SelectItem value="appointment">Appointments / Cuộc hẹn</SelectItem>
                    <SelectItem value="contact">Contacts / Liên hệ</SelectItem>
                    <SelectItem value="pipeline">Pipeline / Quy trình</SelectItem>
                    <SelectItem value="system">System / Hệ thống</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredNotifications.map((notification) => {
                  const IconComponent = getNotificationIcon(notification.type)

                  return (
                    <div
                      key={notification.id}
                      className={`flex items-start gap-4 p-4 rounded-lg border ${
                        !notification.read ? "bg-blue-50 border-blue-200" : "bg-white"
                      }`}
                    >
                      <div className="flex-shrink-0">
                        {notification.avatar ? (
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={notification.avatar || "/placeholder.svg"} />
                            <AvatarFallback>
                              {notification.contactName
                                ?.split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                            <IconComponent className="h-5 w-5 text-gray-600" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-sm">{notification.title}</h4>
                          <Badge className={getPriorityColor(notification.priority)}>{notification.priority}</Badge>
                          {!notification.read && <div className="h-2 w-2 bg-blue-600 rounded-full"></div>}
                        </div>
                        <p className="text-xs text-muted-foreground mb-1">{notification.vietnamese}</p>
                        <p className="text-sm text-gray-700 mb-2">{notification.message}</p>
                        <p className="text-xs text-muted-foreground mb-2">{notification.vietnameseMessage}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">{notification.time}</span>
                          <div className="flex gap-2">
                            {notification.contactId && (
                              <Button variant="ghost" size="sm" onClick={() => (window.location.href = `/contacts`)}>
                                View Contact / Xem liên hệ
                              </Button>
                            )}
                            {!notification.read && (
                              <Button variant="ghost" size="sm" onClick={() => markAsRead(notification.id)}>
                                <Check className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}

                {filteredNotifications.length === 0 && (
                  <div className="text-center py-8">
                    <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No notifications found</p>
                    <p className="text-sm text-muted-foreground">Không tìm thấy thông báo</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Notification Settings */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>Cài đặt thông báo</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {settings.map((setting) => (
                  <div key={setting.id} className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor={setting.id} className="text-sm font-medium">
                        {setting.title}
                      </Label>
                      <p className="text-xs text-muted-foreground">{setting.vietnamese}</p>
                      <p className="text-xs text-muted-foreground">{setting.description}</p>
                    </div>
                    <Switch
                      id={setting.id}
                      checked={setting.enabled}
                      onCheckedChange={(checked) => handleSettingChange(setting.id, checked)}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Notification Stats</CardTitle>
              <CardDescription>Thống kê thông báo</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">Total / Tổng</span>
                  <span className="font-medium">{notifications.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Unread / Chưa đọc</span>
                  <span className="font-medium text-red-600">{unreadCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">High Priority / Ưu tiên cao</span>
                  <span className="font-medium text-yellow-600">
                    {notifications.filter((n) => n.priority === "high").length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Today / Hôm nay</span>
                  <span className="font-medium text-blue-600">
                    {notifications.filter((n) => n.time.includes("2024-01-15")).length}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

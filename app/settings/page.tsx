"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User, Mail, Calendar, BarChart3, LogOut, Key, Camera } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

// Mock user data
const currentUser = {
  id: 1,
  name: "John Doe",
  email: "john@company.com",
  phone: "+1 234 567 8900",
  role: "Admin",
  avatar: "/placeholder.svg?height=80&width=80",
  joinDate: "2024-01-01",
  lastLogin: "2024-01-15 09:30",
  stats: {
    totalContacts: 1247,
    contactsThisMonth: 127,
    appointmentsThisWeek: 8,
    conversionRate: 24.8,
  },
}

export default function SettingsPage() {
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [formData, setFormData] = useState({
    name: currentUser.name,
    email: currentUser.email,
    phone: currentUser.phone,
  })
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  const handleProfileUpdate = () => {
    // In a real app, this would update the backend
    console.log("Updating profile:", formData)
    setIsEditingProfile(false)
  }

  const handlePasswordChange = () => {
    // In a real app, this would update the backend
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert("Passwords do not match / Mật khẩu không khớp")
      return
    }
    console.log("Changing password")
    setIsChangingPassword(false)
    setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" })
  }

  const handleSignOut = () => {
    // In a real app, this would sign out the user
    console.log("Signing out")
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Account Settings</h1>
        <p className="text-muted-foreground">Cài đặt tài khoản và thông tin cá nhân</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Information */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information / Thông tin cá nhân</CardTitle>
              <CardDescription>
                Manage your personal information and account details
                <br />
                Quản lý thông tin cá nhân và chi tiết tài khoản
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Avatar Section */}
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={currentUser.avatar || "/placeholder.svg"} />
                    <AvatarFallback>
                      {currentUser.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">{currentUser.name}</h3>
                    <p className="text-muted-foreground">{currentUser.email}</p>
                    <div className="flex gap-2 mt-2">
                      <Badge className="bg-blue-100 text-blue-800">{currentUser.role}</Badge>
                      <Badge variant="outline">Member since {currentUser.joinDate}</Badge>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    <Camera className="mr-2 h-4 w-4" />
                    Change Photo / Đổi ảnh
                  </Button>
                </div>

                <Separator />

                {/* Profile Form */}
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name / Họ và tên</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        disabled={!isEditingProfile}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address / Địa chỉ email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        disabled={!isEditingProfile}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number / Số điện thoại</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      disabled={!isEditingProfile}
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  {isEditingProfile ? (
                    <>
                      <Button onClick={handleProfileUpdate}>Save Changes / Lưu thay đổi</Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsEditingProfile(false)
                          setFormData({
                            name: currentUser.name,
                            email: currentUser.email,
                            phone: currentUser.phone,
                          })
                        }}
                      >
                        Cancel / Hủy
                      </Button>
                    </>
                  ) : (
                    <Button onClick={() => setIsEditingProfile(true)}>
                      <User className="mr-2 h-4 w-4" />
                      Edit Profile / Sửa hồ sơ
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Security Settings / Cài đặt bảo mật</CardTitle>
              <CardDescription>
                Manage your password and security preferences
                <br />
                Quản lý mật khẩu và tùy chọn bảo mật
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Key className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Password / Mật khẩu</p>
                      <p className="text-sm text-muted-foreground">
                        Last changed 30 days ago / Thay đổi lần cuối 30 ngày trước
                      </p>
                    </div>
                  </div>
                  <Dialog open={isChangingPassword} onOpenChange={setIsChangingPassword}>
                    <DialogTrigger asChild>
                      <Button variant="outline">Change Password / Đổi mật khẩu</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Change Password / Đổi mật khẩu</DialogTitle>
                        <DialogDescription>
                          Enter your current password and choose a new one
                          <br />
                          Nhập mật khẩu hiện tại và chọn mật khẩu mới
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="current-password">Current Password / Mật khẩu hiện tại</Label>
                          <Input
                            id="current-password"
                            type="password"
                            value={passwordData.currentPassword}
                            onChange={(e) =>
                              setPasswordData({
                                ...passwordData,
                                currentPassword: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="new-password">New Password / Mật khẩu mới</Label>
                          <Input
                            id="new-password"
                            type="password"
                            value={passwordData.newPassword}
                            onChange={(e) =>
                              setPasswordData({
                                ...passwordData,
                                newPassword: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="confirm-password">Confirm New Password / Xác nhận mật khẩu mới</Label>
                          <Input
                            id="confirm-password"
                            type="password"
                            value={passwordData.confirmPassword}
                            onChange={(e) =>
                              setPasswordData({
                                ...passwordData,
                                confirmPassword: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsChangingPassword(false)}>
                          Cancel / Hủy
                        </Button>
                        <Button onClick={handlePasswordChange}>Update Password / Cập nhật mật khẩu</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <LogOut className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Sign Out / Đăng xuất</p>
                      <p className="text-sm text-muted-foreground">
                        Sign out from all devices / Đăng xuất khỏi tất cả thiết bị
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" onClick={handleSignOut}>
                    Sign Out / Đăng xuất
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Statistics Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Account Statistics</CardTitle>
              <CardDescription>Thống kê tài khoản</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <User className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">{currentUser.stats.totalContacts}</p>
                    <p className="text-sm text-muted-foreground">Total Contacts / Tổng liên hệ</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                    <Mail className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">{currentUser.stats.contactsThisMonth}</p>
                    <p className="text-sm text-muted-foreground">This Month / Tháng này</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="font-medium">{currentUser.stats.appointmentsThisWeek}</p>
                    <p className="text-sm text-muted-foreground">Appointments / Cuộc hẹn</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                    <BarChart3 className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium">{currentUser.stats.conversionRate}%</p>
                    <p className="text-sm text-muted-foreground">Conversion Rate / Tỷ lệ chuyển đổi</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Account Activity</CardTitle>
              <CardDescription>Hoạt động tài khoản</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Last Login / Đăng nhập cuối</span>
                  <span className="font-medium">{currentUser.lastLogin}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Member Since / Thành viên từ</span>
                  <span className="font-medium">{currentUser.joinDate}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Account Type / Loại tài khoản</span>
                  <Badge className="bg-blue-100 text-blue-800">{currentUser.role}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

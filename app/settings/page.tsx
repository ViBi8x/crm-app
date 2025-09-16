"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/components/auth-provider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Mail, Calendar, BarChart3, LogOut, Key, Camera } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Hàm lấy ký tự viết tắt cho Avatar
const getInitials = (name?: string) =>
  name
    ? name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "";

export default function SettingsPage() {
  const { user, logout } = useAuth(); // lấy user từ Auth context
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Form states
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", phone: "" });

  // Password states
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Avatar
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Stats
  const [stats, setStats] = useState({
    totalContacts: 0,
    contactsThisMonth: 0,
    appointmentsThisWeek: 0,
    conversionRate: 0,
  });

  // ===== Lấy dữ liệu thực tế
  useEffect(() => {
    if (!user) return;

    const fetchProfile = async () => {
      setIsLoading(true);
      const { data: profileData, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      if (error) {
        toast.error("Không lấy được thông tin profile!");
        setIsLoading(false);
        return;
      }
      setProfile(profileData);
      setFormData({
        name: profileData.full_name ?? "",
        email: profileData.email ?? user.email ?? "",
        phone: profileData.phone ?? "",
      });
      setIsLoading(false);
    };

    fetchProfile();
  }, [user]);

  // Lấy thống kê
  useEffect(() => {
    if (!user) return;

    const fetchStats = async () => {
      // 1. Tổng liên hệ
      const { count: totalContacts } = await supabase
        .from("contacts")
        .select("*", { count: "exact", head: true })
        .eq("created_by", user.id);

      // 2. Liên hệ trong tháng này
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const { count: contactsThisMonth } = await supabase
        .from("contacts")
        .select("*", { count: "exact", head: true })
        .eq("created_by", user.id)
        .gte("created_at", startOfMonth.toISOString());

      // 3. Cuộc hẹn tuần này
      const now2 = new Date();
      const firstDayOfWeek = new Date(now2.setDate(now2.getDate() - now2.getDay()));
      firstDayOfWeek.setHours(0, 0, 0, 0);
      const { count: appointmentsThisWeek } = await supabase
        .from("appointments")
        .select("*", { count: "exact", head: true })
        .eq("created_by", user.id)
        .gte("created_at", firstDayOfWeek.toISOString());

      // 4. Tỷ lệ chuyển đổi (contacts đã trở thành Customer)
      const { count: convertedContacts } = await supabase
        .from("contacts")
        .select("*", { count: "exact", head: true })
        .eq("created_by", user.id)
        .eq("life_stage", "Customer");

      setStats({
        totalContacts: totalContacts || 0,
        contactsThisMonth: contactsThisMonth || 0,
        appointmentsThisWeek: appointmentsThisWeek || 0,
        conversionRate: totalContacts
          ? Math.round(((convertedContacts || 0) / totalContacts) * 1000) / 10
          : 0,
      });
    };

    fetchStats();
  }, [user]);

  // Hoạt động tài khoản
  const joinDate = profile?.created_at?.split("T")[0] || "";
  const role = profile?.role || "user";

  // ==== Sửa thông tin cá nhân
  const handleProfileUpdate = async () => {
    if (!profile) return;
    setIsLoading(true);

    const updates = {
      full_name: formData.name,
      phone: formData.phone,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", user.id);

    setIsLoading(false);

    if (error) {
      console.log("Supabase update error:", error);
      toast.error("Cập nhật thất bại! " + error.message);
    } else {
      setProfile({ ...profile, ...updates });
      setIsEditingProfile(false);
      toast.success("Đã lưu thay đổi!");
    }
  };

  // ==== Đổi mật khẩu
  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("Mật khẩu không khớp!");
      return;
    }
    setIsLoading(true);
    const { error } = await supabase.auth.updateUser({ password: passwordData.newPassword });
    setIsLoading(false);
    if (error) {
      toast.error("Đổi mật khẩu thất bại!");
    } else {
      setIsChangingPassword(false);
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      toast.success("Đã đổi mật khẩu!");
    }
  };

  // ==== Đổi Avatar (avatar_url)
  const handleAvatarUpload = async (file: File) => {
    if (!file) {
      toast.error("Không có file ảnh nào được chọn!");
      return;
    }
    if (file.size > 1024 * 1024) {
      toast.error("Vui lòng chọn ảnh dung lượng tối đa 1Mb!");
      return;
    }
    setIsUploadingAvatar(true);

    try {
      const ext = file.name.split('.').pop();
      const fileName = `${user.id}_${Date.now()}.${ext}`;
      // Upload file lên bucket 'avatars'
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, { upsert: true });

      if (uploadError) {
        setIsUploadingAvatar(false);
        toast.error("Upload ảnh thất bại!");
        console.error("[AvatarUpload] Upload error:", uploadError);
        return;
      }

      // Lấy public url
      const { data: publicUrlData, error: getUrlError } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);

      if (getUrlError) {
        setIsUploadingAvatar(false);
        toast.error("Không lấy được URL ảnh!");
        console.error("[AvatarUpload] Get public url error:", getUrlError);
        return;
      }

      const avatarUrl = publicUrlData?.publicUrl;
      if (!avatarUrl) {
        setIsUploadingAvatar(false);
        toast.error("Không lấy được URL ảnh!");
        return;
      }

      // Update vào profile field avatar_url
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: avatarUrl })
        .eq("id", user.id);

      if (updateError) {
        toast.error("Lưu ảnh đại diện thất bại!");
        console.error("[AvatarUpload] Update profile error:", updateError);
      } else {
        setProfile((prev) => ({ ...prev, avatar_url: avatarUrl }));
        toast.success("Đã cập nhật ảnh đại diện!");
      }
    } catch (err) {
      toast.error("Có lỗi xảy ra khi upload!");
      console.error("[AvatarUpload] Unknown error:", err);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // ==== Đăng xuất
  const handleSignOut = async () => {
    await logout();
    // window.location.href = "/login"; // tuỳ ý
  };

  if (isLoading || !profile) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <span>Đang tải dữ liệu...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Account Settings</h1>
        <p className="text-muted-foreground">Cài đặt tài khoản và thông tin cá nhân</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile + Security */}
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
                {/* Avatar */}
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={profile.avatar_url || "/placeholder.svg"} />
                    <AvatarFallback>{getInitials(profile.full_name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">{profile.full_name}</h3>
                    <p className="text-muted-foreground">{profile.email || user.email}</p>
                    <div className="flex gap-2 mt-2">
                      <Badge className="bg-blue-100 text-blue-800">{profile.role || "User"}</Badge>
                      <Badge variant="outline">Member since {joinDate}</Badge>
                    </div>
                  </div>
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      ref={fileInputRef}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) await handleAvatarUpload(file);
                      }}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isUploadingAvatar}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Camera className="mr-2 h-4 w-4" />
                      {isUploadingAvatar ? "Đang tải..." : "Đổi ảnh"}
                    </Button>
                    <div className="text-xs text-gray-400 mt-1">
                      Ảnh tối đa 1Mb. Nên dùng ảnh vuông (1:1) để hiển thị đẹp nhất.
                    </div>
                  </div>
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
                        disabled
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
                      <Button onClick={handleProfileUpdate}>Lưu thay đổi</Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsEditingProfile(false);
                          setFormData({
                            name: profile.full_name,
                            email: profile.email || user.email,
                            phone: profile.phone || "",
                          });
                        }}
                      >
                        Hủy
                      </Button>
                    </>
                  ) : (
                    <Button onClick={() => setIsEditingProfile(true)}>
                      <User className="mr-2 h-4 w-4" />
                      Sửa hồ sơ
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Cài đặt bảo mật</CardTitle>
              <CardDescription>
                Quản lý mật khẩu và tùy chọn bảo mật
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Change Password */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Key className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Mật khẩu</p>
                      <p className="text-sm text-muted-foreground">
                        Đổi mật khẩu định kỳ để bảo mật tài khoản
                      </p>
                    </div>
                  </div>
                  <Dialog open={isChangingPassword} onOpenChange={setIsChangingPassword}>
                    <DialogTrigger asChild>
                      <Button variant="outline">Đổi mật khẩu</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Đổi mật khẩu</DialogTitle>
                        <DialogDescription>
                          Nhập mật khẩu hiện tại và mật khẩu mới
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="current-password">Mật khẩu hiện tại</Label>
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
                          <Label htmlFor="new-password">Mật khẩu mới</Label>
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
                          <Label htmlFor="confirm-password">Xác nhận mật khẩu mới</Label>
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
                          Hủy
                        </Button>
                        <Button onClick={handlePasswordChange}>Cập nhật mật khẩu</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* Sign Out */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <LogOut className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Đăng xuất</p>
                      <p className="text-sm text-muted-foreground">
                        Đăng xuất khỏi tất cả thiết bị
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" onClick={handleSignOut}>
                    Đăng xuất
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Thống kê */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Thống kê tài khoản</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <User className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">{stats.totalContacts}</p>
                    <p className="text-sm text-muted-foreground">Tổng liên hệ</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                    <Mail className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">{stats.contactsThisMonth}</p>
                    <p className="text-sm text-muted-foreground">Tháng này</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="font-medium">{stats.appointmentsThisWeek}</p>
                    <p className="text-sm text-muted-foreground">Cuộc hẹn</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                    <BarChart3 className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium">{stats.conversionRate}%</p>
                    <p className="text-sm text-muted-foreground">Tỷ lệ chuyển đổi</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Hoạt động tài khoản</CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <div>
                  <span>Thành viên từ</span>
                  <span className="ml-2 font-medium">{joinDate}</span>
                </div>
                <div>
                  <span>Loại tài khoản</span>
                  <Badge className="ml-2 bg-blue-100 text-blue-800">{role}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, Calendar, User, Settings, Check } from "lucide-react";
import { toast } from "sonner";
import {
  fetchNotifications,
  markAsRead,
  markAllAsRead,
  getNotificationStats,
  updateNotificationSettings,
  setupRealtimeNotifications,
} from "@/lib/supabaseClient";
import { useAuth } from "@/components/auth-provider";
import { supabase } from "@/lib/supabaseClient";

interface Notification {
  id: string;
  type: string;
  payload: { en: { title: string; message: string }; vi: { title: string; message: string } };
  time: string;
  priority: string;
  read_at: string | null;
  link: string | null;
  contact_id: string | null;
  contact_name: string | null;
  actor_id: string | null;
}

interface NotificationSetting {
  id: string;
  title: string;
  vietnamese: string;
  description: string;
  vietnameseDescription: string;
  enabled: boolean;
}

export default function NotificationsPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [settings, setSettings] = useState<NotificationSetting[]>([]);
  const [stats, setStats] = useState({ total: 0, unread: 0, highPriority: 0, today: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("Auth state:", { isLoading, isAuthenticated, userId: user?.id, user: user });
    if (isLoading) {
      console.log("Waiting for auth to complete...");
      return;
    }
    if (!isAuthenticated || !user?.id) {
      console.error("Authentication failed:", { isAuthenticated, userId: user?.id });
      toast.error("Please log in to view notifications / Vui lòng đăng nhập để xem thông báo");
      return;
    }

    console.log("Logged in userId:", user.id);

    async function loadData() {
      setLoading(true);
      try {
        const data = await fetchNotifications(user.id, {
          status: selectedFilter === "unread" ? "unread" : undefined,
          type: selectedFilter !== "all" && selectedFilter !== "unread" && selectedFilter !== "high" ? selectedFilter : undefined,
          priority: selectedFilter === "high" ? "high" : undefined,
        });
        console.log("Notifications fetched:", data);
        setNotifications(data);

        const statsData = await getNotificationStats(user.id);
        console.log("Stats fetched:", statsData);
        setStats(statsData);

        const { data: settingsData, error: settingsError } = await supabase
          .from("notification_settings")
          .select("*")
          .eq("user_id", user.id);
        if (settingsError) {
          console.error("Error fetching settings:", settingsError);
          throw settingsError;
        }
        console.log("Settings fetched:", settingsData);
        if (settingsData) {
          setSettings(
            settingsData.map((s: any) => ({
              id: s.type,
              title: {
                appointments: "Appointment Reminders",
                new_contacts: "New Contacts",
                pipeline_changes: "Pipeline Updates",
                system_updates: "System Updates",
                reports: "Reports",
              }[s.type] || s.type,
              vietnamese: {
                appointments: "Nhắc nhở cuộc hẹn",
                new_contacts: "Liên hệ mới",
                pipeline_changes: "Cập nhật quy trình",
                system_updates: "Cập nhật hệ thống",
                reports: "Báo cáo",
              }[s.type] || s.type,
              description: `Notifications for ${s.type}`,
              vietnameseDescription: `Thông báo cho ${s.type}`,
              enabled: s.enabled,
            }))
          );
        }
      } catch (error) {
        console.error("Error loading notifications:", error);
        toast.error("Failed to load notifications / Không thể tải thông báo");
      } finally {
        setLoading(false);
      }
    }

    loadData();

    const unsubscribe = setupRealtimeNotifications(user.id, (newNotification) => {
      console.log("New notification received:", newNotification);
      setNotifications((prev) => [newNotification, ...prev]);
      setStats((prev) => ({
        ...prev,
        total: prev.total + 1,
        unread: !newNotification.read_at ? prev.unread + 1 : prev.unread,
        today: newNotification.time.includes(new Date().toISOString().split("T")[0]) ? prev.today + 1 : prev.today,
        highPriority: newNotification.priority === "high" ? prev.highPriority + 1 : prev.highPriority,
      }));
      toast.success("New notification received / Nhận được thông báo mới");
    });

    return () => unsubscribe();
  }, [user?.id, selectedFilter, isAuthenticated, isLoading]);

  const handleSettingChange = async (settingId: string, enabled: boolean) => {
    if (!user?.id) {
      console.error("No user ID for settings update");
      toast.error("No user ID available / Không có ID người dùng");
      return;
    }
    try {
      await updateNotificationSettings(user.id, settingId, enabled);
      setSettings(settings.map((setting) => (setting.id === settingId ? { ...setting, enabled } : setting)));
      toast.success("Settings updated / Cài đặt đã cập nhật");
    } catch (error) {
      console.error("Error updating settings:", error);
      toast.error("Failed to update settings / Không thể cập nhật cài đặt");
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markAsRead(notificationId);
      setNotifications(notifications.map((n) => (n.id === notificationId ? { ...n, read_at: new Date().toISOString() } : n)));
      setStats((prev) => ({ ...prev, unread: prev.unread - 1 }));
      toast.success("Marked as read / Đã đánh dấu đã đọc");
    } catch (error) {
      console.error("Error marking as read:", error);
      toast.error("Failed to mark as read / Không thể đánh dấu đã đọc");
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user?.id) {
      console.error("No user ID for mark all as read");
      toast.error("No user ID available / Không có ID người dùng");
      return;
    }
    try {
      await markAllAsRead(user.id);
      setNotifications(notifications.map((n) => ({ ...n, read_at: new Date().toISOString() })));
      setStats((prev) => ({ ...prev, unread: 0 }));
      toast.success("All marked as read / Đã đánh dấu tất cả đã đọc");
    } catch (error) {
      console.error("Error marking all as read:", error);
      toast.error("Failed to mark all as read / Không thể đánh dấu tất cả");
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "appointment":
        return Calendar;
      case "contact":
        return User;
      case "pipeline":
        return Bell;
      case "system":
        return Settings;
      default:
        return Bell;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Thông báo</h1>
          <div className="text-muted-foreground">
            Quản lý thông báo và cài đặt
            {stats.unread > 0 && (
              <Badge variant="destructive" className="ml-2">
                {stats.unread} unread / chưa đọc
              </Badge>
            )}
          </div>
        </div>
        {stats.unread > 0 && (
          <Button onClick={handleMarkAllAsRead}>
            <Check className="mr-2 h-4 w-4" />
            Mark All Read / Đánh dấu đã đọc
          </Button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Thông báo gần đây</CardTitle>
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
              {loading ? (
                <p>Loading...</p>
              ) : (
                <div className="space-y-4">
                  {notifications.map((notification) => {
  const IconComponent = getNotificationIcon(notification.type);

  return (
    <div
      key={notification.id}
      className={`flex items-start gap-4 p-4 rounded-lg border ${
        !notification.read_at ? "bg-blue-50 border-blue-200" : "bg-white"
      }`}
    >
      <div className="flex-shrink-0">
        <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
          <IconComponent className="h-5 w-5 text-gray-600" />
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-medium text-sm">
            {notification.payload?.vi?.title || 'Thông báo không có tiêu đề'}
          </h4>
          <Badge className={getPriorityColor(notification.priority)}>{notification.priority}</Badge>
          {!notification.read_at && <span className="h-2 w-2 bg-blue-600 rounded-full inline-block"></span>}
        </div>
        <div className="text-xs text-muted-foreground mb-1">
          {notification.payload?.vi?.message || 'Không có nội dung'}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{notification.time}</span>
          <div className="flex gap-2">
            {notification.contact_id && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => (window.location.href = `/contacts/${notification.contact_id}`)}
              >
                Xem liên hệ
              </Button>
            )}
            {!notification.read_at && (
              <Button variant="ghost" size="sm" onClick={() => handleMarkAsRead(notification.id)}>
                <Check className="h-3 w-3" />
              </Button>
            )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {notifications.length === 0 && (
                    <div className="text-center py-8">
                      <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No notifications found / Không tìm thấy thông báo</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cài đặt thông báo</CardTitle>
              <CardDescription>Quản lý tùy chọn thông báo</CardDescription>
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

          <Card>
            <CardHeader>
              <CardTitle>Thống kê thông báo</CardTitle>
              <CardDescription>Tổng quan nhanh về thông báo</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">Total / Tổng</span>
                  <span className="font-medium">{stats.total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Unread / Chưa đọc</span>
                  <span className="font-medium text-red-600">{stats.unread}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">High Priority / Ưu tiên cao</span>
                  <span className="font-medium text-yellow-600">{stats.highPriority}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Today / Hôm nay</span>
                  <span className="font-medium text-blue-600">{stats.today}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
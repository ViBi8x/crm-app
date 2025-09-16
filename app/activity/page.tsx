"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Search, CalendarIcon, User, UserPlus, Edit, Mail, FileText, Settings, Download, Trash2, ArrowRightLeft } from "lucide-react";
import { format, parseISO } from "date-fns";
import type { DateRange } from "react-day-picker";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner"; // Thêm import toast nếu chưa có

const activityTypes = [
  { value: "all", label: "All Activities / Tất cả hoạt động" },
  { value: "contact_added", label: "Contact Added / Thêm liên hệ" },
  { value: "contact_updated", label: "Contact Updated / Cập nhật liên hệ" },
  { value: "contact_deleted", label: "Contact Deleted / Xóa liên hệ" },
  { value: "life_stage_changed", label: "Life Stage Changed / Thay đổi giai đoạn" },
  { value: "pipeline_moved", label: "Pipeline Changes / Thay đổi quy trình" },
  { value: "appointment_scheduled", label: "Appointments / Cuộc hẹn" },
  { value: "email_sent", label: "Email Sent / Gửi email" },
  { value: "user_login", label: "User Login / Đăng nhập" },
];

function getActivityIcon(type: string) {
  switch (type) {
    case "contact_added": return UserPlus;
    case "contact_updated": return Edit;
    case "contact_deleted": return Trash2;
    case "life_stage_changed": return ArrowRightLeft;
    case "pipeline_moved": return FileText;
    case "appointment_scheduled": return CalendarIcon;
    case "email_sent": return Mail;
    case "user_login": return User;
    default: return Settings;
  }
}

function getActivityColor(type: string) {
  switch (type) {
    case "contact_added": return "bg-green-100 text-green-800";
    case "contact_updated": return "bg-blue-100 text-blue-800";
    case "contact_deleted": return "bg-red-100 text-red-800";
    case "life_stage_changed": return "bg-yellow-100 text-yellow-800";
    case "pipeline_moved": return "bg-purple-100 text-purple-800";
    case "appointment_scheduled": return "bg-yellow-100 text-yellow-800";
    case "email_sent": return "bg-indigo-100 text-indigo-800";
    case "user_login": return "bg-gray-100 text-gray-800";
    default: return "bg-gray-100 text-gray-800";
  }
}

function getActivityLabel(type: string) {
  return activityTypes.find((t) => t.value === type)?.label?.split(" / ")[0] || "Activity";
}
function getActivityLabelVn(type: string) {
  return activityTypes.find((t) => t.value === type)?.label?.split(" / ")[1] || "Hoạt động";
}

function formatTimestamp(ts: string | undefined) {
  if (!ts) return "";
  const date = new Date(ts);
  return date.toLocaleString("en-GB", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short", year: "numeric" });
}

export default function ActivityPage() {
  const [rawActivities, setRawActivities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedUser, setSelectedUser] = useState("All Users");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [userAvatars, setUserAvatars] = useState<{ [key: string]: string | null }>({}); // Thêm state để lưu avatar_url

  // Fetch activities từ activity_log
  useEffect(() => {
    const fetchActivities = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("activity_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) {
        toast.error("Lỗi khi tải hoạt động: " + error.message);
      } else {
        setRawActivities(data || []);
        // Lấy danh sách user_id từ activities để fetch avatar
        const userIds = data?.map((item) => item.user_id).filter((id): id is string => !!id) || [];
        if (userIds.length > 0) {
          await fetchUserAvatars(userIds);
        }
      }
      setIsLoading(false);
    };
    fetchActivities();
  }, []);

  // Fetch avatar_url từ profiles
  const fetchUserAvatars = async (userIds: string[]) => {
    if (userIds.length === 0) return;

    const { data, error } = await supabase
      .from("profiles")
      .select("id, avatar_url")
      .in("id", userIds);

    if (error) {
      console.error("Lỗi khi tải avatar: ", error.message);
    } else {
      const avatarsMap: { [key: string]: string | null } = {};
      data.forEach((profile) => {
        avatarsMap[profile.id] = profile.avatar_url || null;
      });
      setUserAvatars((prev) => ({ ...prev, ...avatarsMap }));
    }
  };

  // Lấy tất cả tên user cho bộ lọc (dùng luôn detail.userName hoặc user_id)
  const allUserNames = useMemo(() => {
    const userSet = new Set<string>();
    rawActivities.forEach((item) => {
      let detail = {};
      try {
        detail = typeof item.detail === "string" ? JSON.parse(item.detail) : (item.detail || {});
      } catch {}
      if (detail && (detail as any).userName) userSet.add((detail as any).userName);
      else if (item.user_id) userSet.add(item.user_id);
    });
    return ["All Users", ...Array.from(userSet)];
  }, [rawActivities]);

  // Mapping activity về định dạng UI cần
  const mappedActivities = useMemo(() => {
    return rawActivities.map((item) => {
      let parsedDetail: any = {};
      try {
        parsedDetail = typeof item.detail === "string" ? JSON.parse(item.detail) : (item.detail || {});
      } catch {
        parsedDetail = {};
      }
      return {
        id: item.id,
        type: item.action_type,
        action: getActivityLabel(item.action_type),
        vietnamese: getActivityLabelVn(item.action_type),
        user: parsedDetail.userName || item.user_id,
        userAvatar: userAvatars[item.user_id] || "/placeholder.svg", // Sử dụng avatar_url từ profiles
        timestamp: item.created_at ? format(parseISO(item.created_at), "yyyy-MM-dd HH:mm") : "",
        details: parsedDetail,
      };
    });
  }, [rawActivities, userAvatars]);

  // Filter logic
  const filteredActivities = useMemo(() => {
    return mappedActivities.filter((activity) => {
      const matchesSearch =
        (activity.details?.contactName?.toLowerCase?.() ?? "").includes(searchTerm.toLowerCase()) ||
        activity.user?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = selectedType === "all" || activity.type === selectedType;
      const matchesUser = selectedUser === "All Users" || activity.user === selectedUser;
      let matchesDate = true;
      if (dateRange?.from) {
        const ts = activity.timestamp && new Date(activity.timestamp);
        if (ts && ts < dateRange.from) matchesDate = false;
      }
      if (dateRange?.to) {
        const ts = activity.timestamp && new Date(activity.timestamp);
        if (ts && ts > dateRange.to) matchesDate = false;
      }
      return matchesSearch && matchesType && matchesUser && matchesDate;
    });
  }, [mappedActivities, searchTerm, selectedType, selectedUser, dateRange]);

  const stageMap = {
    subscriber: "Người đăng ký",
    lead: "Khách tiềm năng",
    opportunity: "Cơ hội",
    customer: "Khách hàng",
  };

  // Export CSV
  const exportActivities = () => {
    const headers = "Timestamp,User,Action,Contact,Detail,Type";
    const csvData = filteredActivities
      .map(
        (activity) =>
          `"${activity.timestamp}","${activity.user}","${activity.action}","${activity.details.contactName || ""}","${JSON.stringify(activity.details).replace(/"/g, "'")}","${activity.type}"`
      )
      .join("\n");
    const csvContent = `${headers}\n${csvData}`;
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `activity_log_${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Render details log ra giao diện rõ ràng
  function renderActivityDetails(type: string, details: any) {
    if (!details) return null;
    switch (type) {
      case "contact_added":
        return (
          <div>
            <p><b>Liên hệ:</b> {details.contactName}</p>
            {details.contactEmail && <p><b>Email:</b> {details.contactEmail}</p>}
          </div>
        );
      case "contact_updated":
        return (
          <div>
            <p><b>Liên hệ:</b> {details.contactName}</p>
            {details.fieldsChanged?.length > 0 && (
              <div>
                <b>Trường thay đổi:</b>
                <ul className="ml-4 list-disc">
                  {details.fieldsChanged.map((field: string) => (
                    <li key={field}>
                      <span className="font-semibold">{field}</span>: 
                      <span className="text-red-700 line-through">{String(details.oldData?.[field] ?? "")}</span>
                      <span className="text-gray-500">→</span>
                      <span className="text-green-700">{String(details.newData?.[field] ?? "")}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );
      case "contact_deleted":
        return (
          <div className="space-y-1">
            <p>
              Đã xoá liên hệ:
              <b>
                {details?.name
                  ? ` ${details.name}`
                  : details?.email
                  ? ` ${details.email}`
                  : ""}
              </b>
              {details?.company ? ` (${details.company})` : ""}
            </p>
            {details?.email && (
              <div className="text-xs text-muted-foreground">
                Email: {details.email}
              </div>
            )}
            {details?.phone && (
              <div className="text-xs text-muted-foreground">
                Phone: {details.phone}
              </div>
            )}
          </div>
        );
      case "assigned_changed":
        return (
          <div>
            <p><b>Liên hệ:</b> {details.contactName}</p>
            <p>
              <b>Người phụ trách:</b>
              <span className="ml-2 text-red-700">{details.from}</span>
              <span className="text-gray-500">→</span>
              <span className="text-green-700">{details.to}</span>
            </p>
          </div>
        );
      case "contact_activity_added":
        return (
          <div>
            <p>
              <b>Liên hệ:</b> {details.contactName}
              <br />
              <b>Hoạt động:</b> {details.activityType}
            </p>
            {details.note && <div className="text-xs text-muted-foreground">Nội dung: {details.note}</div>}
            {details.duration && <div className="text-xs">Thời lượng: {details.duration} phút</div>}
            {details.location && <div className="text-xs">Địa điểm: {details.location}</div>}
            {details.action_time && <div className="text-xs">Thời gian: {formatTimestamp(details.action_time)}</div>}
          </div>
        );
      case "pipeline_moved":
        return (
          <div className="space-y-1">
            <p>
              <b>Liên hệ:</b> {details.contactName}
            </p>
            <p>
              <b>Chuyển từ:</b> <span className="text-red-700">{stageMap[details.from] || details.from}</span>
              {" → "}
              <span className="text-green-700">{stageMap[details.to] || details.to}</span>
            </p>
          </div>
        );
      case "life_stage_changed":
        return (
          <div>
            <p><b>Liên hệ:</b> {details.contactName}</p>
            <p>
              <b>Giai đoạn:</b>
              <span className="ml-2 text-red-700">{details.from}</span>
              <span className="text-gray-500">→</span>
              <span className="text-green-700">{details.to}</span>
            </p>
          </div>
        );
      default:
        return Object.keys(details).length > 0 ? (
          <pre className="text-xs text-gray-600 bg-gray-50 p-2 rounded">{JSON.stringify(details, null, 2)}</pre>
        ) : null;
    }
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
                {allUserNames.map((user) => (
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
          {isLoading ? (
            <div className="py-8 text-center text-gray-400">Đang tải dữ liệu...</div>
          ) : (
            <div className="space-y-4">
              {filteredActivities.map((activity) => {
                const IconComponent = getActivityIcon(activity.type);
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
                      {/* Hiển thị chi tiết cụ thể từng log */}
                      {renderActivityDetails(activity.type, activity.details)}
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={activity.userAvatar || "/placeholder.svg"} />
                            <AvatarFallback>
                              {activity.user?.split(" ").map((n: string) => n[0]).join("")}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs font-medium">{activity.user}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{activity.timestamp}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
              {filteredActivities.length === 0 && (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No activities found</p>
                  <p className="text-sm text-muted-foreground">Không tìm thấy hoạt động nào</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
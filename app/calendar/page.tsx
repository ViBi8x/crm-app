"use client";

import { useEffect, useState } from "react";
import { getToken } from "@/lib/firebase";
import { supabase } from "@/lib/supabaseClient";
import { toZonedTime } from "date-fns-tz";
import ReactSelect from "react-select";
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

import {
  CalendarDays, Users, Phone, Video, Plus, ChevronLeft, ChevronRight, Edit, Trash2
} from "lucide-react";
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval,
  isSameMonth, isSameDay, isToday, addMonths, subMonths, parseISO
} from "date-fns";
import { toast } from "sonner";

const timeZone = "Asia/Ho_Chi_Minh";

const appointmentTypes = [
  { value: "meeting", label: "Meeting / Cuộc họp", color: "bg-blue-100 text-blue-800", icon: Users },
  { value: "call", label: "Phone Call / Cuộc gọi", color: "bg-green-100 text-green-800", icon: Phone },
  { value: "demo", label: "Demo / Demo sản phẩm", color: "bg-purple-100 text-purple-800", icon: Video },
  { value: "presentation", label: "Presentation / Thuyết trình", color: "bg-purple-200 text-purple-800", icon: Video },
  { value: "followup", label: "Follow-up / Theo dõi", color: "bg-gray-200 text-gray-700", icon: CalendarDays },
];



const getAppointmentTypeInfo = (type: string) =>
  appointmentTypes.find((t) => t.value === type) || appointmentTypes[0];

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);


  const [profiles, setProfiles] = useState([]);
  useEffect(() => {
    const fetchProfiles = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email');
      if (!error) {
        setProfiles(data);
      }
    };
    fetchProfiles();
  }, []);

  const initialAppointment = {
    title: "",
    type: "meeting",
    time: "",
    location: "",
    attendees: [],
    description: "",
    duration_min: 30,
  };
  const [newAppointment, setNewAppointment] = useState<any>(initialAppointment);

  // Fetch appointments
  useEffect(() => {
    fetchAppointments();
    // eslint-disable-next-line
  }, [currentMonth]);

  const fetchAppointments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("appointments")
      .select("*")
      .order("scheduled_at", { ascending: true });
    if (!error && data) {
      setAppointments(data);
    }
    setLoading(false);
  };

  // Calendar grid
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const handlePreviousMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  // Click 1 ngày để tạo lịch mới
  const handleDayClick = (date: Date, type: string = "meeting") => {
    setSelectedDate(date);
    setNewAppointment({
    ...initialAppointment,
    type, 
  });
    setEditMode(false);
    setSelectedAppointment(null);
    setIsDialogOpen(true);
  };

  // Click 1 event để xem/sửa/xoá
  const handleAppointmentClick = (apt: any, e?: any) => {
    if (e) e.stopPropagation();
    setSelectedAppointment(apt);
    setEditMode(true);
    setIsDialogOpen(true);
    setSelectedDate(new Date(toZonedTime(apt.scheduled_at, timeZone)));
    setNewAppointment({
      title: apt.title,
      type: apt.type,
      time: format(toZonedTime(apt.scheduled_at, timeZone), "HH:mm"),
      location: apt.location || "",
      attendees: apt.attendees?.join(", ") || "",
      description: apt.note || "",
      duration_min: apt.duration_min || 30,
    });
  };

  // Lấy user id hiện tại
  const getCurrentUserId = async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (!user || error) return null;
    return user.id;
  };

  // Save appointment (add or edit)
  const handleSaveAppointment = async () => {
    if (!selectedDate || !newAppointment.title || !newAppointment.time) return;
    setLoading(true);
    const userId = await getCurrentUserId();
    if (!userId) {
      toast.error("Bạn chưa đăng nhập hoặc không lấy được user id");
      setLoading(false);
      return;
    }

    // Xử lý ngày giờ: combine date + time thành ISO (giờ VN, lưu vào DB là UTC)
    const yyyy = selectedDate.getFullYear();
    const mm = String(selectedDate.getMonth() + 1).padStart(2, "0");
    const dd = String(selectedDate.getDate()).padStart(2, "0");
    const time = newAppointment.time; // "09:00"
    const scheduled_at = `${yyyy}-${mm}-${dd}T${time}:00+07:00`;
    const duration_min = Number(newAppointment.duration_min) || 30;
    const attendeesArray = newAppointment.attendees || [];
      // ? newAppointment.attendees.split(",").map((s: string) => s.trim())
      // : [];

    // Check conflict
    const { data: appointmentsData, error: appointmentsError } = await supabase
      .from("appointments")
      .select("id, scheduled_at, duration_min, created_by")
      .eq("created_by", userId);
    if (appointmentsError) {
      toast.error("Lỗi kiểm tra trùng lịch: " + appointmentsError.message);
      setLoading(false);
      return;
    }

    const newStart = new Date(scheduled_at);
    const newEnd = new Date(newStart.getTime() + duration_min * 60 * 1000);

    const isConflict = appointmentsData.some((apt: any) => {
      // Khi edit thì bỏ qua event hiện tại
      if (editMode && selectedAppointment && apt.id === selectedAppointment.id) return false;
      const existStart = new Date(apt.scheduled_at);
      const existDuration = Number(apt.duration_min) || 30;
      const existEnd = new Date(existStart.getTime() + existDuration * 60 * 1000);
      return newStart < existEnd && existStart < newEnd;
    });

    if (isConflict) {
      toast.error("Bạn đã có lịch hẹn khác bị trùng trong khoảng thời gian này!");
      setLoading(false);
      return;
    }

    // Thêm mới hoặc cập nhật
    if (editMode && selectedAppointment) {
      // Update
      const { error } = await supabase
        .from("appointments")
        .update({
          title: newAppointment.title,
          type: newAppointment.type,
          scheduled_at,
          duration_min,
          location: newAppointment.location || "",
          note: newAppointment.description || "",
          attendees: attendeesArray,
        })
        .eq("id", selectedAppointment.id);

      if (!error) {
        toast.success("Đã cập nhật lịch hẹn!");
        await fetchAppointments();
        setIsDialogOpen(false);
      } else {
        toast.error("Lỗi khi cập nhật appointment: " + error.message);
      }
    } else {
      // Insert
      const { error } = await supabase.from("appointments").insert([{
        title: newAppointment.title,
        type: newAppointment.type,
        scheduled_at,
        note: newAppointment.description || "",
     // attendees: attendeesArray,
        attendees: attendeesArray,
        created_by: userId,
        duration_min,
        location: newAppointment.location || "",
      }]);

      if (!error) {
        toast.success("Đã lưu và thêm lịch hẹn vào Calendar!");
        await fetchAppointments();
        setIsDialogOpen(false);
        setSelectedDate(null);
      } else {
        toast.error("Lỗi khi tạo appointment: " + error.message);
      }
    }
    setLoading(false);
  };

  // Delete appointment
  const handleDeleteAppointment = async () => {
    if (!selectedAppointment) return;
    setLoading(true);
    const { error } = await supabase.from("appointments").delete().eq("id", selectedAppointment.id);
    if (!error) {
      toast.success("Đã xoá lịch hẹn!");
      await fetchAppointments();
      setIsDialogOpen(false);
      setSelectedAppointment(null);
    } else {
      toast.error("Lỗi khi xoá appointment: " + error.message);
    }
    setLoading(false);
  };

  // Calendar grid data for a date
  const getAppointmentsForDate = (date: Date) => {
    return appointments
      .filter((apt) => {
        if (!apt.scheduled_at) return false;
        const aptDate = toZonedTime(apt.scheduled_at, timeZone);
        return isSameDay(aptDate, date);
      })
      .map((apt) => ({
        ...apt,
        time: apt.scheduled_at ? format(toZonedTime(apt.scheduled_at, timeZone), "HH:mm") : "",
        description: apt.note || "",
      }));
  };

  // Statistics
  const monthlyAppointments = appointments.filter((apt) => {
    const aptDate = apt.scheduled_at ? parseISO(apt.scheduled_at) : null;
    return (
      aptDate &&
      aptDate.getMonth() === currentMonth.getMonth() &&
      aptDate.getFullYear() === currentMonth.getFullYear()
    );
  });
  const stats = {
    total: monthlyAppointments.length,
    meetings: monthlyAppointments.filter((apt) => apt.type === "meeting").length,
    calls: monthlyAppointments.filter((apt) => apt.type === "call").length,
    demos: monthlyAppointments.filter((apt) => apt.type === "demo" || apt.type === "presentation").length,
  };

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dayNamesVietnamese = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

  // Render
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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextMonth}
                    className="h-8 w-8 p-0 bg-transparent"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1 mb-4">
                  {dayNames.map((day, index) => (
                    <div key={day} className="p-3 text-center font-semibold text-sm text-muted-foreground">
                      <div>{day}</div>
                      <div className="text-xs text-muted-foreground/70">{dayNamesVietnamese[index]}</div>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((day) => {
                    const dayAppointments = getAppointmentsForDate(day);
                    const isCurrentMonth = isSameMonth(day, currentMonth);
                    const isDayToday = isToday(day);

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
                          {dayAppointments.slice(0, 3).map((appointment: any) => {
                            const typeInfo = getAppointmentTypeInfo(appointment.type);
                            const IconComponent = typeInfo.icon;
                            return (
                              <Tooltip key={appointment.id}>
                                <TooltipTrigger asChild>
                                  <div
                                    className={`text-xs p-1 rounded truncate flex items-center gap-1 cursor-pointer ${typeInfo.color}`}
                                    onClick={(e) => handleAppointmentClick(appointment, e)}
                                  >
                                    <IconComponent className="h-3 w-3" />
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
                            );
                          })}
                          {dayAppointments.length > 3 && (
                            <div className="text-xs text-muted-foreground">+{dayAppointments.length - 3} more</div>
                          )}
                        </div>
                        {dayAppointments.length > 0 && (
                          <Badge variant="secondary" className="absolute top-1 right-1 h-5 w-5 p-0 text-xs">
                            {dayAppointments.length}
                          </Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions Sidebar + Today's Schedule */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
                <CardDescription>Hành động nhanh</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
<Button variant="outline" className="w-full justify-start gap-2 bg-transparent"
  onClick={() => handleDayClick(new Date(), "meeting")}>
  <Users className="h-4 w-4" />
  Schedule Meeting
</Button>
<Button variant="outline" className="w-full justify-start gap-2 bg-transparent"
  onClick={() => handleDayClick(new Date(), "call")}>
  <Phone className="h-4 w-4" />
  Schedule Call
</Button>
<Button variant="outline" className="w-full justify-start gap-2 bg-transparent"
  onClick={() => handleDayClick(new Date(), "demo")}>
  <Video className="h-4 w-4" />
  Schedule Demo
</Button>
              </CardContent>
            </Card>
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
                    {getAppointmentsForDate(new Date()).map((appointment: any) => {
                      const typeInfo = getAppointmentTypeInfo(appointment.type);
                      const IconComponent = typeInfo.icon;
                      return (
                        <div key={appointment.id} className="flex items-center gap-2 p-2 border rounded cursor-pointer"
                          onClick={(e) => handleAppointmentClick(appointment, e)}
                        >
                          <div className={`p-1 rounded ${typeInfo.color}`}>
                            <IconComponent className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">{appointment.title}</div>
                            <div className="text-xs text-muted-foreground">{appointment.time}</div>
                          </div>
                        </div>
                      );
                    })}
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

        {/* Dialog: Add/Edit/Detail appointment */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editMode
                  ? "Chỉnh sửa cuộc hẹn"
                  : "Lên lịch hẹn"}
              </DialogTitle>
              <DialogDescription>
                {editMode
                  ? "Cập nhật chi tiết cuộc hẹn"
                  : "Đặt lịch hẹn mới"}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">
                    Tiêu đề
                    <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Input
                    id="title"
                    value={newAppointment.title}
                    onChange={(e) => setNewAppointment({ ...newAppointment, title: e.target.value })}
                    placeholder="Enter appointment title..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">
                    Loại 
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
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">
                    Ngày
                    <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    value={
                      selectedDate
                        ? format(selectedDate, "yyyy-MM-dd")
                        : ""
                    }
                    onChange={(e) => setSelectedDate(new Date(e.target.value + "T00:00:00"))}
                    disabled={editMode}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">
                    Giờ
                    <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Input
                    id="time"
                    type="time"
                    value={newAppointment.time}
                    onChange={(e) => setNewAppointment({ ...newAppointment, time: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration">
                    Thời lượng (phút)
                  </Label>
                  <Input
                    id="duration"
                    type="number"
                    value={newAppointment.duration_min}
                    onChange={(e) =>
                      setNewAppointment({ ...newAppointment, duration_min: Number.parseInt(e.target.value) || 30 })
                    }
                    placeholder="30"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location">
                    Địa điểm
                  </Label>
                  <Input
                    id="location"
                    value={newAppointment.location}
                    onChange={(e) => setNewAppointment({ ...newAppointment, location: e.target.value })}
                    placeholder="Meeting location..."
                  />
                </div>
                
                <div className="space-y-2">
                <Label htmlFor="attendees">Người tham dự</Label>
                <ReactSelect
                  isMulti
                  name="attendees"
                  options={profiles.map(p => ({
                    value: p.id,
                    label: p.full_name
                  }))}
                  value={profiles
                    .filter(p => (newAppointment.attendees || []).includes(p.id))
                    .map(p => ({ value: p.id, label: p.full_name }))}
                  onChange={(selectedOptions) =>
                    setNewAppointment({
                      ...newAppointment,
                      attendees: selectedOptions.map(opt => opt.value)
                    })
                  }
                  placeholder="Chọn người tham dự..."
                />


              </div>


              </div>

              <div className="space-y-2">
                <Label htmlFor="description">
                  Mô tả
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
            <DialogFooter className="flex justify-between">
              <div>
                {editMode && (
                  <Button variant="destructive" onClick={handleDeleteAppointment}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete / Xóa
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel / Hủy
                </Button>
                <Button
                  onClick={handleSaveAppointment}
                  disabled={!newAppointment.title || !selectedDate || !newAppointment.time || loading}
                >
                  {editMode ? (
                    <>
                      <Edit className="mr-2 h-4 w-4" />
                      Update / Cập nhật
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Schedule / Lên lịch
                    </>
                  )}
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/components/auth-provider";
import { supabase } from "@/lib/supabaseClient";
import { toZonedTime } from "date-fns-tz";
import { toast } from "sonner";

// UI Components
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// Icons
import {
  Plus,
  Eye,
  Edit,
  Trash2,
  Phone,
  Mail,
  Building,
  Calendar,
  User,
  FileText,
  Clock,
  X,
  MapPin,
  Briefcase,
  Flag,
  Database,
  UserCheck,
  Tag,
  MessageCircle,
  Users,
  Activity,
  Info,
} from "lucide-react";

// Types
interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  zalo?: string;
  company?: string;
  company_size?: string;
  industry?: string;
  data_source?: string;
  life_stage: string;
  assigned_to?: string;
  position?: string;
  address?: string;
  tags: string[];
  notes?: string;
  created_by?: string;
  latestAppointment?: string; // Dùng để hiển thị, nhưng không cập nhật vào DB
}

interface Activity {
  id: string;
  contact_id: string;
  user_id: string;
  type: string;
  note: string;
  action_time: string;
  duration_min?: number;
  location?: string;
  due_date?: string;
  attachment_url?: string;
}

// Constants
const LIFE_STAGE_OPTIONS = [
  { value: "subscriber", label: "Subscriber / Đăng ký nhận tin" },
  { value: "lead", label: "Lead / Tiềm năng" },
  { value: "opportunity", label: "Opportunity / Cơ hội" },
  { value: "customer", label: "Customer / Khách hàng" },
];

const ACTIVITY_TYPES = [
  { value: "call", label: "Phone Call / Cuộc gọi", emoji: "📞" },
  { value: "email", label: "Email / Gửi email", emoji: "📧" },
  { value: "meeting", label: "Meeting / Cuộc họp", emoji: "🤝" },
  { value: "warranty", label: "Warranty / Bảo hành", emoji: "🔧" },
  { value: "repair", label: "Repair / Sửa chữa", emoji: "🛠️" },
];

// Utility Functions
const getLifeStageColor = (stage: string): string => {
  switch (stage) {
    case "subscriber":
      return "bg-gray-100 text-gray-800";
    case "lead":
      return "bg-yellow-100 text-yellow-800";
    case "opportunity":
      return "bg-blue-100 text-blue-800";
    case "customer":
      return "bg-green-100 text-green-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const formatTimestamp = (ts?: string): string => {
  if (!ts) return "";
  const date = toZonedTime(new Date(ts), "Asia/Ho_Chi_Minh");
  return date.toLocaleString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const toDatetimeLocal = (dtString?: string): string => {
  if (!dtString) return "";
  const dt = new Date(dtString);
  const offset = dt.getTimezoneOffset();
  const local = new Date(dt.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 16);
};

const getActivityTypeInfo = (type: string) =>
  ACTIVITY_TYPES.find((t) => t.value === type) || { emoji: "❓", label: type };

export default function ContactsPage() {
  const { user } = useAuth();
  const [myManagedSales, setMyManagedSales] = useState<string[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [totalContactsCount, setTotalContactsCount] = useState(0); // Thêm state cho tổng số contact
  const [searchTerm, setSearchTerm] = useState("");
  const [lifeStageFilter, setLifeStageFilter] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddActivityDialogOpen, setIsAddActivityDialogOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [editingNotes, setEditingNotes] = useState(false);
  const [tempNotes, setTempNotes] = useState("");
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [companySizeOptions, setCompanySizeOptions] = useState<any[]>([]);
  const [industryOptions, setIndustryOptions] = useState<any[]>([]);
  const [dataSourceOptions, setDataSourceOptions] = useState<any[]>([]);
  const [profileOptions, setProfileOptions] = useState<any[]>([]);
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    contact: null as Contact | null,
    loading: false,
    historyCount: 0,
  });
  const [newContact, setNewContact] = useState<Contact>({
    name: "",
    email: "",
    phone: "",
    zalo: "",
    company: "",
    company_size: "",
    industry: "",
    data_source: "",
    life_stage: "lead",
    assigned_to: user?.id || "",
    position: "",
    address: "",
    tags: [],
    notes: "",
  });
  const [newActivity, setNewActivity] = useState({
    type: "call",
    note: "",
    action_time: toZonedTime(new Date(), "Asia/Ho_Chi_Minh").toISOString().slice(0, 16),
    duration: "",
    location: "",
    dueDate: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    if (isViewDialogOpen && selectedContact?.id) {
      fetchContactActivities(selectedContact.id);
    }
  }, [isViewDialogOpen, selectedContact]);

  useEffect(() => {
    setNewContact((prev) => ({ ...prev, assigned_to: user?.id || "" }));
  }, [user]);

  useEffect(() => {
    fetchOptions();
    fetchContacts();
  }, [user, currentPage]);

  const fetchOptions = async () => {
    const { data: appConfig } = await supabase
      .from("app_config")
      .select("*")
      .eq("active", true);
    setCompanySizeOptions(appConfig?.filter((i) => i.type === "company_size") || []);
    setIndustryOptions(appConfig?.filter((i) => i.type === "industry") || []);
    setDataSourceOptions(appConfig?.filter((i) => i.type === "data_source") || []);

    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, full_name, role, manager_id");
    if (profilesError) {
      toast.error("Lỗi khi lấy danh sách profiles: " + profilesError.message);
      return;
    }
    setProfileOptions(profiles || []);

    if (user?.role === "manager" && profiles) {
      const mySales = profiles
        .filter((p) => p.manager_id === user.id && p.role === "sales")
        .map((p) => p.id);
      setMyManagedSales(mySales);
    } else {
      setMyManagedSales([]);
    }
  };

  const fetchContacts = async () => {
    if (!user) {
      setContacts([]);
      toast.error("Không tìm thấy thông tin người dùng");
      return;
    }

    let query = supabase.from("contacts").select("*", { count: "exact" }).order("id", { ascending: false });
    const from = (currentPage - 1) * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;

    if (user.role === "sales") query = query.eq("assigned_to", user.id);
    else if (user.role === "manager") query = query.in("assigned_to", [user.id, ...myManagedSales]);
    // Admin không cần lọc

    const { data: contactData, error: contactError, count } = await query.range(from, to);
    if (contactError) {
      toast.error("Lỗi khi lấy danh sách liên hệ: " + contactError.message);
      setContacts([]);
      return;
    }

    const contactIds = contactData.map((c) => c.id);
    const { data: latestActivities } = await supabase
      .from("contact_history")
      .select("contact_id, action_time")
      .in("contact_id", contactIds)
      .order("action_time", { ascending: false })
      .limit(1);
    const latestAppointments = latestActivities.reduce((acc, curr) => {
      acc[curr.contact_id] = curr.action_time;
      return acc;
    }, {} as { [key: string]: string });

    const updatedContacts = contactData.map((contact) => ({
      ...contact,
      latestAppointment: latestAppointments[contact.id] || null,
    }));
    setContacts(updatedContacts || []);

    // Cập nhật tổng số contact
    if (count !== undefined) {
      setTotalContactsCount(count);
    }
  };

const fetchContactActivities = async (contactId: string) => {
  setActivityLoading(true);
  const { data, error } = await supabase
    .from("contact_history")
    .select(`
      *,
      profiles(full_name)
    `)
    .eq("contact_id", contactId)
    .order("action_time", { ascending: false });
  if (error) {
    toast.error("Lỗi khi lấy lịch sử hoạt động: " + error.message);
  }
  setActivities(data || []);
  setActivityLoading(false);
};

  const handleAddContact = async () => {
    const { email, phone } = newContact;
    if (!email && !phone) {
      toast.error("Bạn phải nhập ít nhất email hoặc số điện thoại!");
      return;
    }

    const orQuery = [];
    if (email) orQuery.push(`email.eq.${email}`);
    if (phone) orQuery.push(`phone.eq.${phone}`);
    if (orQuery.length > 0) {
      const { data: dupContacts, error } = await supabase
        .from("contacts")
        .select("id, name, email, phone")
        .or(orQuery.join(","));
      if (error) {
        toast.error("Lỗi kiểm tra trùng lặp: " + error.message);
        return;
      }
      if (dupContacts?.length) {
        let msg = `Liên hệ với ${email ? `email "${email}"` : ""}${
          email && phone ? " hoặc" : ""
        }${phone ? ` số điện thoại "${phone}"` : ""} đã tồn tại!`;
        toast.error(msg);
        return;
      }
    }

    const insertData = {
      ...newContact,
      assigned_to: newContact.assigned_to === "unassigned" ? null : newContact.assigned_to,
      created_by: user?.id,
    };

    const { data, error } = await supabase
      .from("contacts")
      .insert([insertData])
      .select()
      .single();

    if (error) {
      toast.error("Lỗi khi thêm liên hệ: " + error.message);
      return;
    }

    toast.success("Đã thêm liên hệ thành công");
    setIsAddDialogOpen(false);
    setNewContact({
      name: "",
      email: "",
      phone: "",
      zalo: "",
      company: "",
      company_size: "",
      industry: "",
      data_source: "",
      life_stage: "lead",
      assigned_to: user?.id || "",
      position: "",
      address: "",
      tags: [],
      notes: "",
    });
    fetchContacts();

    if (data && user?.id) {
      await fetch("/api/activity/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          action_type: "contact_added",
          target_id: data.id,
          target_type: "contact",
          detail: {
            contactName: data.name,
            contactEmail: data.email,
            userName: user.full_name,
          },
        }),
      });
    }
  };

  const handleViewContact = (contact: Contact) => {
    setSelectedContact(contact);
    setTempNotes(contact.notes || "");
    setIsViewDialogOpen(true);
  };

  const handleEditContact = (contact: Contact) => {
    setSelectedContact(contact);
    setNewContact({ ...contact, tags: contact.tags || [] });
    setIsEditDialogOpen(true);
  };

  const handleUpdateContact = async () => {
    if (!selectedContact) return;

    const { email, phone, assigned_to, life_stage } = newContact;
    const orQuery = [];
    if (email) orQuery.push(`email.eq.${email}`);
    if (phone) orQuery.push(`phone.eq.${phone}`);
    if (orQuery.length > 0) {
      const { data: dupContacts, error } = await supabase
        .from("contacts")
        .select("id, name, email, phone")
        .or(orQuery.join(","));
      if (error) {
        toast.error("Lỗi kiểm tra trùng lặp: " + error.message);
        return;
      }
      const filteredDup = (dupContacts || []).filter((c) => c.id !== selectedContact.id);
      if (filteredDup.length > 0) {
        let msg = `Liên hệ với ${email ? `email "${email}"` : ""}${
          email && phone ? " hoặc" : ""
        }${phone ? ` số điện thoại "${phone}"` : ""} đã tồn tại!`;
        toast.error(msg);
        return;
      }
    }

    const oldData = { ...selectedContact };
    const { latestAppointment, ...updateData } = {
      ...newContact,
      tags: newContact.tags,
      assigned_to: assigned_to === "unassigned" ? null : assigned_to,
    };
    const { error } = await supabase
      .from("contacts")
      .update(updateData)
      .eq("id", selectedContact.id);

    if (error) {
      toast.error("Lỗi cập nhật liên hệ: " + error.message);
      return;
    }

    toast.success("Cập nhật liên hệ thành công");
    setIsEditDialogOpen(false);
    setSelectedContact({ ...selectedContact, ...updateData });
    fetchContacts();

    if (user?.id) {
      const changedFields = Object.keys(newContact).filter(
        (k) => newContact[k] !== oldData[k]
      );
      const detail: any = {
        contactName: oldData.name,
        fieldsChanged: changedFields,
        userName: user.full_name,
        changedAt: new Date().toISOString(),
      };

      if (oldData.assigned_to !== newContact.assigned_to) {
        const oldUser =
          oldData.assigned_to
            ? profileOptions.find((p) => p.id === oldData.assigned_to)?.full_name || "Unassigned"
            : "Unassigned";
        const newUser =
          newContact.assigned_to
            ? profileOptions.find((p) => p.id === newContact.assigned_to)?.full_name || "Unassigned"
            : "Unassigned";
        detail.assignedFrom = oldUser;
        detail.assignedTo = newUser;
      }

      await fetch("/api/activity/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          action_type: oldData.assigned_to !== newContact.assigned_to
            ? "assigned_changed"
            : "contact_updated",
          target_id: selectedContact.id,
          target_type: "contact",
          detail,
        }),
      });
    }
  };

  const openDeleteDialog = async (contact: Contact) => {
    const { count } = await supabase
      .from("contact_history")
      .select("*", { count: "exact", head: true })
      .eq("contact_id", contact.id);

    setDeleteDialog({
      open: true,
      contact,
      loading: false,
      historyCount: count || 0,
    });
  };

  const proceedDeleteContact = async (contact: Contact) => {
    if (!contact?.id) {
      toast.error("Contact không hợp lệ khi xoá!");
      return;
    }

    await supabase.from("contact_history").delete().eq("contact_id", contact.id);
    const { error } = await supabase.from("contacts").delete().eq("id", contact.id);

    if (error) {
      toast.error("Lỗi khi xoá liên hệ: " + error.message);
      return;
    }

    toast.success("Đã xoá liên hệ");
    fetchContacts();

    if (user?.id) {
      await fetch("/api/activity/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          action_type: "contact_deleted",
          target_id: contact.id,
          target_type: "contact",
          detail: {
            name: contact.name,
            email: contact.email,
            phone: contact.phone,
            company: contact.company,
            life_stage: contact.life_stage,
            assigned_to: contact.assigned_to,
            userName: user.full_name,
            deletedAt: new Date().toISOString(),
          },
        }),
      });
    }
  };

  const handleAddActivity = async () => {
    if (!selectedContact || !user?.id) {
      toast.error("Không xác định được user hoặc contact!");
      return;
    }

    const localDateTime = new Date(`${newActivity.action_time}:00Z`);
    const utcDateTime = new Date(localDateTime.getTime() - 7 * 60 * 60000).toISOString();

    const currentTime = new Date().toISOString();

    const insertData: any = {
      contact_id: selectedContact.id,
      user_id: user.id,
      type: newActivity.type,
      note: newActivity.note,
      action_time: utcDateTime,
    };

    if ((newActivity.type === "call" || newActivity.type === "meeting") && newActivity.duration) {
      insertData.duration_min = Number(newActivity.duration);
    }

    if (newActivity.location) {
      insertData.location = newActivity.location;
    }

    if (newActivity.type === "task" && newActivity.dueDate) {
      const dueDateUTC = new Date(new Date(`${newActivity.dueDate}:00Z`).getTime() - 7 * 60 * 60000).toISOString();
      insertData.due_date = dueDateUTC;
    }

    const { error: historyError } = await supabase.from("contact_history").insert([insertData]);
    if (historyError) {
      toast.error("Lỗi thêm hoạt động: " + historyError.message);
      return;
    }

    if (utcDateTime >= currentTime) {
      const { error: aptError } = await supabase.from("appointments").insert({
        contact_id: selectedContact.id,
        title: `${newActivity.type} với ${selectedContact.name}`,
        type: newActivity.type,
        scheduled_at: utcDateTime,
        duration_min: insertData.duration_min || 30,
        status: "scheduled",
        note: newActivity.note,
        created_by: user.id,
        attendees: [user.id],
        location: newActivity.location || "",
      });

      if (aptError) {
        toast.error("Lỗi khi đồng bộ với Calendar: " + aptError.message);
      } else {
        toast.success("Đã thêm hoạt động và đồng bộ với Calendar!");
      }
    } else {
      toast.success("Đã thêm hoạt động thành công!");
    }

    setIsAddActivityDialogOpen(false);
    setNewActivity({
      type: "call",
      note: "",
      action_time: toZonedTime(new Date(), "Asia/Ho_Chi_Minh").toISOString().slice(0, 16),
      duration: "",
      location: "",
      dueDate: "",
    });
    fetchContactActivities(selectedContact.id);

    await fetch("/api/activity/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: user.id,
        action_type: "contact_activity_added",
        target_id: selectedContact.id,
        target_type: "contact",
        detail: {
          contactName: selectedContact.name,
          activityType: newActivity.type,
          note: newActivity.note,
          action_time: utcDateTime,
          duration: insertData.duration_min,
          location: insertData.location,
          userName: user.full_name,
        },
      }),
    });
  };

  const handleDeleteActivity = async (activityId: string) => {
    const { error } = await supabase.from("contact_history").delete().eq("id", activityId);
    if (error) {
      toast.error("Lỗi xóa hoạt động: " + error.message);
      return;
    }
    toast.success("Đã xóa hoạt động");
    fetchContactActivities(selectedContact!.id);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) setNewActivity({ ...newActivity, file });
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === "," || e.key === " ") {
      e.preventDefault();
      const value = e.currentTarget.value.trim();
      if (value && !newContact.tags.includes(value)) {
        setNewContact({ ...newContact, tags: [...newContact.tags, value] });
        e.currentTarget.value = "";
      }
    }
    if (e.key === "Backspace" && !e.currentTarget.value && newContact.tags.length) {
      setNewContact({ ...newContact, tags: newContact.tags.slice(0, -1) });
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedContact) return;
    const { error } = await supabase
      .from("contacts")
      .update({ notes: tempNotes })
      .eq("id", selectedContact.id);
    if (error) {
      toast.error("Lỗi lưu ghi chú: " + error.message);
      return;
    }
    setEditingNotes(false);
    toast.success("Đã lưu ghi chú");
    fetchContacts();
  };

  const filteredContacts = contacts.filter((contact) => {
    if (user?.role === "admin") return true;
    if (user?.role === "manager") {
      return (
        contact.assigned_to === user.id ||
        (myManagedSales.length > 0 && myManagedSales.includes(contact.assigned_to))
      );
    }
    if (user?.role === "sales") return contact.assigned_to === user.id;
    return false;
  }).filter((contact) => {
    const matchesSearch =
      contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (contact.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (contact.company || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLifeStage = lifeStageFilter === "all" || contact.life_stage === lifeStageFilter;
    return matchesSearch && matchesLifeStage;
  });

  const totalPages = Math.ceil(totalContactsCount / ITEMS_PER_PAGE);

  const renderContactForm = (isEdit: boolean) => (
    <div className="grid gap-4 overflow-y-auto max-h-[calc(90vh-200px)]">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Full Name / Họ và tên</Label>
          <Input
            id="name"
            value={newContact.name}
            onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
            placeholder="Enter full name..."
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email / Thư điện tử</Label>
          <Input
            id="email"
            type="email"
            value={newContact.email}
            onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
            placeholder="Enter email address..."
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="phone">Phone / Số điện thoại</Label>
          <Input
            id="phone"
            value={newContact.phone}
            onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
            placeholder="Enter phone number..."
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="zalo">Zalo</Label>
          <Input
            id="zalo"
            value={newContact.zalo}
            onChange={(e) => setNewContact({ ...newContact, zalo: e.target.value })}
            placeholder="Nhập số Zalo..."
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="company">Company / Công ty</Label>
          <Input
            id="company"
            value={newContact.company}
            onChange={(e) => setNewContact({ ...newContact, company: e.target.value })}
            placeholder="Enter company name..."
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="position">Position / Chức vụ</Label>
          <Input
            id="position"
            value={newContact.position}
            onChange={(e) => setNewContact({ ...newContact, position: e.target.value })}
            placeholder="Enter job position..."
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="address">Address / Địa chỉ</Label>
        <Input
          id="address"
          value={newContact.address}
          onChange={(e) => setNewContact({ ...newContact, address: e.target.value })}
          placeholder="Enter full address..."
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="company_size">Company Size / Quy mô công ty</Label>
          <Select
            value={newContact.company_size}
            onValueChange={(value) => setNewContact({ ...newContact, company_size: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select company size..." />
            </SelectTrigger>
            <SelectContent>
              {companySizeOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="industry">Industry / Ngành</Label>
          <Select
            value={newContact.industry}
            onValueChange={(value) => setNewContact({ ...newContact, industry: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select industry..." />
            </SelectTrigger>
            <SelectContent>
              {industryOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="data_source">Data Source / Nguồn</Label>
        <Select
          value={newContact.data_source}
          onValueChange={(value) => setNewContact({ ...newContact, data_source: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Chọn nguồn..." />
          </SelectTrigger>
          <SelectContent>
            {dataSourceOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.value}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="assigned_to">Assigned To / Phụ trách</Label>
        <Select
          value={newContact.assigned_to || "unassigned"}
          onValueChange={async (value) => {
            const originalContact = { ...newContact };
            const newAssigned = value === "unassigned" ? null : value;
            setNewContact({ ...newContact, assigned_to: newAssigned });
            if (isEdit && newContact.id) {
              const { error } = await supabase
                .from("contacts")
                .update({ assigned_to: newAssigned })
                .eq("id", newContact.id);
              if (error) {
                toast.error("Cập nhật người phụ trách thất bại: " + error.message);
              } else {
                toast.success("Đã cập nhật người phụ trách thành công");
                if (user?.id) {
                  const oldUser = profileOptions.find((p) => p.id === originalContact.assigned_to)?.full_name || "Unassigned";
                  const newUser = profileOptions.find((p) => p.id === newAssigned)?.full_name || "Unassigned";
                  await fetch("/api/activity/log", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      user_id: user.id,
                      action_type: "assigned_changed",
                      target_id: newContact.id,
                      target_type: "contact",
                      detail: {
                        contactName: originalContact.name || "Unknown",
                        from: oldUser,
                        to: newUser,
                        userName: user.full_name,
                        changedAt: new Date().toISOString(),
                      },
                    }),
                  });
                }
              }
            }
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Chọn người phụ trách..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="unassigned">-- Chưa phân bổ --</SelectItem>
            {profileOptions
              .filter((profile) => {
                if (user?.role === "admin") return true;
                if (user?.role === "manager") {
                  return profile.id === user.id || (profile.manager_id === user.id && profile.role === "sales");
                }
                if (user?.role === "sales") {
                  return profile.id === user.id || (profile.role === "sales" && profile.manager_id === user.manager_id);
                }
                return false;
              })
              .map((profile) => (
                <SelectItem key={profile.id} value={profile.id}>
                  {profile.full_name}
                  {profile.role === "admin" ? "(Admin)" : profile.role === "manager" ? "(Manager)" : "(Sales)"}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Tags / Nhãn</Label>
        <div className="flex flex-wrap gap-2">
          {newContact.tags.map((tag, idx) => (
            <Badge key={idx} className="bg-blue-100 text-blue-800">
              {tag}
              <button
                type="button"
                className="ml-1 text-xs"
                onClick={() =>
                  setNewContact({
                    ...newContact,
                    tags: newContact.tags.filter((t) => t !== tag),
                  })
                }
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          <Input
            className="w-auto min-w-[120px] flex-1"
            placeholder="Nhập tag và Enter, Space, hoặc ,"
            onKeyDown={handleTagInputKeyDown}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="life_stage">Life Stage / Giai đoạn</Label>
        <Select
          value={newContact.life_stage}
          onValueChange={(value) => setNewContact({ ...newContact, life_stage: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LIFE_STAGE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">Notes / Ghi chú</Label>
        <Textarea
          id="notes"
          value={newContact.notes}
          onChange={(e) => setNewContact({ ...newContact, notes: e.target.value })}
          placeholder="Enter any additional notes..."
          rows={3}
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contacts</h1>
          <p className="text-muted-foreground">Quản lý danh bạ khách hàng</p>
        </div>
        <Dialog
          open={isAddDialogOpen}
          onOpenChange={(open) => {
            setIsAddDialogOpen(open);
            if (!open)
              setNewContact({
                name: "",
                email: "",
                phone: "",
                zalo: "",
                company: "",
                company_size: "",
                industry: "",
                data_source: "",
                life_stage: "lead",
                assigned_to: user?.id || "",
                position: "",
                address: "",
                tags: [],
                notes: "",
              });
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Contact / Thêm liên hệ
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Add New Contact / Thêm liên hệ mới</DialogTitle>
              <DialogDescription>Tạo liên hệ mới trong hệ thống CRM</DialogDescription>
            </DialogHeader>
            {renderContactForm(false)}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel / Hủy
              </Button>
              <Button onClick={handleAddContact}>Add Contact / Thêm liên hệ</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-4">
        <Input
          placeholder="Tìm kiếm theo tên, email hoặc công ty..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-xs"
        />
        <Select value={lifeStageFilter} onValueChange={setLifeStageFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Giai đoạn" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            {LIFE_STAGE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="hover:shadow-lg">
        <CardHeader>
          <CardTitle>Danh sách liên hệ của bạn</CardTitle>
          <CardDescription>
            Manage your customer contacts and relationships / Quản lý liên hệ và mối quan hệ khách hàng
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredContacts.length === 0 && (
              <div className="text-center text-gray-400">Không tìm thấy liên hệ phù hợp.</div>
            )}
            {filteredContacts.map((contact) => (
              <div
                key={contact.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium">{contact.name}</h3>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {contact.email}
                      </span>
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {contact.phone}
                      </span>
                      <span className="flex items-center gap-1">
                        <Building className="h-3 w-3" />
                        {contact.company}
                      </span>
                    </div>
                    {contact.latestAppointment && (
                      <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                        <Calendar className="h-3 w-3" />
                        Lịch hẹn gần nhất: {formatTimestamp(contact.latestAppointment)}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getLifeStageColor(contact.life_stage)}>
                    {LIFE_STAGE_OPTIONS.find((l) => l.value === contact.life_stage)?.label ||
                      contact.life_stage}
                  </Badge>
                  {(user?.role === "manager" || user?.role === "admin") && (
                    <Badge
                      className={
                        contact.assigned_to
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-200 text-gray-600"
                      }
                    >
                      <UserCheck className="mr-1 h-3 w-3" />
                      {contact.assigned_to
                        ? profileOptions.find((p) => p.id === contact.assigned_to)?.full_name ||
                          "Đang gán..."
                        : "Not Assigned"}
                    </Badge>
                  )}
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => handleViewContact(contact)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleEditContact(contact)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    {user?.role === "admin" && (
                      <AlertDialog
                        open={deleteDialog.open}
                        onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
                      >
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDeleteDialog(contact)}
                            title="Xóa liên hệ"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              <span className="flex items-center gap-2 text-red-600">
                                <Trash2 className="h-5 w-5" />
                                Xóa liên hệ
                              </span>
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              {deleteDialog.historyCount > 0 ? (
                                <>
                                  Liên hệ này còn <b>{deleteDialog.historyCount}</b> lịch sử liên hệ. Để xóa
                                  liên hệ, bạn phải xóa tất cả lịch sử liên hệ này trước.
                                  <br />
                                  <b>Bạn có muốn xóa toàn bộ lịch sử liên hệ và xóa liên hệ này không?</b>
                                </>
                              ) : (
                                <>
                                  Are you sure you want to delete this contact? This action cannot be undone.
                                  <br />
                                  Bạn có chắc chắn muốn xóa liên hệ này? Hành động này không thể hoàn tác.
                                </>
                              )}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel
                              onClick={() => setDeleteDialog({ ...deleteDialog, open: false })}
                            >
                              Cancel / Hủy
                            </AlertDialogCancel>
                            <AlertDialogAction
                              disabled={deleteDialog.loading}
                              onClick={async () => {
                                setDeleteDialog((d) => ({ ...d, loading: true }));
                                if (deleteDialog.historyCount > 0) {
                                  await supabase
                                    .from("contact_history")
                                    .delete()
                                    .eq("contact_id", deleteDialog.contact!.id);
                                }
                                await proceedDeleteContact(deleteDialog.contact!);
                                setDeleteDialog({
                                  open: false,
                                  contact: null,
                                  loading: false,
                                  historyCount: 0,
                                });
                              }}
                            >
                              {deleteDialog.historyCount > 0
                                ? "Xóa hết lịch sử và liên hệ"
                                : "Delete / Xóa"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2">
                <Button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                {Array.from({ length: totalPages }, (_, i) => (
                  <Button
                    key={i + 1}
                    onClick={() => setCurrentPage(i + 1)}
                    variant={currentPage === i + 1 ? "default" : "outline"}
                  >
                    {i + 1}
                  </Button>
                ))}
                <Button
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages || totalPages === 0}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[100vh] overflow-hidden">
          <DialogHeader className="items-center text-center">
            <DialogTitle className="flex items-center gap-2">CHI TIẾT LIÊN HỆ</DialogTitle>
          </DialogHeader>
          {selectedContact && (
            <div className="space-y-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-lg font-semibold text-blue-600">
                  <Info className="h-5 w-5" />
                  <span>Thông tin cơ bản</span>
                </div>
                <Separator />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                      <User className="h-4 w-4 text-blue-400" />Họ và tên
                    </Label>
                    <p>{selectedContact.name}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                      <Mail className="h-4 w-4 text-blue-400" />Email
                    </Label>
                    <p>{selectedContact.email}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                      <Phone className="h-4 w-4 text-blue-400" />Số điện thoại
                    </Label>
                    <p>{selectedContact.phone}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-blue-400" />Chức vụ
                    </Label>
                    <p>{selectedContact.position || <span className="italic text-gray-400">-</span>}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                      <MessageCircle className="h-4 w-4 text-blue-400" />Zalo
                    </Label>
                    <p>{selectedContact.zalo || <span className="italic text-gray-400">-</span>}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                      <Database className="h-4 w-4 text-blue-400" />Khách đến từ
                    </Label>
                    <Badge variant="outline">{selectedContact.data_source}</Badge>
                  </div>
                  <div className="space-y-2 lg:col-span-3">
                    <Label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                      <Building className="h-4 w-4 text-blue-400" />Công ty
                    </Label>
                    <p>{selectedContact.company}</p>
                  </div>
                
                  <div className="space-y-2 lg:col-span-3">
                    <Label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-blue-400" />Địa chỉ
                    </Label>
                    <p>{selectedContact.address || <span className="italic text-gray-400">-</span>}</p>
                  </div>

                    <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                      <Users className="h-4 w-4 text-blue-400" />Quy mô công ty
                    </Label>
                    <p>{selectedContact.company_size || <span className="italic text-gray-400">-</span>}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                      <Activity className="h-4 w-4 text-blue-400" />Ngành nghề
                    </Label>
                    <p>{selectedContact.industry || <span className="italic text-gray-400">-</span>}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                      <Tag className="h-4 w-4 text-blue-400" />Tags
                    </Label>
                    <div>
                      {(selectedContact.tags || []).map((tag, idx) => (
                        <Badge key={idx} variant="outline" className="mr-1">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2 w-max">
                    <Label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                      <Flag className="h-4 w-4 text-blue-400" />Life Stage
                    </Label>
                    <Select
                      value={selectedContact.life_stage}
                      onValueChange={async (value) => {
                        const oldLifeStage = selectedContact.life_stage;
                        const response = await fetch("/api/activity/log", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            user_id: user?.id,
                            action_type: "life_stage_changed",
                            target_id: selectedContact.id,
                            target_type: "contact",
                            detail: {
                              contactName: selectedContact.name,
                              from: oldLifeStage,
                              to: value,
                              userName: user?.full_name,
                            },
                          }),
                        });
                        const result = await response.json();
                        if (response.ok) {
                          toast.success("Cập nhật Life Stage thành công!");
                          fetchContacts();
                          setSelectedContact({ ...selectedContact, life_stage: value });
                        } else {
                          toast.error("Lỗi cập nhật Life Stage: " + (result.error || "Unknown error"));
                        }
                      }}
                    >
                      <SelectTrigger className={getLifeStageColor(selectedContact.life_stage)}>
                        <SelectValue>
                          {LIFE_STAGE_OPTIONS.find((l) => l.value === selectedContact.life_stage)?.label}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {LIFE_STAGE_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 w-max">
                    <Label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                      <UserCheck className="h-4 w-4 text-blue-400" />Người phụ trách
                    </Label>
                    <Select
                      value={selectedContact.assigned_to || "unassigned"}
                      onValueChange={async (value) => {
                        const oldAssigned = selectedContact.assigned_to;
                        const newAssigned = value === "unassigned" ? null : value;
                        const { error } = await supabase
                          .from("contacts")
                          .update({ assigned_to: newAssigned })
                          .eq("id", selectedContact.id);
                        if (error) {
                          toast.error("Cập nhật người phụ trách thất bại: " + error.message);
                        } else {
                          toast.success("Đã cập nhật người phụ trách thành công");
                          setSelectedContact({ ...selectedContact, assigned_to: newAssigned });
                          fetchContacts();
                          if (user?.id) {
                            const oldUser = profileOptions.find((p) => p.id === oldAssigned)?.full_name || "Unassigned";
                            const newUser = profileOptions.find((p) => p.id === newAssigned)?.full_name || "Unassigned";
                            await fetch("/api/activity/log", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                user_id: user.id,
                                action_type: "assigned_changed",
                                target_id: selectedContact.id,
                                target_type: "contact",
                                detail: {
                                  contactName: selectedContact.name,
                                  from: oldUser,
                                  to: newUser,
                                  userName: user.full_name,
                                  changedAt: new Date().toISOString(),
                                },
                              }),
                            });
                          }
                        }
                      }}
                    >
                      <SelectTrigger className="w-[220px]">
                        <SelectValue placeholder="Chọn người phụ trách..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">-- Chưa phân bổ --</SelectItem>
                        {profileOptions
                          .filter((profile) => {
                            if (user?.role === "admin") return true;
                            if (user?.role === "manager") {
                              return profile.id === user.id || (profile.manager_id === user.id && profile.role === "sales");
                            }
                            if (user?.role === "sales") {
                              return profile.id === user.id || (profile.role === "sales" && profile.manager_id === user.manager_id);
                            }
                            return false;
                          })
                          .map((profile) => (
                            <SelectItem key={profile.id} value={profile.id}>
                              {profile.full_name}
                              {profile.role === "admin" ? "(Admin)" : profile.role === "manager" ? "(Manager)" : "(Sales)"}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-lg font-semibold text-green-600">
                    <Clock className="h-5 w-5" />
                    <span>Kế hoạch Chăm Sóc Khách hàng</span>
                  </div>
                  <Dialog open={isAddActivityDialogOpen} onOpenChange={setIsAddActivityDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="mr-2 h-4 w-4" />
                        Thêm Lịch sử Chăm Khách
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>
                          Thêm hoạt động mới với khách: {selectedContact?.name || "Loading..."}
                        </DialogTitle>
                        <DialogDescription>
                          Ghi lại hoặc lên kế hoạch một hoạt động mới cho liên hệ này
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="activity-type">Loại hoạt động</Label>
                            <Select
                              value={newActivity.type}
                              onValueChange={(value) => setNewActivity({ ...newActivity, type: value })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {ACTIVITY_TYPES.map((type) => (
                                  <SelectItem key={type.value} value={type.value}>
                                    {type.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="activity-time">
                              Thời gian <span className="text-sm text-gray-500">(Nhập theo giờ Việt Nam - GMT+7)</span>
                            </Label>
                            <Input
                              id="activity-time"
                              type="datetime-local"
                              value={newActivity.action_time ? newActivity.action_time.split(".")[0] : ""}
                              onChange={(e) => setNewActivity({ ...newActivity, action_time: e.target.value })}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="activity-duration">Thời lượng (phút)</Label>
                            <Input
                              id="activity-duration"
                              type="number"
                              value={newActivity.duration}
                              onChange={(e) => setNewActivity({ ...newActivity, duration: e.target.value })}
                              placeholder="30"
                              disabled={newActivity.type !== "call" && newActivity.type !== "meeting"}
                            />
                          </div>
                          {(newActivity.type === "meeting" || newActivity.type === "call") && (
                            <div className="space-y-2">
                              <Label htmlFor="location">Địa điểm</Label>
                              <Input
                                id="location"
                                value={newActivity.location}
                                onChange={(e) => setNewActivity({ ...newActivity, location: e.target.value })}
                                placeholder="Office, Zoom, Phone..."
                              />
                            </div>
                          )}
                        </div>
                        {newActivity.type === "task" && (
                          <div className="space-y-2">
                            <Label htmlFor="due-date">
                              Hạn hoàn thành <span className="text-sm text-gray-500">(Nhập theo giờ Việt Nam - GMT+7)</span>
                            </Label>
                            <Input
                              id="due-date"
                              type="datetime-local"
                              value={newActivity.dueDate ? newActivity.dueDate.split(".")[0] : ""}
                              onChange={(e) => setNewActivity({ ...newActivity, dueDate: e.target.value })}
                            />
                          </div>
                        )}
                        <div className="space-y-2">
                          <Label htmlFor="activity-note">Ghi chú</Label>
                          <Textarea
                            id="activity-note"
                            value={newActivity.note}
                            onChange={(e) => setNewActivity({ ...newActivity, note: e.target.value })}
                            placeholder="Enter activity details..."
                            rows={3}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddActivityDialogOpen(false)}>
                          Cancel / Hủy
                        </Button>
                        <Button onClick={handleAddActivity} disabled={!newActivity.note.trim()}>
                          Add Activity / Thêm hoạt động
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
                <Separator />
<ScrollArea className="h-64 w-full">
  {activityLoading ? (
    <div className="text-center py-8 text-gray-400">
      Đang tải lịch sử hoạt động...
    </div>
  ) : activities.length > 0 ? (
    <div className="space-y-3">
      {activities.map((activity) => {
        const typeInfo = getActivityTypeInfo(activity.type);
        return (
          <div
            key={activity.id}
            className="flex gap-3 p-3 border rounded-lg bg-gray-50 hover:bg-gray-100 transition"
          >
            <div className="text-2xl">{typeInfo.emoji}</div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">
                    {typeInfo.label.split(" / ")[0]}
                  </span>
                  {activity.profiles?.full_name && (
                    <span className="text-xs text-gray-400">
                      User: {activity.profiles.full_name}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">
                    {formatTimestamp(activity.action_time)}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteActivity(activity.id)}
                    className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                    title="Xoá hoạt động này"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <p className="text-sm text-gray-700 whitespace-pre-line">
                {activity.note}
              </p>
              {activity.duration_min && (
                <p className="text-xs text-gray-500">
                  Thời lượng: {activity.duration_min} phút
                </p>
              )}
              {activity.location && (
                <p className="text-xs text-gray-500">Địa điểm: {activity.location}</p>
              )}
              {activity.due_date && (
                <p className="text-xs text-gray-500">Hạn: {activity.due_date}</p>
              )}
              {activity.attachment_url && (
                <a
                  href={activity.attachment_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 underline"
                >
                  📎 Đính kèm
                </a>
              )}
            </div>
          </div>
        );
      })}
    </div>
  ) : (
    <div className="text-center py-8 text-gray-500">
      <Clock className="h-12 w-12 mx-auto mb-2 text-gray-300" />
      <p>No activity history yet / Chưa có lịch sử hoạt động</p>
      <p className="text-sm">
        Add your first interaction above / Thêm tương tác đầu tiên ở trên
      </p>
    </div>
  )}
</ScrollArea>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-lg font-semibold text-purple-600">
                    <FileText className="h-5 w-5" />
                    <span>Ghi chú</span>
                  </div>
                  {!editingNotes && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingNotes(true)}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Chỉnh sửa Ghi chú
                    </Button>
                  )}
                </div>
                <Separator />
                {editingNotes ? (
                  <div className="space-y-3">
                    <Textarea
                      value={tempNotes}
                      onChange={(e) => setTempNotes(e.target.value)}
                      placeholder="Enter notes about this contact..."
                      rows={6}
                      className="w-full"
                    />
                    <div className="flex gap-2">
                      <Button onClick={handleSaveNotes}>Save / Lưu</Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setEditingNotes(false);
                          setTempNotes(selectedContact.notes || "");
                        }}
                      >
                        Cancel / Hủy
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="min-h-[120px] p-4 border rounded-lg bg-gray-50">
                    {selectedContact.notes ? (
                      <p className="text-gray-700 whitespace-pre-wrap">{selectedContact.notes}</p>
                    ) : (
                      <p className="text-gray-500 italic">No notes available / Chưa có ghi chú</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter className="flex justify-between w-full">
            <Button
              variant="outline"
              size="sm"
              className="border-blue-500 text-blue-600 hover:bg-blue-50 hover:border-blue-600 w-32"
              onClick={() => {
                setIsViewDialogOpen(false);
                setIsEditDialogOpen(true);
                setNewContact(selectedContact!);
              }}
            >
              <Edit className="h-4 w-4 mr-1" />
              Sửa
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-red-500 text-red-600 hover:bg-red-50 hover:border-red-600 w-32"
              onClick={() => setIsViewDialogOpen(false)}
            >
              <X className="h-4 w-4 mr-1" />
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader className="items-center text-center">
            <DialogTitle>Chỉnh sửa liên hệ</DialogTitle>
          </DialogHeader>
          {renderContactForm(true)}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel / Hủy
            </Button>
            <Button onClick={handleUpdateContact}>Update / Cập nhật</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
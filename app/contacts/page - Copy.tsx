"use client"

import React, { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { supabase } from "@/lib/supabaseClient"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
} from "@/components/ui/alert-dialog"

import { toast } from "sonner"
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
} from "lucide-react"

// ---------- Constant Options ----------
const LIFE_STAGE_OPTIONS = [
  { value: "subscriber", label: "Subscriber / Đăng ký nhận tin" },
  { value: "lead", label: "Lead / Tiềm năng" },
  { value: "opportunity", label: "Opportunity / Cơ hội" },
  { value: "customer", label: "Customer / Khách hàng" },
]


// ---------- History Activities ----------
const activityTypes = [
  { value: "call", label: "📞 Phone Call / Cuộc gọi", emoji: "📞" },
  { value: "email", label: "📧 Email / Thư điện tử", emoji: "📧" },
  { value: "meeting", label: "🤝 Meeting / Cuộc họp", emoji: "🤝" },
  { value: "zalo", label: "💬 Zalo Message / Tin nhắn Zalo", emoji: "💬" },
  { value: "note", label: "📝 Note / Ghi chú", emoji: "📝" },
  { value: "task", label: "✅ Task / Nhiệm vụ", emoji: "✅" },
]

const getActivityTypeInfo = (type) => {
  const found = activityTypes.find((t) => t.value === type)
  return found || { emoji: "❓", label: type }
}

///---------------------------------///
function getLifeStageColor(stage: string) {
  switch (stage) {
    case "subscriber": return "bg-gray-100 text-gray-800"
    case "lead": return "bg-yellow-100 text-yellow-800"
    case "opportunity": return "bg-blue-100 text-blue-800"
    case "customer": return "bg-green-100 text-green-800"
    default: return "bg-gray-100 text-gray-800"
  }
}
function formatTimestamp(ts: string | undefined) {
  if (!ts) return ""
  const date = new Date(ts)
  return date.toLocaleString("en-GB", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short", year: "numeric" })
}

export default function ContactsPage() {
  // ----------------- State -----------------
  const { user } = useAuth()

  // Activities History
  const [activities, setActivities] = useState<any[]>([])
  const [activityLoading, setActivityLoading] = useState(false)

 
  // Options (Dropdowns)
  const [companySizeOptions, setCompanySizeOptions] = useState<any[]>([])
  const [industryOptions, setIndustryOptions] = useState<any[]>([])
  const [dataSourceOptions, setDataSourceOptions] = useState<any[]>([])
  const [profileOptions, setProfileOptions] = useState<any[]>([])

  // Contacts/CRUD
  const [contacts, setContacts] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [lifeStageFilter, setLifeStageFilter] = useState("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isAddActivityDialogOpen, setIsAddActivityDialogOpen] = useState(false)
  const [selectedContact, setSelectedContact] = useState<any>(null)
  const [editingNotes, setEditingNotes] = useState(false)
  const [tempNotes, setTempNotes] = useState("")

  // New Contact (với assigned_to mặc định là user đang đăng nhập, có thể null)
  const [newContact, setNewContact] = useState<any>({
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
    next_appointment_at: "",
    tags: [],
    notes: "",
  })

  // Empy Contact Form
  const emptyContact = {
  name: "",
  email: "",
  phone: "",
  zalo: "",
  company: "",
  company_size: "",
  industry: "",
  data_source: "",
  life_stage: "lead",
  assigned_to: "unassigned", // hoặc null tuỳ logic select bạn
  position: "",
  address: "",
  next_appointment_at: "",
  tags: [],
  notes: "",
}


  // New Activity
  const [newActivity, setNewActivity] = useState({
    type: "call",
    note: "",
    date: new Date().toISOString().split("T")[0],
    time: new Date().toTimeString().slice(0, 5),
    duration: "",
    location: "",
    dueDate: "",
    file: null as File | null,
  })

 // Khi mở dialog xem contact (isViewDialogOpen) và có selectedContact:
useEffect(() => {
  if (isViewDialogOpen && selectedContact?.id) {
    fetchContactActivities(selectedContact.id)
  }
  // eslint-disable-next-line
}, [isViewDialogOpen, selectedContact])

const fetchContactActivities = async (contactId: string) => {
  setActivityLoading(true)
  const { data, error } = await supabase
    .from("contact_history")
    .select("*")
    .eq("contact_id", contactId)
    .order("action_time", { ascending: false })
  if (!error) setActivities(data || [])
  setActivityLoading(false)
}



  // Khi user đăng nhập đổi (như đăng nhập lần đầu), set lại default assigned_to
  useEffect(() => {
    setNewContact(prev => ({ ...prev, assigned_to: user?.id || "" }))
  }, [user])

  // Load các options config & profile & contacts
  useEffect(() => {
    fetchOptions()
    fetchContacts()
  }, [])

  const fetchOptions = async () => {
    const { data: appConfig } = await supabase.from("app_config").select("*").eq("active", true)
    setCompanySizeOptions(appConfig?.filter((i: any) => i.type === "company_size") || [])
    setIndustryOptions(appConfig?.filter((i: any) => i.type === "industry") || [])
    setDataSourceOptions(appConfig?.filter((i: any) => i.type === "data_source") || [])
    const { data: profiles } = await supabase.from("profiles").select("id, full_name")
    setProfileOptions(profiles || [])
  }

  const fetchContacts = async () => {
    const { data } = await supabase.from("contacts").select("*")
    setContacts(data || [])
  }

  // ----------------- FILTER -----------------
  const filteredContacts = contacts.filter((contact) => {
    const matchesSearch =
      (contact.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (contact.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (contact.company || "").toLowerCase().includes(searchTerm.toLowerCase())
    const matchesLifeStage = lifeStageFilter === "all" || contact.life_stage === lifeStageFilter
    return matchesSearch && matchesLifeStage
  })

  // ------------- CRUD HANDLERS --------------
  const handleAddContact = async () => {
    const insertData = {
      ...newContact,
      assigned_to: newContact.assigned_to === "unassigned" ? null : newContact.assigned_to,
      tags: newContact.tags,
    }
    const { error } = await supabase.from("contacts").insert([insertData])
    if (error) {
      toast.error("Lỗi khi thêm liên hệ: " + error.message)
      return
    }
    toast.success("Đã thêm liên hệ thành công")
    setIsAddDialogOpen(false)
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
      assigned_to: user?.id || "", // reset về mặc định là user hiện tại
      position: "",
      address: "",
      next_appointment_at: "",
      tags: [],
      notes: "",
    })
    fetchContacts()
  }

  const handleViewContact = (contact: any) => {
    setSelectedContact(contact)
    setTempNotes(contact.notes)
    setIsViewDialogOpen(true)
  }

  const handleEditContact = (contact: any) => {
    setSelectedContact(contact)
    setNewContact({ ...contact, tags: contact.tags || [] })
    setIsEditDialogOpen(true)
  }

  const handleUpdateContact = async () => {
    if (!selectedContact) return
    const updateData = { ...newContact, tags: newContact.tags }
    const { error } = await supabase
      .from("contacts")
      .update(updateData)
      .eq("id", selectedContact.id)
    if (error) {
      toast.error("Lỗi cập nhật liên hệ: " + error.message)
      return
    }
    toast.success("Cập nhật liên hệ thành công")
    setIsEditDialogOpen(false)
    fetchContacts()
  }

  const handleDeleteContact = async (contactId: any) => {
    const { error } = await supabase.from("contacts").delete().eq("id", contactId)
    if (error) {
      toast.error("Lỗi khi xoá liên hệ: " + error.message)
      return
    }
    toast.success("Đã xoá liên hệ")
    fetchContacts()
  }

  const handleSaveNotes = async () => {
    if (!selectedContact) return
    const { error } = await supabase
      .from("contacts")
      .update({ notes: tempNotes })
      .eq("id", selectedContact.id)
    if (error) {
      toast.error("Lỗi lưu ghi chú: " + error.message)
      return
    }
    setEditingNotes(false)
    toast.success("Đã lưu ghi chú")
    fetchContacts()
  }

  // ----------------- ACTIVITY -----------------
  const handleAddActivity = async () => {
  if (!selectedContact) return
  // Tùy chọn: nếu có file, upload lên Supabase storage và lấy URL
  // Ở đây để attachment_url = null, bạn có thể mở rộng sau!
  const insertData = {
    contact_id: selectedContact.id,
    type: newActivity.type,
    note: newActivity.note,
    action_time: new Date(`${newActivity.date}T${newActivity.time}`),
    attachment_url: null, // Bổ sung nếu bạn cần
  }
  const { error } = await supabase.from('contact_history').insert([insertData])
  if (error) {
    toast.error("Lỗi thêm hoạt động: " + error.message)
    return
  }
  toast.success("Đã thêm hoạt động")
  setIsAddActivityDialogOpen(false)
  setNewActivity({
    type: "call",
    note: "",
    date: new Date().toISOString().split("T")[0],
    time: new Date().toTimeString().slice(0, 5),
    duration: "",
    location: "",
    dueDate: "",
    file: null,
  })
  fetchContactActivities(selectedContact.id)
}

const handleDeleteActivity = async (activityId: string) => {
  const { error } = await supabase.from('contact_history').delete().eq('id', activityId)
  if (error) {
    toast.error("Lỗi xóa hoạt động: " + error.message)
    return
  }
  toast.success("Đã xóa hoạt động")
  fetchContactActivities(selectedContact.id)
}



  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) setNewActivity({ ...newActivity, file })
  }

  // ----------- Tags Input Handler -----------
  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === "," || e.key === " ") {
      e.preventDefault()
      const value = e.currentTarget.value.trim()
      if (value && !newContact.tags.includes(value)) {
        setNewContact({ ...newContact, tags: [...newContact.tags, value] })
        e.currentTarget.value = ""
      }
    }
    if (e.key === "Backspace" && !e.currentTarget.value && newContact.tags.length) {
      setNewContact({ ...newContact, tags: newContact.tags.slice(0, -1) })
    }
  }

  // ---------------------- UI ----------------------
  return (
    <div className="space-y-6">
      {/* HEADER & ADD DIALOG */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contacts</h1>
          <p className="text-muted-foreground">Quản lý danh bạ khách hàng</p>
        </div>
        {/* ADD CONTACT DIALOG */}
        <Dialog
          open={isAddDialogOpen}
          onOpenChange={(open) => {
            setIsAddDialogOpen(open)
            if (open) setNewContact(emptyContact)
          }}
        >
          <DialogTrigger asChild>
          <Button onClick={() => setNewContact(emptyContact)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Contact / Thêm liên hệ
          </Button>
        </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Contact / Thêm liên hệ mới</DialogTitle>
              <DialogDescription>
                Tạo liên hệ mới trong hệ thống CRM
              </DialogDescription>
            </DialogHeader>
			
            <div className="grid gap-4">
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
                        <SelectItem key={opt.value} value={opt.value}>{opt.value}</SelectItem>
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
                        <SelectItem key={opt.value} value={opt.value}>{opt.value}</SelectItem>
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
                      <SelectItem key={opt.value} value={opt.value}>{opt.value}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* ASSIGNED TO */}
              <div className="space-y-2">
                <Label htmlFor="assigned_to">Assigned To / Phụ trách</Label>
                <Select
                  value={newContact.assigned_to || "unassigned"}
                  onValueChange={(value) => setNewContact({ ...newContact, assigned_to: value || null })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn nhân sự phụ trách (có thể để trống)..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">-- Chưa phân bổ --</SelectItem>
                    {profileOptions.map((profile) => (
                      <SelectItem key={profile.id} value={profile.id}>{profile.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* TAGS */}
              <div className="space-y-2">
                <Label>Tags / Nhãn</Label>
                <div className="flex flex-wrap gap-2">
                  {newContact.tags.map((tag: string, idx: number) => (
                    <Badge key={idx} className="bg-blue-100 text-blue-800">
                      {tag}
                      <button
                        type="button"
                        className="ml-1 text-xs"
                        onClick={() => setNewContact({ ...newContact, tags: newContact.tags.filter((t: string) => t !== tag) })}
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
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
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
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel / Hủy
              </Button>
              <Button onClick={handleAddContact}>Add Contact / Thêm liên hệ</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* SEARCH & FILTER */}
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
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* DANH SÁCH LIÊN HỆ */}
      <div className="grid gap-4">
        {filteredContacts.length === 0 && (
          <div className="text-center text-gray-400">Không tìm thấy liên hệ phù hợp.</div>
        )}
        {filteredContacts.map((contact) => (
          <Card key={contact.id} className="hover:shadow-lg">
            <CardHeader className="flex flex-row justify-between items-center pb-3">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-4 w-4 text-blue-600" />
                  {contact.name}
                  <Badge className={getLifeStageColor(contact.life_stage)}>{LIFE_STAGE_OPTIONS.find(l => l.value === contact.life_stage)?.label || contact.life_stage}</Badge>
                </CardTitle>
                <CardDescription className="flex gap-2 items-center">
                  <Mail className="h-4 w-4" />{contact.email}
                  <Phone className="h-4 w-4 ml-4" />{contact.phone}
                  <Building className="h-4 w-4 ml-4" />{contact.company}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => handleViewContact(contact)}>
                  <Eye className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleEditContact(contact)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Xoá liên hệ?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Hành động này không thể hoàn tác. Bạn có chắc chắn muốn xoá liên hệ này?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDeleteContact(contact.id)}>
                        Xoá
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardHeader>
            <CardContent>
             
            </CardContent>
          </Card>
        ))}
      </div>

      {/* --- View Dialog --- */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-blue-600" />
              Contact Details / Chi tiết liên hệ
            </DialogTitle>
            <DialogDescription>
              View and manage contact information and activity history<br />
              Xem và quản lý thông tin liên hệ và lịch sử hoạt động
            </DialogDescription>
          </DialogHeader>
          {selectedContact && (
            <div className="space-y-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              {/* Thông tin cơ bản */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-lg font-semibold text-blue-600">
                  <User className="h-5 w-5" />
                  <span>Basic Information / Thông tin cơ bản</span>
                </div>
                <Separator />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-600">Full Name / Họ và tên</Label>
                    <p className="font-medium">{selectedContact.name}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-600">Email / Thư điện tử</Label>
                    <p className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      {selectedContact.email}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-600">Phone / Số điện thoại</Label>
                    <p className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      {selectedContact.phone}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-600">Company / Công ty</Label>
                    <p className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-gray-400" />
                      {selectedContact.company}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-600">Position / Chức vụ</Label>
                    <p>{selectedContact.position}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-600">Life Stage / Giai đoạn</Label>
                    <Badge className={getLifeStageColor(selectedContact.life_stage)}>
                      {LIFE_STAGE_OPTIONS.find(l => l.value === selectedContact.life_stage)?.label || selectedContact.life_stage}
                    </Badge>
                  </div>
                  <div className="space-y-2 md:col-span-2 lg:col-span-3">
                    <Label className="text-sm font-medium text-gray-600">Address / Địa chỉ</Label>
                    <p className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      {selectedContact.address || <span className="italic text-gray-400">-</span>}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-600">Data Source / Nguồn</Label>
                    <Badge variant="outline">{selectedContact.data_source}</Badge>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-600">Assigned To / Phụ trách</Label>
                    <p>{profileOptions.find((p) => p.id === selectedContact.assigned_to)?.full_name || <span className="italic text-gray-400">-</span>}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-600">Last Appointment / Lịch hẹn cuối</Label>
                    <p className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      {selectedContact.next_appointment_at ? formatTimestamp(selectedContact.next_appointment_at) : <span className="italic text-gray-400">-</span>}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-600">Tags / Nhãn</Label>
                    <div>
                      {(selectedContact.tags || []).map((tag: string, idx: number) => (
                        <Badge key={idx} variant="outline" className="mr-1">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Lịch sử liên hệ */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-lg font-semibold text-green-600">
                    <Clock className="h-5 w-5" />
                    <span>Contact History / Lịch sử liên hệ</span>
                  </div>
                  <Dialog open={isAddActivityDialogOpen} onOpenChange={setIsAddActivityDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Activity / Thêm hoạt động
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Add New Activity / Thêm hoạt động mới</DialogTitle>
                        <DialogDescription>
                          Log a new interaction with this contact<br />
                          Ghi lại tương tác mới với liên hệ này
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="activity-type">Activity Type / Loại hoạt động</Label>
                            <Select
                              value={newActivity.type}
                              onValueChange={(value) => setNewActivity({ ...newActivity, type: value })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {activityTypes.map((type) => (
                                  <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="activity-date">Date / Ngày</Label>
                            <Input
                              id="activity-date"
                              type="date"
                              value={newActivity.date}
                              onChange={(e) => setNewActivity({ ...newActivity, date: e.target.value })}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="activity-time">Time / Giờ</Label>
                            <Input
                              id="activity-time"
                              type="time"
                              value={newActivity.time}
                              onChange={(e) => setNewActivity({ ...newActivity, time: e.target.value })}
                            />
                          </div>
                          {(newActivity.type === "call" || newActivity.type === "meeting") && (
                            <div className="space-y-2">
                              <Label htmlFor="duration">Duration (minutes) / Thời lượng (phút)</Label>
                              <Input
                                id="duration"
                                type="number"
                                value={newActivity.duration}
                                onChange={(e) => setNewActivity({ ...newActivity, duration: e.target.value })}
                                placeholder="30"
                              />
                            </div>
                          )}
                        </div>
                        {(newActivity.type === "meeting" || newActivity.type === "call") && (
                          <div className="space-y-2">
                            <Label htmlFor="location">Location / Địa điểm</Label>
                            <Input
                              id="location"
                              value={newActivity.location}
                              onChange={(e) => setNewActivity({ ...newActivity, location: e.target.value })}
                              placeholder="Office, Zoom, Phone..."
                            />
                          </div>
                        )}
                        {newActivity.type === "task" && (
                          <div className="space-y-2">
                            <Label htmlFor="due-date">Due Date / Hạn hoàn thành</Label>
                            <Input
                              id="due-date"
                              type="date"
                              value={newActivity.dueDate}
                              onChange={(e) => setNewActivity({ ...newActivity, dueDate: e.target.value })}
                            />
                          </div>
                        )}
                        <div className="space-y-2">
                          <Label htmlFor="activity-note">Note / Ghi chú</Label>
                          <Textarea
                            id="activity-note"
                            value={newActivity.note}
                            onChange={(e) => setNewActivity({ ...newActivity, note: e.target.value })}
                            placeholder="Enter activity details..."
                            rows={3}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="file-upload">Attach File / Đính kèm tệp (Optional)</Label>
                          <div className="flex items-center gap-2">
                            <Input id="file-upload" type="file" onChange={handleFileUpload} className="flex-1" />
                            {newActivity.file && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setNewActivity({ ...newActivity, file: null })}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                          {newActivity.file && (
                            <p className="text-sm text-gray-600">Selected: {newActivity.file.name}</p>
                          )}
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
  ) : activities && activities.length > 0 ? (
    <div className="space-y-3">
      {activities.map((activity: any) => {
        const typeInfo = getActivityTypeInfo
          ? getActivityTypeInfo(activity.type)
          : { emoji: "❓", label: activity.type }
        return (
          <div
            key={activity.id}
            className="flex gap-3 p-3 border rounded-lg bg-gray-50 hover:bg-gray-100 transition"
          >
            {/* Icon loại hoạt động */}
            <div className="text-2xl">{typeInfo.emoji}</div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                {/* Loại activity + user thực hiện */}
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{typeInfo.label.split(" / ")[0]}</span>
                  {/* Nếu bạn lưu tên user thực hiện activity, render ở đây */}
                  {activity.user && (
                    <span className="text-xs text-gray-500">by {activity.user}</span>
                  )}
                  {activity.user_id && !activity.user && (
                    <span className="text-xs text-gray-400">User: {activity.user_id}</span>
                  )}
                </div>
                {/* Thời gian + nút xoá */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">
                    {formatTimestamp(activity.action_time || activity.timestamp)}
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
              <p className="text-sm text-gray-700 whitespace-pre-line">{activity.note}</p>
              {/* Hiển thị thêm thông tin nếu có */}
              {activity.duration && (
                <p className="text-xs text-gray-500">Thời lượng: {activity.duration} phút</p>
              )}
              {activity.location && (
                <p className="text-xs text-gray-500">Địa điểm: {activity.location}</p>
              )}
              {activity.dueDate && (
                <p className="text-xs text-gray-500">Hạn: {activity.dueDate}</p>
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
        )
      })}
    </div>
  ) : (
    <div className="text-center py-8 text-gray-500">
      <Clock className="h-12 w-12 mx-auto mb-2 text-gray-300" />
      <p>No activity history yet / Chưa có lịch sử hoạt động</p>
      <p className="text-sm">Add your first interaction above / Thêm tương tác đầu tiên ở trên</p>
    </div>
  )}
</ScrollArea>




              </div>

              {/* Notes Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-lg font-semibold text-purple-600">
                    <FileText className="h-5 w-5" />
                    <span>Notes / Ghi chú</span>
                  </div>
                  {!editingNotes && (
                    <Button variant="outline" size="sm" onClick={() => setEditingNotes(true)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit / Chỉnh sửa
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
                          setEditingNotes(false)
                          setTempNotes(selectedContact.notes)
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
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close / Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- Edit Dialog (giống Add nhưng là update) --- */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Contact / Chỉnh sửa liên hệ</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            {/* Copy full form Add Contact, chỉ thay nút thành Update và state là newContact */}
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
                      <SelectItem key={opt.value} value={opt.value}>{opt.value}</SelectItem>
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
                      <SelectItem key={opt.value} value={opt.value}>{opt.value}</SelectItem>
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
                    <SelectItem key={opt.value} value={opt.value}>{opt.value}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="assigned_to">Assigned To / Phụ trách</Label>
              <Select
                value={newContact.assigned_to}
                onValueChange={(value) => setNewContact({ ...newContact, assigned_to: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn nhân sự phụ trách..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">-- Chưa phân bổ --</SelectItem>
                  {profileOptions.map((profile) => (
                    <SelectItem key={profile.id} value={profile.id}>{profile.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tags / Nhãn</Label>
              <div className="flex flex-wrap gap-2">
                {newContact.tags.map((tag: string, idx: number) => (
                  <Badge key={idx} className="bg-blue-100 text-blue-800">
                    {tag}
                    <button
                      type="button"
                      className="ml-1 text-xs"
                      onClick={() => setNewContact({ ...newContact, tags: newContact.tags.filter((t: string) => t !== tag) })}
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
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
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
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel / Hủy
            </Button>
            <Button onClick={handleUpdateContact}>Update / Cập nhật</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

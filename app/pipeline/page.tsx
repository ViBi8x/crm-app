"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { useAuth } from "@/components/auth-provider"
import { toast } from "sonner" // Thay bằng import từ sonner
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"
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
  Info           
} from "lucide-react"

// Định nghĩa các stage pipeline
const stages = [
  { id: "subscriber", title: "Subscriber", vietnamese: "Người đăng ký", color: "border-t-blue-500" },
  { id: "lead", title: "Lead", vietnamese: "Khách tiềm năng", color: "border-t-green-500" },
  { id: "opportunity", title: "Opportunity", vietnamese: "Cơ hội", color: "border-t-yellow-500" },
  { id: "customer", title: "Customer", vietnamese: "Khách hàng", color: "border-t-red-500" }
]

export default function PipelinePage() {
  const { user } = useAuth();
  const [columns, setColumns] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [moveDialog, setMoveDialog] = useState({
    isOpen: false,
    contact: null as any,
    fromColumn: "",
    toColumn: "",
  })

  // state quản lý dialog chi tiết
  const [detailDialog, setDetailDialog] = useState<{
    open: boolean,
    contact: any | null
  }>({ open: false, contact: null })

  // profilesMap: { user_id: full_name }
  const [profilesMap, setProfilesMap] = useState<{ [key: string]: string }>({})

  // Fetch tất cả profiles về và tạo map id->full_name
  const fetchProfiles = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name')
    if (data) {
      const map: { [key: string]: string } = {}
      data.forEach((profile) => {
        map[profile.id] = profile.full_name
      })
      setProfilesMap(map)
    }
  }

  // Fetch contacts, mapping sang các column, gán full_name cho assignedTo
  const fetchContacts = async (profilesMapArg?: { [key: string]: string }) => {
    setLoading(true)
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      setLoading(false)
      return
    }

    const profilesLookup = profilesMapArg || profilesMap

    // Group contacts theo life_stage
    const group: any = {}
    stages.forEach(stage => group[stage.id] = { ...stage, contacts: [] })

    data?.forEach((contact) => {
      const stage = contact.life_stage || "subscriber"
      if (!group[stage]) group[stage] = { ...stages[0], contacts: [] }
      group[stage].contacts.push({
        id: contact.id.toString(),
        name: contact.name,
        email: contact.email,
        phone: contact.phone,
        zalo: contact.zalo,
        company: contact.company,
        company_size: contact.company_size,
        industry: contact.industry,
        address: contact.address,
        next_appointment_at: contact.next_appointment_at,
        assignedTo: profilesLookup[contact.assigned_to] || contact.assigned_to || "",
        avatar: contact.avatar_url || "/placeholder.svg",
        tags: contact.tags || [],
      })
    })

    setColumns(group)
    setLoading(false)
  }

  // Khi load page, fetch cả profiles và contacts.
  useEffect(() => {
    const loadAll = async () => {
      await fetchProfiles()
    }
    loadAll()
  }, [])

  // Sau khi profilesMap thay đổi (fetch xong), fetch contacts
  useEffect(() => {
    if (Object.keys(profilesMap).length > 0) {
      fetchContacts(profilesMap)
    }
  }, [profilesMap])

  // Kéo thả giữa các cột
  const onDragEnd = (result: any) => {
    const { destination, source, draggableId } = result
    if (!destination) return
    if (destination.droppableId === source.droppableId && destination.index === source.index) {
      return
    }
    const sourceColumn = columns[source.droppableId as keyof typeof columns]
    const contact = sourceColumn.contacts.find((c: any) => c.id === draggableId)
    if (!contact) return

    if (destination.droppableId !== source.droppableId) {
      setMoveDialog({
        isOpen: true,
        contact,
        fromColumn: source.droppableId,
        toColumn: destination.droppableId,
      })
      return
    }

    // Reorder trong cùng column
    const newContacts = Array.from(sourceColumn.contacts)
    newContacts.splice(source.index, 1)
    newContacts.splice(destination.index, 0, contact)
    setColumns({
      ...columns,
      [source.droppableId]: {
        ...sourceColumn,
        contacts: newContacts,
      },
    })
  }

  // Xác nhận chuyển stage (update Supabase)
  const confirmMove = async () => {
    const { contact, fromColumn, toColumn } = moveDialog;
    if (!contact || !contact.id) return;

    const response = await fetch("/api/activity/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: user?.id,
        action_type: "pipeline_moved",
        target_id: contact.id,
        target_type: "contact",
        detail: {
          contactName: contact.name,
          from: fromColumn,
          to: toColumn,
          userName: user?.full_name || "",
        },
      }),
    });
    const result = await response.json();

    if (response.ok && result.success) {
      // Cập nhật state chỉ khi API thành công
      setColumns((prev: any) => {
        const sourceContacts = prev[fromColumn].contacts.filter((c: any) => c.id !== contact.id);
        const destContacts = [...prev[toColumn].contacts, { ...contact, life_stage: toColumn }];
        return {
          ...prev,
          [fromColumn]: { ...prev[fromColumn], contacts: sourceContacts },
          [toColumn]: { ...prev[toColumn], contacts: destContacts },
        };
      });
      toast.success("Di chuyển liên hệ thành công!"); // Sử dụng toast.success từ sonner
      setMoveDialog({ isOpen: false, contact: null, fromColumn: "", toColumn: "" });
    } else {
      toast.error(`Lỗi di chuyển liên hệ: ${result.error || "Unknown error"}`);
    }
  };

  const getColumnColor = (columnId: string) => {
    const stage = stages.find((s) => s.id === columnId)
    return stage ? stage.color : "border-t-gray-500"
  }
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Sales Pipeline</h1>
        <p className="text-muted-foreground">Quy trình bán hàng - Kéo thả để di chuyển liên hệ</p>
      </div>
      {loading ? (
        <div className="text-center py-10 text-muted-foreground">Đang tải dữ liệu...</div>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stages.map((column) => (
              <Card key={column.id} className={`border-t-4 ${getColumnColor(column.id)}`}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span>{column.title}</span>
                      <span className="text-sm font-normal text-muted-foreground">{column.vietnamese}</span>
                    </div>
                    <Badge variant="secondary">{columns[column.id]?.contacts?.length || 0}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Droppable droppableId={column.id}>
                    {(provided, snapshot) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className={`space-y-3 min-h-[200px] ${
                          snapshot.isDraggingOver ? "bg-blue-50 rounded-lg p-2" : ""
                        }`}
                      >
                        {columns[column.id]?.contacts?.map((contact: any, index: number) => (
                          <Draggable key={contact.id} draggableId={contact.id} index={index}>
                            {(provided, snapshot) => (
                              <Card
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`cursor-move ${snapshot.isDragging ? "shadow-lg rotate-2" : ""} hover:ring-2 hover:ring-primary`}
                                onClick={() => setDetailDialog({ open: true, contact })}
                              >
                                <CardContent className="p-4">
                                  <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                      <Avatar className="h-8 w-8">
                                        <AvatarImage src={contact.avatar || "/placeholder.svg"} />
                                        <AvatarFallback>
                                          {contact.name
                                            .split(" ")
                                            .map((n: string) => n[0])
                                            .join("")}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm truncate">{contact.name}</p>
                                        <p className="text-xs text-muted-foreground truncate">{contact.company}</p>
                                      </div>
                                    </div>
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <Mail className="h-3 w-3" />
                                        <span className="truncate">{contact.email}</span>
                                      </div>
                                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <Phone className="h-3 w-3" />
                                        <span>{contact.phone}</span>
                                      </div>
                                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <User className="h-3 w-3" />
                                        <span>{contact.assignedTo}</span>
                                      </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <span className="font-semibold text-green-600">{contact.value}</span>
                                      <div className="flex gap-1">
                                        {(contact.tags || []).slice(0, 2).map((tag: string) => (
                                          <Badge key={tag} variant="outline" className="text-xs">
                                            {tag}
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </CardContent>
              </Card>
            ))}
          </div>
        </DragDropContext>
      )}

      {/* Move Confirmation Dialog */}
      <Dialog open={moveDialog.isOpen} onOpenChange={(open) => setMoveDialog({ ...moveDialog, isOpen: open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Move / Xác nhận di chuyển</DialogTitle>
            <DialogDescription>
              Are you sure you want to move this contact to a different stage?
              <br />
              <span className="text-sm text-muted-foreground">
                Bạn có chắc chắn muốn di chuyển liên hệ này sang giai đoạn khác?
              </span>
            </DialogDescription>
          </DialogHeader>
          {moveDialog.contact && (
            <div className="py-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={moveDialog.contact.avatar || "/placeholder.svg"} />
                  <AvatarFallback>
                    {moveDialog.contact.name
                      .split(" ")
                      .map((n: string) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{moveDialog.contact.name}</p>
                  <p className="text-sm text-muted-foreground">{moveDialog.contact.company}</p>
                </div>
              </div>
              <div className="mt-3 text-sm">
                <p>
                  Moving from: <strong>{columns[moveDialog.fromColumn as keyof typeof columns]?.title}</strong>
                  <br />
                  <span className="text-muted-foreground">
                    Từ: {columns[moveDialog.fromColumn as keyof typeof columns]?.vietnamese}
                  </span>
                </p>
                <p className="mt-1">
                  Moving to: <strong>{columns[moveDialog.toColumn as keyof typeof columns]?.title}</strong>
                  <br />
                  <span className="text-muted-foreground">
                    Đến: {columns[moveDialog.toColumn as keyof typeof columns]?.vietnamese}
                  </span>
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setMoveDialog({ ...moveDialog, isOpen: false })}>
              Cancel / Hủy
            </Button>
            <Button onClick={confirmMove}>Confirm Move / Xác nhận</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/*Dialog hiển thị chi tiết contact*/}
      <Dialog open={detailDialog.open} onOpenChange={open => setDetailDialog({ open, contact: open ? detailDialog.contact : null })}>
        <DialogContent className="max-w-lg ">
          <DialogHeader >
            <DialogTitle className="text-center text-blue-400">Chi tiết liên hệ</DialogTitle>
            <DialogDescription className="text-center">Xem thông tin đầy đủ của liên hệ</DialogDescription>
          </DialogHeader>
          {detailDialog.contact && (
            <div className="space-y-4">
              {/* Avatar, tên, công ty */}
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={detailDialog.contact.avatar || "/placeholder.svg"} />
                  <AvatarFallback>
                    {detailDialog.contact.name?.split(" ").map((n: string) => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-lg">{detailDialog.contact.name}</p>
                  <p className="text-sm text-muted-foreground">{detailDialog.contact.company}</p>
                </div>
              </div>

              {/* Thông tin chi tiết */}
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-blue-400" /> {detailDialog.contact.email}
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-blue-400" /> {detailDialog.contact.phone}
                </div>
                <div className="flex items-center gap-2 ">
                  <MessageCircle className="h-4 w-4 text-blue-400" />Zalo: {detailDialog.contact.zalo}
                </div>
                {/* Tag */}
                <div className="flex flex-wrap gap-2">
                  <Tag className="h-4 w-4 text-blue-400" />
                  {(detailDialog.contact.tags || []).map((tag: string) => (
                    <Badge key={tag} variant="outline">{tag}</Badge>
                  ))}
                </div>
                <hr className="my-2 border-gray-200" />

                <div className="flex items-center gap-2 lg:col-span-2">
                  <Building className="h-4 w-4 text-blue-400" />Công ty: {detailDialog.contact.company}
                </div>
                <div className="flex items-center gap-2 lg:col-span-2">
                  <Users className="h-4 w-4 text-blue-400" />Quy mô: {detailDialog.contact.company_size}
                </div>
                <div className="flex items-center gap-2 lg:col-span-2">
                  <Activity className="h-4 w-4 text-blue-400" />Ngành nghề: {detailDialog.contact.industry}
                </div>
                <div className="flex items-center gap-2 lg:col-span-2">
                  <MapPin className="h-4 w-4 text-blue-400" />Địa chỉ: {detailDialog.contact.address}
                </div>
                <hr className="my-2 border-gray-200" />
                <div className="flex items-center gap-2 lg:col-span-2">
                  <User className="h-4 w-4 text-blue-400" /> Người phụ trách: {detailDialog.contact.assignedTo}
                </div>
                <div className="flex items-center gap-2 lg:col-span-2">
                  <Calendar className="h-4 w-4 text-blue-400" />Lịch hẹn sắp tới:
                  {detailDialog.contact.next_appointment_at
                    ? new Date(detailDialog.contact.next_appointment_at).toLocaleString("vi-VN")
                    : <span className="italic text-gray-400">Chưa có</span>
                  }
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailDialog({ open: false, contact: null })}>Đóng</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
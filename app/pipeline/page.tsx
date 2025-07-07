"use client"

import { useState } from "react"
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
import { Phone, Mail, User } from "lucide-react"

// Mock pipeline data
const initialColumns = {
  subscriber: {
    id: "subscriber",
    title: "Subscriber",
    vietnamese: "Người đăng ký",
    contacts: [
      {
        id: "1",
        name: "Alice Johnson",
        email: "alice@email.com",
        phone: "+1 234 567 8900",
        company: "Design Co",
        value: "$5,000",
        assignedTo: "Sarah Wilson",
        avatar: "/placeholder.svg?height=32&width=32",
        tags: ["New", "Website"],
      },
      {
        id: "2",
        name: "Bob Smith",
        email: "bob@company.com",
        phone: "+1 234 567 8901",
        company: "Tech Solutions",
        value: "$12,000",
        assignedTo: "Mike Johnson",
        avatar: "/placeholder.svg?height=32&width=32",
        tags: ["LinkedIn", "Enterprise"],
      },
    ],
  },
  lead: {
    id: "lead",
    title: "Lead",
    vietnamese: "Khách tiềm năng",
    contacts: [
      {
        id: "3",
        name: "Carol Davis",
        email: "carol@startup.io",
        phone: "+1 234 567 8902",
        company: "StartupIO",
        value: "$8,000",
        assignedTo: "Lisa Brown",
        avatar: "/placeholder.svg?height=32&width=32",
        tags: ["Hot", "Demo Scheduled"],
      },
    ],
  },
  opportunity: {
    id: "opportunity",
    title: "Opportunity",
    vietnamese: "Cơ hội",
    contacts: [
      {
        id: "4",
        name: "David Wilson",
        email: "david@corp.com",
        phone: "+1 234 567 8903",
        company: "Big Corp",
        value: "$25,000",
        assignedTo: "Sarah Wilson",
        avatar: "/placeholder.svg?height=32&width=32",
        tags: ["Proposal Sent", "Decision Maker"],
      },
    ],
  },
  customer: {
    id: "customer",
    title: "Customer",
    vietnamese: "Khách hàng",
    contacts: [
      {
        id: "5",
        name: "Eva Martinez",
        email: "eva@business.com",
        phone: "+1 234 567 8904",
        company: "Business Inc",
        value: "$15,000",
        assignedTo: "Mike Johnson",
        avatar: "/placeholder.svg?height=32&width=32",
        tags: ["Closed Won", "Renewal"],
      },
    ],
  },
}

export default function PipelinePage() {
  const [columns, setColumns] = useState(initialColumns)
  const [moveDialog, setMoveDialog] = useState<{
    isOpen: boolean
    contact: any
    fromColumn: string
    toColumn: string
  }>({
    isOpen: false,
    contact: null,
    fromColumn: "",
    toColumn: "",
  })

  const onDragEnd = (result: any) => {
    const { destination, source, draggableId } = result

    if (!destination) return

    if (destination.droppableId === source.droppableId && destination.index === source.index) {
      return
    }

    // Find the contact being moved
    const sourceColumn = columns[source.droppableId as keyof typeof columns]
    const contact = sourceColumn.contacts.find((c) => c.id === draggableId)

    if (!contact) return

    // Show confirmation dialog if moving to different column
    if (destination.droppableId !== source.droppableId) {
      setMoveDialog({
        isOpen: true,
        contact,
        fromColumn: source.droppableId,
        toColumn: destination.droppableId,
      })
      return
    }

    // Handle reordering within same column
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

  const confirmMove = () => {
    const { contact, fromColumn, toColumn } = moveDialog

    // Remove from source column
    const sourceCol = columns[fromColumn as keyof typeof columns]
    const newSourceContacts = sourceCol.contacts.filter((c) => c.id !== contact.id)

    // Add to destination column
    const destCol = columns[toColumn as keyof typeof columns]
    const newDestContacts = [...destCol.contacts, contact]

    setColumns({
      ...columns,
      [fromColumn]: {
        ...sourceCol,
        contacts: newSourceContacts,
      },
      [toColumn]: {
        ...destCol,
        contacts: newDestContacts,
      },
    })

    setMoveDialog({ isOpen: false, contact: null, fromColumn: "", toColumn: "" })
  }

  const getColumnColor = (columnId: string) => {
    switch (columnId) {
      case "subscriber":
        return "border-t-blue-500"
      case "lead":
        return "border-t-green-500"
      case "opportunity":
        return "border-t-yellow-500"
      case "customer":
        return "border-t-red-500"
      default:
        return "border-t-gray-500"
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Sales Pipeline</h1>
        <p className="text-muted-foreground">Quy trình bán hàng - Kéo thả để di chuyển liên hệ</p>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Object.values(columns).map((column) => (
            <Card key={column.id} className={`border-t-4 ${getColumnColor(column.id)}`}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span>{column.title}</span>
                    <span className="text-sm font-normal text-muted-foreground">{column.vietnamese}</span>
                  </div>
                  <Badge variant="secondary">{column.contacts.length}</Badge>
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
                      {column.contacts.map((contact, index) => (
                        <Draggable key={contact.id} draggableId={contact.id} index={index}>
                          {(provided, snapshot) => (
                            <Card
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`cursor-move ${snapshot.isDragging ? "shadow-lg rotate-2" : ""}`}
                            >
                              <CardContent className="p-4">
                                <div className="space-y-3">
                                  <div className="flex items-center gap-3">
                                    <Avatar className="h-8 w-8">
                                      <AvatarImage src={contact.avatar || "/placeholder.svg"} />
                                      <AvatarFallback>
                                        {contact.name
                                          .split(" ")
                                          .map((n) => n[0])
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
                                      {contact.tags.slice(0, 2).map((tag) => (
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
    </div>
  )
}

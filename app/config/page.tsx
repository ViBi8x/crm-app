"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Edit, Trash2, GripVertical, Settings } from "lucide-react"
import { toast } from "sonner"

// Mock configuration data
const initialConfig = {
  industries: [
    { id: 1, english: "Technology", vietnamese: "Công nghệ", order: 1 },
    { id: 2, english: "Software", vietnamese: "Phần mềm", order: 2 },
    { id: 3, english: "Manufacturing", vietnamese: "Sản xuất", order: 3 },
    { id: 4, english: "Healthcare", vietnamese: "Y tế", order: 4 },
    { id: 5, english: "Finance", vietnamese: "Tài chính", order: 5 },
  ],
  companySizes: [
    { id: 1, english: "1-10", vietnamese: "1-10 nhân viên", order: 1 },
    { id: 2, english: "10-50", vietnamese: "10-50 nhân viên", order: 2 },
    { id: 3, english: "50-100", vietnamese: "50-100 nhân viên", order: 3 },
    { id: 4, english: "100-500", vietnamese: "100-500 nhân viên", order: 4 },
    { id: 5, english: "500+", vietnamese: "500+ nhân viên", order: 5 },
  ],
  dataSources: [
    { id: 1, english: "Website", vietnamese: "Trang web", order: 1 },
    { id: 2, english: "LinkedIn", vietnamese: "LinkedIn", order: 2 },
    { id: 3, english: "Trade Show", vietnamese: "Hội chợ thương mại", order: 3 },
    { id: 4, english: "Referral", vietnamese: "Giới thiệu", order: 4 },
    { id: 5, english: "Cold Call", vietnamese: "Gọi điện trực tiếp", order: 5 },
    { id: 6, english: "Email Campaign", vietnamese: "Chiến dịch email", order: 6 },
  ],
}

export default function ConfigPage() {
  const [config, setConfig] = useState(initialConfig)
  const [activeTab, setActiveTab] = useState("industries")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [formData, setFormData] = useState({
    english: "",
    vietnamese: "",
  })

  const getCurrentData = () => {
    switch (activeTab) {
      case "industries":
        return config.industries
      case "companySizes":
        return config.companySizes
      case "dataSources":
        return config.dataSources
      default:
        return []
    }
  }

  const getTabTitle = () => {
    switch (activeTab) {
      case "industries":
        return { english: "Industries", vietnamese: "Ngành nghề" }
      case "companySizes":
        return { english: "Company Sizes", vietnamese: "Quy mô công ty" }
      case "dataSources":
        return { english: "Data Sources", vietnamese: "Nguồn dữ liệu" }
      default:
        return { english: "", vietnamese: "" }
    }
  }

  const resetForm = () => {
    setFormData({
      english: "",
      vietnamese: "",
    })
  }

  const handleAdd = () => {
    const currentData = getCurrentData()
    const newItem = {
      id: Math.max(...currentData.map((item) => item.id)) + 1,
      ...formData,
      order: currentData.length + 1,
    }

    const updatedConfig = {
      ...config,
      [activeTab]: [...currentData, newItem],
    }

    setConfig(updatedConfig)
    setIsAddDialogOpen(false)
    resetForm()
    toast.success("Item added successfully! / Đã thêm mục thành công!")
  }

  const handleEdit = () => {
    const currentData = getCurrentData()
    const updatedData = currentData.map((item) => (item.id === selectedItem.id ? { ...item, ...formData } : item))

    const updatedConfig = {
      ...config,
      [activeTab]: updatedData,
    }

    setConfig(updatedConfig)
    setIsEditDialogOpen(false)
    setSelectedItem(null)
    resetForm()
    toast.success("Item updated successfully! / Đã cập nhật mục thành công!")
  }

  const handleDelete = (itemId: number) => {
    const currentData = getCurrentData()
    const updatedData = currentData.filter((item) => item.id !== itemId)

    const updatedConfig = {
      ...config,
      [activeTab]: updatedData,
    }

    setConfig(updatedConfig)
    toast.success("Item deleted successfully! / Đã xóa mục thành công!")
  }

  const openEditDialog = (item: any) => {
    setSelectedItem(item)
    setFormData({
      english: item.english,
      vietnamese: item.vietnamese,
    })
    setIsEditDialogOpen(true)
  }

  const moveItem = (itemId: number, direction: "up" | "down") => {
    const currentData = getCurrentData()
    const itemIndex = currentData.findIndex((item) => item.id === itemId)

    if ((direction === "up" && itemIndex === 0) || (direction === "down" && itemIndex === currentData.length - 1)) {
      return
    }

    const newData = [...currentData]
    const targetIndex = direction === "up" ? itemIndex - 1 : itemIndex + 1

    // Swap items
    ;[newData[itemIndex], newData[targetIndex]] = [newData[targetIndex], newData[itemIndex]]

    // Update order values
    newData.forEach((item, index) => {
      item.order = index + 1
    })

    const updatedConfig = {
      ...config,
      [activeTab]: newData,
    }

    setConfig(updatedConfig)
    toast.success("Item reordered successfully! / Đã sắp xếp lại thành công!")
  }

  const ConfigForm = ({ isEdit = false }) => (
    <div className="grid gap-4">
      <div className="space-y-2">
        <Label htmlFor="english">
          English Label <span className="text-red-500">*</span>
          <span className="block text-xs text-muted-foreground">Nhãn tiếng Anh</span>
        </Label>
        <Input
          id="english"
          value={formData.english}
          onChange={(e) => setFormData({ ...formData, english: e.target.value })}
          placeholder="Enter English label..."
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="vietnamese">
          Vietnamese Label <span className="text-red-500">*</span>
          <span className="block text-xs text-muted-foreground">Nhãn tiếng Việt</span>
        </Label>
        <Input
          id="vietnamese"
          value={formData.vietnamese}
          onChange={(e) => setFormData({ ...formData, vietnamese: e.target.value })}
          placeholder="Enter Vietnamese label..."
          required
        />
      </div>
    </div>
  )

  const currentData = getCurrentData()
  const tabTitle = getTabTitle()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Settings className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">App Configuration</h1>
          <p className="text-muted-foreground">Cấu hình ứng dụng - Chỉ dành cho Admin</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>System Configuration / Cấu hình hệ thống</CardTitle>
          <CardDescription>
            Manage dropdown options used throughout the application
            <br />
            Quản lý các tùy chọn dropdown được sử dụng trong ứng dụng
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="industries">
                <div className="text-center">
                  <div>Industries</div>
                  <div className="text-xs text-muted-foreground">Ngành nghề</div>
                </div>
              </TabsTrigger>
              <TabsTrigger value="companySizes">
                <div className="text-center">
                  <div>Company Sizes</div>
                  <div className="text-xs text-muted-foreground">Quy mô công ty</div>
                </div>
              </TabsTrigger>
              <TabsTrigger value="dataSources">
                <div className="text-center">
                  <div>Data Sources</div>
                  <div className="text-xs text-muted-foreground">Nguồn dữ liệu</div>
                </div>
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-lg font-semibold">{tabTitle.english}</h3>
                  <p className="text-sm text-muted-foreground">{tabTitle.vietnamese}</p>
                </div>
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={resetForm}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Option / Thêm tùy chọn
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Option / Thêm tùy chọn mới</DialogTitle>
                      <DialogDescription>
                        Create a new option for {tabTitle.english.toLowerCase()}
                        <br />
                        Tạo tùy chọn mới cho {tabTitle.vietnamese.toLowerCase()}
                      </DialogDescription>
                    </DialogHeader>
                    <ConfigForm />
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                        Cancel / Hủy
                      </Button>
                      <Button onClick={handleAdd} disabled={!formData.english || !formData.vietnamese}>
                        Add Option / Thêm tùy chọn
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">Order / Thứ tự</TableHead>
                      <TableHead>English Label / Nhãn tiếng Anh</TableHead>
                      <TableHead>Vietnamese Label / Nhãn tiếng Việt</TableHead>
                      <TableHead className="w-32">Actions / Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentData
                      .sort((a, b) => a.order - b.order)
                      .map((item, index) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <GripVertical className="h-4 w-4 text-muted-foreground" />
                              <div className="flex flex-col gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={() => moveItem(item.id, "up")}
                                  disabled={index === 0}
                                >
                                  ↑
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={() => moveItem(item.id, "down")}
                                  disabled={index === currentData.length - 1}
                                >
                                  ↓
                                </Button>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">{item.english}</TableCell>
                          <TableCell className="text-muted-foreground">{item.vietnamese}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="icon" onClick={() => openEditDialog(item)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-red-600"
                                onClick={() => handleDelete(item.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>

              {currentData.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    No options configured yet
                    <br />
                    Chưa có tùy chọn nào được cấu hình
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Option / Chỉnh sửa tùy chọn</DialogTitle>
            <DialogDescription>
              Update the option details
              <br />
              Cập nhật chi tiết tùy chọn
            </DialogDescription>
          </DialogHeader>
          <ConfigForm isEdit={true} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel / Hủy
            </Button>
            <Button onClick={handleEdit} disabled={!formData.english || !formData.vietnamese}>
              Save Changes / Lưu thay đổi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Usage Information */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Information / Thông tin sử dụng</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Industries / Ngành nghề</h4>
              <p className="text-sm text-blue-700">
                Used in Contact forms, filters, and analytics
                <br />
                <span className="text-blue-600">Được sử dụng trong form liên hệ, bộ lọc và phân tích</span>
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-medium text-green-900 mb-2">Company Sizes / Quy mô công ty</h4>
              <p className="text-sm text-green-700">
                Used in Contact forms and company profiling
                <br />
                <span className="text-green-600">Được sử dụng trong form liên hệ và hồ sơ công ty</span>
              </p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <h4 className="font-medium text-purple-900 mb-2">Data Sources / Nguồn dữ liệu</h4>
              <p className="text-sm text-purple-700">
                Used to track where contacts originated from
                <br />
                <span className="text-purple-600">Được sử dụng để theo dõi nguồn gốc của liên hệ</span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

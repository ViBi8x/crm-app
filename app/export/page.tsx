"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Download, CalendarIcon, Filter } from "lucide-react"
import { format } from "date-fns"
import type { DateRange } from "react-day-picker"

export default function ExportPage() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [selectedStages, setSelectedStages] = useState<string[]>([])
  const [selectedFields, setSelectedFields] = useState<string[]>(["name", "email", "phone", "company"])
  const [exportFormat, setExportFormat] = useState("csv")
  const [isExporting, setIsExporting] = useState(false)

  const stages = [
    { id: "subscriber", label: "Subscriber / Người đăng ký" },
    { id: "lead", label: "Lead / Khách tiềm năng" },
    { id: "opportunity", label: "Opportunity / Cơ hội" },
    { id: "customer", label: "Customer / Khách hàng" },
  ]

  const availableFields = [
    { id: "name", label: "Name / Tên", required: true },
    { id: "email", label: "Email", required: true },
    { id: "phone", label: "Phone / SĐT", required: false },
    { id: "zalo", label: "Zalo", required: false },
    { id: "company", label: "Company / Công ty", required: false },
    { id: "company_size", label: "Company Size / Quy mô", required: false },
    { id: "industry", label: "Industry / Ngành", required: false },
    { id: "data_source", label: "Data Source / Nguồn", required: false },
    { id: "stage", label: "Stage / Giai đoạn", required: false },
    { id: "assigned_to", label: "Assigned To / Phụ trách", required: false },
    { id: "created_at", label: "Created Date / Ngày tạo", required: false },
    { id: "notes", label: "Notes / Ghi chú", required: false },
  ]

  const handleStageChange = (stageId: string, checked: boolean) => {
    if (checked) {
      setSelectedStages([...selectedStages, stageId])
    } else {
      setSelectedStages(selectedStages.filter((id) => id !== stageId))
    }
  }

  const handleFieldChange = (fieldId: string, checked: boolean) => {
    if (checked) {
      setSelectedFields([...selectedFields, fieldId])
    } else {
      // Don't allow unchecking required fields
      const field = availableFields.find((f) => f.id === fieldId)
      if (!field?.required) {
        setSelectedFields(selectedFields.filter((id) => id !== fieldId))
      }
    }
  }

  const handleExport = () => {
    setIsExporting(true)

    // Simulate export process
    setTimeout(() => {
      // Create mock CSV data
      const headers = selectedFields
        .map((fieldId) => {
          const field = availableFields.find((f) => f.id === fieldId)
          return field?.label.split(" / ")[0] || fieldId
        })
        .join(",")

      const sampleData = [
        "John Smith,john@company.com,+1234567890,john_zalo,Tech Corp,50-100,Technology,Website,Lead,Sarah Wilson,2024-01-01,Interested in enterprise",
        "Maria Garcia,maria@startup.io,+1234567891,maria_zalo,StartupIO,10-50,Software,LinkedIn,Opportunity,Mike Johnson,2024-01-02,Budget approved",
      ]

      const csvContent = `${headers}\n${sampleData.join("\n")}`

      // Download file
      const blob = new Blob([csvContent], { type: "text/csv" })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `contacts_export_${format(new Date(), "yyyy-MM-dd")}.${exportFormat}`
      a.click()
      window.URL.revokeObjectURL(url)

      setIsExporting(false)
    }, 2000)
  }

  // Mock statistics
  const totalContacts = 2847
  const filteredContacts =
    selectedStages.length > 0 ? Math.floor(totalContacts * (selectedStages.length / 4)) : totalContacts

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Export Contacts</h1>
        <p className="text-muted-foreground">Xuất danh bạ khách hàng</p>
        <Badge variant="secondary" className="mt-2">
          Admin Only / Chỉ dành cho Admin
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Export Filters / Bộ lọc xuất</CardTitle>
            <CardDescription>
              Configure what data to export
              <br />
              Cấu hình dữ liệu cần xuất
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Date Range */}
            <div className="space-y-2">
              <Label>Date Range / Khoảng thời gian</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal bg-transparent">
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
                      <span>Pick a date range / Chọn khoảng thời gian</span>
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

            {/* Life Stages */}
            <div className="space-y-2">
              <Label>Life Stages / Giai đoạn vòng đời</Label>
              <div className="space-y-2">
                {stages.map((stage) => (
                  <div key={stage.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={stage.id}
                      checked={selectedStages.includes(stage.id)}
                      onCheckedChange={(checked) => handleStageChange(stage.id, checked as boolean)}
                    />
                    <Label htmlFor={stage.id} className="text-sm">
                      {stage.label}
                    </Label>
                  </div>
                ))}
              </div>
              {selectedStages.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No stages selected - will export all contacts
                  <br />
                  Không chọn giai đoạn - sẽ xuất tất cả liên hệ
                </p>
              )}
            </div>

            {/* Export Format */}
            <div className="space-y-2">
              <Label>Export Format / Định dạng xuất</Label>
              <Select value={exportFormat} onValueChange={setExportFormat}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="xlsx">Excel (XLSX)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Fields Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Fields to Export / Trường cần xuất</CardTitle>
            <CardDescription>
              Select which fields to include in the export
              <br />
              Chọn trường nào sẽ được bao gồm trong file xuất
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {availableFields.map((field) => (
                <div key={field.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={field.id}
                    checked={selectedFields.includes(field.id)}
                    onCheckedChange={(checked) => handleFieldChange(field.id, checked as boolean)}
                    disabled={field.required}
                  />
                  <Label htmlFor={field.id} className="text-sm flex-1">
                    {field.label}
                    {field.required && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        Required
                      </Badge>
                    )}
                  </Label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Export Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Export Summary / Tóm tắt xuất</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
              <Filter className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-medium">{filteredContacts} Contacts</p>
                <p className="text-xs text-muted-foreground">Liên hệ sẽ được xuất</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
              <Download className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium">{selectedFields.length} Fields</p>
                <p className="text-xs text-muted-foreground">Trường được chọn</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-purple-50 rounded-lg">
              <CalendarIcon className="h-5 w-5 text-purple-600" />
              <div>
                <p className="font-medium">{exportFormat.toUpperCase()}</p>
                <p className="text-xs text-muted-foreground">Định dạng file</p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <Button variant="outline">Reset Filters / Đặt lại bộ lọc</Button>
            <Button onClick={handleExport} disabled={isExporting || filteredContacts === 0}>
              {isExporting ? (
                <>Exporting... / Đang xuất...</>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Export {filteredContacts} Contacts
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

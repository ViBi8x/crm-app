"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Upload, Download, FileText, AlertCircle, CheckCircle, X } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [previewData, setPreviewData] = useState<any[]>([])
  const [validationErrors, setValidationErrors] = useState<any[]>([])
  const [importStatus, setImportStatus] = useState<"idle" | "preview" | "importing" | "success" | "error">("idle")

  // Mock CSV template data
  const csvTemplate = [
    { field: "name", required: true, description: "Full name / Họ và tên" },
    { field: "email", required: true, description: "Email address / Địa chỉ email" },
    { field: "phone", required: false, description: "Phone number / Số điện thoại" },
    { field: "zalo", required: false, description: "Zalo ID / ID Zalo" },
    { field: "company", required: false, description: "Company name / Tên công ty" },
    { field: "company_size", required: false, description: "Company size / Quy mô công ty" },
    { field: "industry", required: false, description: "Industry / Ngành nghề" },
    { field: "data_source", required: false, description: "Data source / Nguồn dữ liệu" },
    { field: "notes", required: false, description: "Notes / Ghi chú" },
  ]

  // Mock preview data
  const mockPreviewData = [
    {
      name: "John Smith",
      email: "john@company.com",
      phone: "+1 234 567 8900",
      zalo: "john_zalo",
      company: "Tech Corp",
      company_size: "50-100",
      industry: "Technology",
      data_source: "Website",
      notes: "Interested in enterprise solution",
      status: "valid",
    },
    {
      name: "Maria Garcia",
      email: "invalid-email",
      phone: "+1 234 567 8901",
      zalo: "maria_zalo",
      company: "StartupIO",
      company_size: "10-50",
      industry: "Software",
      data_source: "LinkedIn",
      notes: "Budget approved",
      status: "error",
      errors: ["Invalid email format"],
    },
    {
      name: "",
      email: "david@manufacturing.com",
      phone: "+1 234 567 8902",
      zalo: "david_chen",
      company: "Manufacturing Plus",
      company_size: "100-500",
      industry: "Manufacturing",
      data_source: "Trade Show",
      notes: "Existing customer",
      status: "error",
      errors: ["Name is required"],
    },
  ]

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      // Simulate file processing
      setIsUploading(true)
      setUploadProgress(0)

      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval)
            setIsUploading(false)
            setImportStatus("preview")
            setPreviewData(mockPreviewData)
            return 100
          }
          return prev + 10
        })
      }, 200)
    }
  }

  const downloadTemplate = () => {
    // Create CSV content
    const headers = csvTemplate.map((field) => field.field).join(",")
    const sampleRow =
      "John Doe,john@example.com,+1234567890,john_zalo,Example Corp,50-100,Technology,Website,Sample notes"
    const csvContent = `${headers}\n${sampleRow}`

    // Create and download file
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "contacts_template.csv"
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const handleImport = () => {
    setImportStatus("importing")
    setUploadProgress(0)

    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setImportStatus("success")
          return 100
        }
        return prev + 15
      })
    }, 300)
  }

  const validContacts = previewData.filter((contact) => contact.status === "valid")
  const errorContacts = previewData.filter((contact) => contact.status === "error")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Import Contacts</h1>
        <p className="text-muted-foreground">Nhập danh bạ từ file CSV</p>
      </div>

      {/* Template Download */}
      <Card>
        <CardHeader>
          <CardTitle>CSV Template / Mẫu CSV</CardTitle>
          <CardDescription>
            Download the template file to ensure your data is formatted correctly
            <br />
            Tải xuống file mẫu để đảm bảo dữ liệu được định dạng chính xác
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <Button onClick={downloadTemplate} className="flex-1 md:flex-none">
              <Download className="mr-2 h-4 w-4" />
              Download Template / Tải mẫu
            </Button>

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <FileText className="mr-2 h-4 w-4" />
                  View Format / Xem định dạng
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>CSV Format Requirements / Yêu cầu định dạng CSV</DialogTitle>
                  <DialogDescription>Required and optional fields for contact import</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Field / Trường</TableHead>
                        <TableHead>Required / Bắt buộc</TableHead>
                        <TableHead>Description / Mô tả</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {csvTemplate.map((field) => (
                        <TableRow key={field.field}>
                          <TableCell className="font-mono">{field.field}</TableCell>
                          <TableCell>
                            {field.required ? (
                              <Badge variant="destructive">Required</Badge>
                            ) : (
                              <Badge variant="secondary">Optional</Badge>
                            )}
                          </TableCell>
                          <TableCell>{field.description}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* File Upload */}
      <Card>
        <CardHeader>
          <CardTitle>Upload CSV File / Tải lên file CSV</CardTitle>
          <CardDescription>
            Select your CSV file to import contacts
            <br />
            Chọn file CSV để nhập danh bạ
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-center w-full">
              <Label
                htmlFor="file-upload"
                className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-8 h-8 mb-4 text-gray-500" />
                  <p className="mb-2 text-sm text-gray-500">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">CSV files only (MAX. 10MB)</p>
                  <p className="text-xs text-gray-500 mt-1">Chỉ file CSV (Tối đa 10MB)</p>
                </div>
                <Input id="file-upload" type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
              </Label>
            </div>

            {file && (
              <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                <FileText className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">{file.name}</span>
                <span className="text-xs text-muted-foreground">({(file.size / 1024).toFixed(1)} KB)</span>
              </div>
            )}

            {isUploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Processing file... / Đang xử lý file...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Preview Data */}
      {importStatus === "preview" && (
        <Card>
          <CardHeader>
            <CardTitle>Data Preview / Xem trước dữ liệu</CardTitle>
            <CardDescription>
              Review your data before importing. Fix any errors shown below.
              <br />
              Xem lại dữ liệu trước khi nhập. Sửa các lỗi hiển thị bên dưới.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium">{previewData.length} Total Records</p>
                    <p className="text-xs text-muted-foreground">Tổng số bản ghi</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium">{validContacts.length} Valid</p>
                    <p className="text-xs text-muted-foreground">Hợp lệ</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <div>
                    <p className="font-medium">{errorContacts.length} Errors</p>
                    <p className="text-xs text-muted-foreground">Lỗi</p>
                  </div>
                </div>
              </div>

              {/* Error Summary */}
              {errorContacts.length > 0 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>{errorContacts.length} records have errors</strong> and will be skipped during import.
                    <br />
                    <span className="text-sm text-muted-foreground">
                      {errorContacts.length} bản ghi có lỗi và sẽ bị bỏ qua khi nhập.
                    </span>
                  </AlertDescription>
                </Alert>
              )}

              {/* Data Table */}
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status / Trạng thái</TableHead>
                      <TableHead>Name / Tên</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone / SĐT</TableHead>
                      <TableHead>Company / Công ty</TableHead>
                      <TableHead>Errors / Lỗi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewData.map((contact, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          {contact.status === "valid" ? (
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle className="mr-1 h-3 w-3" />
                              Valid
                            </Badge>
                          ) : (
                            <Badge variant="destructive">
                              <X className="mr-1 h-3 w-3" />
                              Error
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">{contact.name || "-"}</TableCell>
                        <TableCell>{contact.email || "-"}</TableCell>
                        <TableCell>{contact.phone || "-"}</TableCell>
                        <TableCell>{contact.company || "-"}</TableCell>
                        <TableCell>
                          {contact.errors && contact.errors.length > 0 ? (
                            <div className="space-y-1">
                              {contact.errors.map((error: string, errorIndex: number) => (
                                <Badge key={errorIndex} variant="outline" className="text-red-600">
                                  {error}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Import Actions */}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setImportStatus("idle")}>
                  Cancel / Hủy
                </Button>
                <Button onClick={handleImport} disabled={validContacts.length === 0}>
                  Import {validContacts.length} Valid Contacts
                  <br />
                  <span className="text-xs">Nhập {validContacts.length} liên hệ hợp lệ</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Import Progress */}
      {importStatus === "importing" && (
        <Card>
          <CardHeader>
            <CardTitle>Importing Contacts / Đang nhập danh bạ</CardTitle>
            <CardDescription>
              Please wait while we import your contacts...
              <br />
              Vui lòng đợi trong khi chúng tôi nhập danh bạ của bạn...
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span>Importing contacts... / Đang nhập danh bạ...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Success Message */}
      {importStatus === "success" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-green-600">Import Successful!</CardTitle>
            <CardDescription>
              Your contacts have been imported successfully.
              <br />
              Danh bạ của bạn đã được nhập thành công.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-4 bg-green-50 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
                <div>
                  <p className="font-medium">{validContacts.length} contacts imported successfully</p>
                  <p className="text-sm text-muted-foreground">
                    {validContacts.length} liên hệ đã được nhập thành công
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={() => (window.location.href = "/contacts")}>View Contacts / Xem danh bạ</Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setImportStatus("idle")
                    setFile(null)
                    setPreviewData([])
                    setUploadProgress(0)
                  }}
                >
                  Import More / Nhập thêm
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

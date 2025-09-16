"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts"
import { CalendarIcon, Download, TrendingUp, Users, Target, DollarSign } from "lucide-react"
import { format } from "date-fns"
import type { DateRange } from "react-day-picker"

// Mock analytics data
const conversionData = [
  { month: "Jan", subscriber: 120, lead: 80, opportunity: 45, customer: 25 },
  { month: "Feb", subscriber: 150, lead: 95, opportunity: 52, customer: 28 },
  { month: "Mar", subscriber: 180, lead: 110, opportunity: 68, customer: 35 },
  { month: "Apr", subscriber: 200, lead: 125, opportunity: 75, customer: 42 },
  { month: "May", subscriber: 165, lead: 105, opportunity: 58, customer: 38 },
  { month: "Jun", subscriber: 190, lead: 118, opportunity: 72, customer: 45 },
]

const sourceData = [
  { name: "Website / Trang web", value: 35, color: "#3b82f6" },
  { name: "LinkedIn", value: 25, color: "#10b981" },
  { name: "Trade Show / Hội chợ", value: 20, color: "#f59e0b" },
  { name: "Referral / Giới thiệu", value: 15, color: "#ef4444" },
  { name: "Other / Khác", value: 5, color: "#8b5cf6" },
]

const performanceData = [
  { name: "Sarah Wilson", contacts: 145, converted: 32, rate: 22.1 },
  { name: "Mike Johnson", contacts: 128, converted: 28, rate: 21.9 },
  { name: "Lisa Brown", contacts: 112, converted: 22, rate: 19.6 },
  { name: "David Chen", contacts: 98, converted: 18, rate: 18.4 },
]

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [selectedMetric, setSelectedMetric] = useState("conversion")
  const [comparisonPeriod, setComparisonPeriod] = useState("previous_month")

  const handleExportReport = (format: "pdf" | "excel") => {
    // Simulate export
    console.log(`Exporting report as ${format}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">Phân tích và báo cáo chi tiết</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleExportReport("excel")}>
            <Download className="mr-2 h-4 w-4" />
            Export Excel
          </Button>
          <Button onClick={() => handleExportReport("pdf")}>
            <Download className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Report Filters / Bộ lọc báo cáo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
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
                      <span>Select date range / Chọn khoảng thời gian</span>
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
            <Select value={selectedMetric} onValueChange={setSelectedMetric}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Metric / Chỉ số" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="conversion">Conversion / Chuyển đổi</SelectItem>
                <SelectItem value="revenue">Revenue / Doanh thu</SelectItem>
                <SelectItem value="activity">Activity / Hoạt động</SelectItem>
              </SelectContent>
            </Select>
            <Select value={comparisonPeriod} onValueChange={setComparisonPeriod}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Compare to / So sánh với" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="previous_month">Previous Month / Tháng trước</SelectItem>
                <SelectItem value="previous_quarter">Previous Quarter / Quý trước</SelectItem>
                <SelectItem value="previous_year">Previous Year / Năm trước</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              <div className="flex flex-col">
                <span>Total Revenue</span>
                <span className="text-xs text-muted-foreground font-normal">Tổng doanh thu</span>
              </div>
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$847,250</div>
            <Badge className="mt-1 bg-green-100 text-green-800">
              <TrendingUp className="mr-1 h-3 w-3" />
              +12.5% vs last month
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              <div className="flex flex-col">
                <span>Conversion Rate</span>
                <span className="text-xs text-muted-foreground font-normal">Tỷ lệ chuyển đổi</span>
              </div>
            </CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24.8%</div>
            <Badge className="mt-1 bg-green-100 text-green-800">+2.1% vs last month</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              <div className="flex flex-col">
                <span>Active Contacts</span>
                <span className="text-xs text-muted-foreground font-normal">Liên hệ hoạt động</span>
              </div>
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2,847</div>
            <Badge className="mt-1 bg-blue-100 text-blue-800">+127 this month</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              <div className="flex flex-col">
                <span>Avg Deal Size</span>
                <span className="text-xs text-muted-foreground font-normal">Giá trị TB mỗi deal</span>
              </div>
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$18,850</div>
            <Badge className="mt-1 bg-yellow-100 text-yellow-800">-3.2% vs last month</Badge>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Conversion Funnel</CardTitle>
            <CardDescription>Phễu chuyển đổi theo thời gian</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={conversionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="subscriber" stackId="a" fill="#3b82f6" name="Subscriber" />
                <Bar dataKey="lead" stackId="a" fill="#10b981" name="Lead" />
                <Bar dataKey="opportunity" stackId="a" fill="#f59e0b" name="Opportunity" />
                <Bar dataKey="customer" stackId="a" fill="#ef4444" name="Customer" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lead Sources</CardTitle>
            <CardDescription>Nguồn khách hàng tiềm năng</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={sourceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {sourceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Sales Team Performance</CardTitle>
          <CardDescription>Hiệu suất đội ngũ bán hàng</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">
                    <div className="flex flex-col">
                      <span>Sales Rep</span>
                      <span className="text-xs text-muted-foreground font-normal">Nhân viên</span>
                    </div>
                  </th>
                  <th className="text-left p-2">
                    <div className="flex flex-col">
                      <span>Contacts</span>
                      <span className="text-xs text-muted-foreground font-normal">Liên hệ</span>
                    </div>
                  </th>
                  <th className="text-left p-2">
                    <div className="flex flex-col">
                      <span>Converted</span>
                      <span className="text-xs text-muted-foreground font-normal">Đã chuyển đổi</span>
                    </div>
                  </th>
                  <th className="text-left p-2">
                    <div className="flex flex-col">
                      <span>Rate</span>
                      <span className="text-xs text-muted-foreground font-normal">Tỷ lệ</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {performanceData.map((rep, index) => (
                  <tr key={index} className="border-b">
                    <td className="p-2 font-medium">{rep.name}</td>
                    <td className="p-2">{rep.contacts}</td>
                    <td className="p-2">{rep.converted}</td>
                    <td className="p-2">
                      <Badge
                        className={
                          rep.rate > 20
                            ? "bg-green-100 text-green-800"
                            : rep.rate > 18
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                        }
                      >
                        {rep.rate}%
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

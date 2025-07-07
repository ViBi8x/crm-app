import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, TrendingUp, UserPlus, Target } from "lucide-react"
import { ContactsChart } from "@/components/charts/contacts-chart"
import { ActivityChart } from "@/components/charts/activity-chart"

// Mock data
const stats = [
  {
    title: "Total Contacts",
    vietnamese: "Tổng số liên hệ",
    value: "2,847",
    change: "+12%",
    changeType: "positive" as const,
    icon: Users,
  },
  {
    title: "Conversion Rate",
    vietnamese: "Tỷ lệ chuyển đổi",
    value: "24.8%",
    change: "+2.1%",
    changeType: "positive" as const,
    icon: TrendingUp,
  },
  {
    title: "Active Leads",
    vietnamese: "Khách hàng tiềm năng",
    value: "486",
    change: "-5%",
    changeType: "negative" as const,
    icon: Target,
  },
  {
    title: "New Contacts",
    vietnamese: "Liên hệ mới",
    value: "127",
    change: "+18%",
    changeType: "positive" as const,
    icon: UserPlus,
  },
]

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Bảng điều khiển tổng quan</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                <div className="flex flex-col">
                  <span>{stat.title}</span>
                  <span className="text-xs text-muted-foreground font-normal">{stat.vietnamese}</span>
                </div>
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <Badge variant={stat.changeType === "positive" ? "default" : "destructive"} className="mt-1">
                {stat.change} from last month
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Contacts by Life Stage</CardTitle>
            <CardDescription>Liên hệ theo giai đoạn vòng đời</CardDescription>
          </CardHeader>
          <CardContent>
            <ContactsChart />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Activity Trend</CardTitle>
            <CardDescription>Xu hướng hoạt động hàng tháng</CardDescription>
          </CardHeader>
          <CardContent>
            <ActivityChart />
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Hoạt động gần đây</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              {
                action: "New contact added",
                vietnamese: "Đã thêm liên hệ mới",
                contact: "John Smith",
                time: "2 minutes ago",
              },
              {
                action: "Contact moved to Opportunity",
                vietnamese: "Liên hệ chuyển sang Cơ hội",
                contact: "Sarah Johnson",
                time: "15 minutes ago",
              },
              {
                action: "Appointment scheduled",
                vietnamese: "Đã lên lịch cuộc hẹn",
                contact: "Mike Wilson",
                time: "1 hour ago",
              },
            ].map((activity, index) => (
              <div key={index} className="flex items-center justify-between border-b pb-2">
                <div className="flex flex-col">
                  <p className="text-sm font-medium">{activity.action}</p>
                  <p className="text-xs text-muted-foreground">{activity.vietnamese}</p>
                  <p className="text-xs text-blue-600">{activity.contact}</p>
                </div>
                <p className="text-xs text-muted-foreground">{activity.time}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

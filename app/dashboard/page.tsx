"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, TrendingUp, UserPlus, Target } from "lucide-react"
import { ContactsChart } from "@/components/charts/contacts-chart"
import { ActivityChart } from "@/components/charts/activity-chart"
import { supabase } from "@/lib/supabaseClient"
import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"
dayjs.extend(relativeTime)

function calcChange(current: number, previous: number): { value: string; type: "positive" | "negative" } {
  if (previous === 0) return { value: "+100%", type: "positive" }
  const diff = current - previous
  const percent = ((diff / previous) * 100).toFixed(1)
  return {
    value: `${diff >= 0 ? "+" : ""}${percent}%`,
    type: diff >= 0 ? "positive" : "negative",
  }
}

export default function Dashboard() {
  const [stats, setStats] = useState<any[]>([])
  const [lifeStageData, setLifeStageData] = useState<any[]>([])
  const [activityData, setActivityData] = useState<any[]>([])
  const [recentActivities, setRecentActivities] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)
  const [userRole, setUserRole] = useState<string>("")

  // Lấy thông tin user và role khi load trang
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser()
      setUser(data?.user)
      if (data?.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id, role")
          .eq("id", data.user.id)
          .single()
        setUserRole(profile?.role || "")
      }
    }
    getUser()
  }, [])

  useEffect(() => {
    if (userRole) {
      fetchDashboard()
    }
    // eslint-disable-next-line
  }, [userRole])

  async function fetchDashboard() {
    // ---- STATS ----
    const { count: totalContacts } = await supabase
      .from("contacts")
      .select("*", { count: "exact", head: true })

    const { count: totalLeads } = await supabase
      .from("contacts")
      .select("*", { count: "exact", head: true })
      .eq("life_stage", "Lead")

    const startOfThisMonth = dayjs().startOf("month").toISOString()
    const startOfLastMonth = dayjs().subtract(1, "month").startOf("month").toISOString()

    const { count: thisMonthContacts } = await supabase
      .from("contacts")
      .select("*", { count: "exact", head: true })
      .gte("created_at", startOfThisMonth)

    const { count: lastMonthContacts } = await supabase
      .from("contacts")
      .select("*", { count: "exact", head: true })
      .gte("created_at", startOfLastMonth)
      .lt("created_at", startOfThisMonth)

    // ---- CONTACTS BY LIFE STAGE ----
    const { data: allContacts } = await supabase.from("contacts").select("life_stage")
    const stageArr = ["Subscriber", "Lead", "Opportunity", "Customer"]
    const grouped = stageArr.map((stage) => ({
      name: stage,
      value: allContacts?.filter((c) => c.life_stage?.toLowerCase() === stage.toLowerCase()).length || 0,
    }))
    setLifeStageData(grouped)

    // ---- ACTIVITY TREND (12 tháng) ----
    const { data: contactsAll } = await supabase.from("contacts").select("created_at")
    const { data: appointmentsAll } = await supabase.from("appointments").select("scheduled_at")
    const months = Array.from({ length: 12 }, (_, i) =>
      dayjs().subtract(11 - i, "month").startOf("month")
    )
    const trend = months.map((month) => {
      const m = month.format("MMM")
      const contacts = contactsAll?.filter((c) =>
        dayjs(c.created_at).isSame(month, "month")
      ).length || 0
      const appointments = appointmentsAll?.filter((a) =>
        dayjs(a.scheduled_at).isSame(month, "month")
      ).length || 0
      return { month: m, contacts, appointments }
    })
    setActivityData(trend)

    // ---- RECENT ACTIVITY ----
    let activityQuery = supabase
      .from("contact_history")
      .select("id, contact_id, type, note, action_time, user_id, created_by, contact:contacts(name)")
      .order("action_time", { ascending: false })
      .limit(5)

    if (userRole === "sales" && user) {
      activityQuery = activityQuery.eq("created_by", user.id)
    } else if (userRole === "manager" && user) {
      // Lấy id của các sales mình quản lý
      const { data: salesList } = await supabase
        .from("profiles")
        .select("id")
        .eq("manager_id", user.id)
      const salesIds = salesList?.map((u) => u.id) || []
      activityQuery = activityQuery.in("created_by", [user.id, ...salesIds])
    }
    // admin thì không filter

    const { data: activityRaw } = await activityQuery
    setRecentActivities(activityRaw || [])

    // ---- STATS CARDS ----
    const totalContactsChange = calcChange(thisMonthContacts || 0, lastMonthContacts || 0)
    setStats([
      {
        title: "Total Contacts",
        vietnamese: "Tổng số liên hệ",
        value: totalContacts?.toLocaleString() || "0",
        change: totalContactsChange.value,
        changeType: totalContactsChange.type,
        icon: Users,
      },
      {
        title: "Conversion Rate",
        vietnamese: "Tỷ lệ chuyển đổi",
        value: "-",
        change: "+0%",
        changeType: "positive",
        icon: TrendingUp,
      },
      {
        title: "Active Leads",
        vietnamese: "Khách hàng tiềm năng",
        value: totalLeads?.toLocaleString() || "0",
        change: "+0%",
        changeType: "positive",
        icon: Target,
      },
      {
        title: "New Contacts",
        vietnamese: "Liên hệ mới",
        value: thisMonthContacts?.toLocaleString() || "0",
        change: totalContactsChange.value,
        changeType: totalContactsChange.type,
        icon: UserPlus,
      },
    ])
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Bảng điều khiển tổng quan</p>
      </div>

      {/* Stats */}
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
              <Badge
                variant={stat.changeType === "positive" ? "default" : "destructive"}
                className="mt-1"
              >
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
            <ContactsChart data={lifeStageData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Activity Trend</CardTitle>
            <CardDescription>Xu hướng hoạt động hàng tháng</CardDescription>
          </CardHeader>
          <CardContent>
            <ActivityChart data={activityData} />
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
            {recentActivities.length === 0 ? (
              <div className="text-gray-400 text-sm">No recent activity.</div>
            ) : (
              recentActivities.map((activity, idx) => (
                <div key={activity.id || idx} className="flex items-center justify-between border-b pb-2">
                  <div className="flex flex-col">
                    <p className="text-sm font-medium">
                      {activity.type === "call"
                        ? "Cuộc gọi"
                        : activity.type === "email"
                        ? "Email"
                        : activity.type === "meeting"
                        ? "Cuộc họp"
                        : activity.type === "zalo"
                        ? "Zalo"
                        : activity.type === "note"
                        ? "Ghi chú"
                        : activity.type === "task"
                        ? "Nhiệm vụ"
                        : "Hoạt động"}
                    </p>
                    <p className="text-xs text-muted-foreground">{activity.note}</p>
                    <p className="text-xs text-blue-600">{activity.contact?.name || ""}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {activity.action_time ? dayjs(activity.action_time).fromNow() : ""}
                  </p>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

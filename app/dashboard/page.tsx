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

const ICONS = {
  Users,
  TrendingUp,
  UserPlus,
  Target,
}

export default function Dashboard() {
  const [stats, setStats] = useState<any[]>([])
  const [lifeStageData, setLifeStageData] = useState<any[]>([])
  const [activityData, setActivityData] = useState<any[]>([])
  const [recentActivities, setRecentActivities] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)
  const [userRole, setUserRole] = useState<string>("")
  const [loading, setLoading] = useState(true)

  // Lấy thông tin user và role khi load trang (vẫn cần cho phần activity filter)
  useEffect(() => {
    setLoading(true)
    fetch("/api/dashboard", { cache: "no-store" })
      .then(res => res.json())
      .then((res) => {
        setStats(Array.isArray(res.stats) ? res.stats : [])
        setLifeStageData(Array.isArray(res.lifeStageData) ? res.lifeStageData : [])
        setActivityData(Array.isArray(res.activityData) ? res.activityData : [])
        setLoading(false)
      })
      .catch(() => {
        setStats([])
        setLifeStageData([])
        setActivityData([])
        setLoading(false)
      })
  }, [])

  // Lấy thông tin user, role (phục vụ filter activity)
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

  // Recent activity: lấy theo quyền user
  useEffect(() => {
    if (userRole && user) {
      fetchRecentActivity()
    }
    // eslint-disable-next-line
  }, [userRole, user])

  async function fetchRecentActivity() {
    let activityQuery = supabase
      .from("contact_history")
      .select(`
        id,
        contact_id,
        type,
        note,
        action_time,
        user_id,
        contact:contacts(name),
        user:profiles(full_name)
      `)
      .order("action_time", { ascending: false })
      .limit(10)

    if (userRole === "sales" && user) {
      activityQuery = activityQuery.eq("user_id", user.id)
    } else if (userRole === "manager" && user) {
      // Lấy id các sales mà manager này quản lý
      const { data: salesList } = await supabase
        .from("profiles")
        .select("id")
        .eq("manager_id", user.id)
      const salesIds = salesList?.map((u) => u.id) || []
      activityQuery = activityQuery.in("user_id", [user.id, ...salesIds])
    }

    const { data: activityRaw } = await activityQuery
    setRecentActivities(activityRaw || [])
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Bảng điều khiển tổng quan</p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Đang tải dữ liệu...</div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array.isArray(stats) && stats.length > 0 ? (
              stats.map((stat) => {
                const Icon = ICONS[stat.icon as keyof typeof ICONS]
                return (
                  <Card key={stat.title}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        <div className="flex flex-col">
                          <span>{stat.title}</span>
                          <span className="text-xs text-muted-foreground font-normal">{stat.vietnamese}</span>
                        </div>
                      </CardTitle>
                      {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
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
                )
              })
            ) : (
              <div className="col-span-4 text-center text-gray-400 py-6">Không có dữ liệu thống kê</div>
            )}
          </div>

          {/* Charts */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Contacts by Life Stage</CardTitle>
                <CardDescription>Liên hệ theo giai đoạn vòng đời</CardDescription>
              </CardHeader>
              <CardContent>
                {Array.isArray(lifeStageData) && lifeStageData.length > 0 ? (
                  <ContactsChart data={lifeStageData} />
                ) : (
                  <div className="text-center text-gray-400 py-8">Không có dữ liệu</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Monthly Activity Trend</CardTitle>
                <CardDescription>Xu hướng hoạt động hàng tháng</CardDescription>
              </CardHeader>
              <CardContent>
                {Array.isArray(activityData) && activityData.length > 0 ? (
                  <ActivityChart data={activityData} />
                ) : (
                  <div className="text-center text-gray-400 py-8">Không có dữ liệu</div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}

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
                      <span className="ml-2 text-xs text-gray-500">
                        {activity.user?.full_name ? `— ${activity.user.full_name}` : ""}
                      </span>
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

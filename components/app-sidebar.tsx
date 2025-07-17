"use client"
import {
  BarChart3,
  Calendar,
  Contact,
  Download,
  Home,
  Bell,
  Settings,
  Upload,
  Users,
  Activity,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient" // Đảm bảo đường dẫn đúng với project

export function AppSidebar() {
  const pathname = usePathname()
  const { state, toggleSidebar } = useSidebar()
  const { user, logout } = useAuth()
  const isCollapsed = state === "collapsed"

  // Thêm state cho thông tin profile
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) return
      const { data } = await supabase
        .from("profiles")
        .select("full_name, role, avatar_url")
        .eq("id", user.id)
        .single()
      if (data) setProfile(data)
    }
    fetchProfile()
  }, [user])

  // All menu items in a single flat structure
  const menuItems = [
    {
      title: "Dashboard",
      vietnamese: "Bảng điều khiển",
      url: "/",
      icon: Home,
    },
    {
      title: "Contacts",
      vietnamese: "Danh bạ",
      url: "/contacts",
      icon: Contact,
    },
    {
      title: "Pipeline",
      vietnamese: "Quy trình bán hàng",
      url: "/pipeline",
      icon: BarChart3,
    },
    {
      title: "Calendar",
      vietnamese: "Lịch hẹn",
      url: "/calendar",
      icon: Calendar,
    },
    {
      title: "Import Contacts",
      vietnamese: "Nhập danh bạ",
      url: "/import",
      icon: Upload,
    },
    // {
    //   title: "Export Contacts",
    //   vietnamese: "Xuất danh bạ",
    //   url: "/export",
    //   icon: Download,
    //   roles: ["admin", "Manager"],
    // },
    // {
    //   title: "Analytics",
    //   vietnamese: "Phân tích",
    //   url: "/analytics",
    //   icon: BarChart3,
    // },
    {
      title: "Notifications",
      vietnamese: "Thông báo",
      url: "/notifications",
      icon: Bell,
    },
    {
      title: "Activity Log",
      vietnamese: "Nhật ký hoạt động",
      url: "/activity",
      icon: Activity,
    },
    {
      title: "User Management",
      vietnamese: "Quản lý người dùng",
      url: "/users",
      icon: Users,
      roles: ["admin", "Manager"],
    },
    // {
    //   title: "App Configuration",
    //   vietnamese: "Cấu hình ứng dụng",
    //   url: "/config",
    //   icon: Settings,
    //   roles: ["admin"],
    // },
    {
      title: "Account Settings",
      vietnamese: "Cài đặt tài khoản",
      url: "/settings",
      icon: Settings,
    },
  ]

  // Helper function to check if user has access to a menu item
  const hasAccess = (item: any) => {
    if (!item.roles) return true
    // role so sánh dạng lowercase để tránh bug vặt
    return item.roles.map((r: string) => r.toLowerCase()).includes((profile?.role || user?.role || "").toLowerCase())
  }

  const filteredMenuItems = menuItems.filter(hasAccess)

  return (
    <TooltipProvider>
      <Sidebar
        className="border-r-0 bg-[#181C2A] text-white transition-all duration-300 ease-in-out"
        collapsible="icon"
      >
        <SidebarHeader className="p-4 border-b border-gray-700/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white font-bold text-lg shadow-lg">
                C
              </div>
              {!isCollapsed && (
                <div>
                  <h2 className="text-lg font-semibold text-white">CRM System</h2>
                  <p className="text-xs text-gray-400">Professional CRM</p>
                </div>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="h-8 w-8 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-colors"
            >
              {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          </div>
        </SidebarHeader>

        <SidebarContent className="px-3 py-4">
          <SidebarMenu className="space-y-2">
            {filteredMenuItems.map((item) => {
              const isActive = pathname === item.url
              const MenuButton = (
                <SidebarMenuButton
                  asChild
                  className={`
                    h-12 px-3 rounded-xl transition-all duration-200 ease-in-out
                    hover:bg-gray-700/50 hover:text-white
                    ${isActive ? "bg-blue-600/20 text-blue-400 border border-blue-600/30 shadow-lg" : "text-gray-300"}
                    ${isCollapsed ? "justify-center" : "justify-start"}
                  `}
                >
                  <Link href={item.url} className="flex items-center gap-3 w-full">
                    <item.icon className={`h-5 w-5 shrink-0 ${isActive ? "text-blue-400" : "text-gray-400"}`} />
                    {!isCollapsed && <span className="text-sm font-medium truncate">{item.title}</span>}
                  </Link>
                </SidebarMenuButton>
              )

              return (
                <SidebarMenuItem key={item.title}>
                  {isCollapsed ? (
                    <Tooltip>
                      <TooltipTrigger asChild>{MenuButton}</TooltipTrigger>
                      <TooltipContent side="right" className="bg-gray-800 text-white border-gray-700">
                        <div className="text-sm font-medium">{item.title}</div>
                        <div className="text-xs text-gray-400">{item.vietnamese}</div>
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    MenuButton
                  )}
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarContent>

        <SidebarFooter className="p-4 border-t border-gray-700/50">
          <SidebarMenu>
            <SidebarMenuItem>
              <div
                className={`flex items-center gap-3 p-3 rounded-xl bg-gray-700/30 ${isCollapsed ? "justify-center" : ""}`}
              >
                <Avatar className="h-8 w-8 border-2 border-gray-600">
                  <AvatarImage src={profile?.avatar_url || "/placeholder.svg"} />
                  <AvatarFallback className="bg-gray-600 text-white text-sm">
                    {profile?.full_name
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("") ||
                      user?.email?.[0] ||
                      "U"}
                  </AvatarFallback>
                </Avatar>
                {!isCollapsed && (
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white truncate">
                      {profile?.full_name || user?.email}
                    </div>
                    <div className="text-xs text-gray-400 truncate">
                      {profile?.role || user?.role || ""}
                    </div>
                  </div>
                )}
              </div>
            </SidebarMenuItem>
            <SidebarMenuItem>
              {isCollapsed ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={logout}
                      className="h-10 w-10 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="bg-gray-800 text-white border-gray-700">
                    <div className="text-sm">Sign Out</div>
                    <div className="text-xs text-gray-400">Đăng xuất</div>
                  </TooltipContent>
                </Tooltip>
              ) : (
                <Button
                  variant="ghost"
                  onClick={logout}
                  className="w-full justify-start gap-3 h-10 px-3 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="text-sm">Sign Out</span>
                </Button>
              )}
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
    </TooltipProvider>
  )
}

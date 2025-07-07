"use client";

import type { ReactNode } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Header } from "@/components/header";
import { Toaster } from "sonner";
import { usePathname } from "next/navigation";
import { AuthProvider } from "@/components/auth-provider";

// Đừng import font và globals ở đây nữa (đã có ở root layout)

export default function ClientRootLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <LayoutContent>{children}</LayoutContent>
      <Toaster />
    </AuthProvider>
  );
}

function LayoutContent({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";

  // Không bọc sidebar/header cho trang login
  if (isLoginPage) {
    return <>{children}</>;
  }

  // Bọc sidebar + header cho các trang còn lại
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <main className="flex-1 p-6 bg-gray-50/50">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}

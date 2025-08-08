"use client";

import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Header } from "@/components/header";
import { Toaster } from "sonner";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { app } from "@/lib/firebase";
import { supabase } from "@/lib/supabaseClient";

export default function ClientRootLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";
  const { user } = useAuth();
  const didInit = useRef(false);

  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;

    if (!user || isLoginPage) return;

    (async () => {
      if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

      // 1) Đăng ký SW và CHỜ sẵn sàng
      const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js", { scope: "/" });
      await navigator.serviceWorker.ready;

      // 2) Xin quyền
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        console.warn("User không cấp quyền thông báo:", perm);
        return;
      }

      // 3) Import động firebase/messaging
      const { getMessaging, getToken, onMessage, isSupported } = await import("firebase/messaging");
      if (!(await isSupported())) {
        console.warn("FCM không được hỗ trợ trên trình duyệt này.");
        return;
      }

      const messaging = getMessaging(app);
      const vapidKey = "BOTbg6krvPOcKxu3RnhYAB8p_5eDOmepdmbJtb1uus69SbogwEWOm_SkuehuywaSOpU_0Aete3YZ8p7EmCijF7Q";

      // 4) LẤY TOKEN — bắt buộc truyền serviceWorkerRegistration
      const token = await getToken(messaging, {
        vapidKey,
        serviceWorkerRegistration: registration,
      });

      if (token) {
        console.log("FCM Token:", token);
        const { error } = await supabase.from("profiles").update({ fcm_token: token }).eq("id", user.id);
        if (error) console.error("Lỗi lưu fcm_token:", error);
      } else {
        console.warn("Không lấy được FCM token.");
      }

      // 5) Foreground test
      onMessage(messaging, (payload) => {
        console.log("Foreground message:", payload);
      });
    })().catch((e) => console.error("Lỗi khi thiết lập FCM:", e));
  }, [isLoginPage, user?.id]);

  if (isLoginPage) return <>{children}</>;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <main className="flex-1 p-6 bg-gray-50/50">{children}</main>
        </div>
      </div>
      <Toaster />
    </SidebarProvider>
  );
}

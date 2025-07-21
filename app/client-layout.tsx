"use client";

import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { Header } from '@/components/header';
import { Toaster } from 'sonner';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { messaging, app } from '@/lib/firebase';

export default function ClientRootLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';
  const { user } = useAuth();

  useEffect(() => {
    const requestPermission = async () => {
      const permission = await Notification.requestPermission();
      if (permission === 'granted' && !isLoginPage && user) {
        const vapidKey = 'BOTbg6krvPOcKxu3RnhYAB8p_5eDOmepdmbJtb1uus69SbogwEWOm_SkuehuywaSOpU_0Aete3YZ8p7EmCijF7Q';
        console.log('Messaging object:', messaging);
        const token = await messaging.getToken({ vapidKey });
        if (token) {
          console.log('FCM Token:', token);
          const { createClient } = await import('@supabase/supabase-js'); // Sử dụng export named
          const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
          );
          const { error } = await supabase
            .from('profiles')
            .update({ fcm_token: token })
            .eq('id', user.id);
          if (error) console.error('Lỗi lưu token:', error);
          else console.log('Token đã được lưu vào Supabase');
        } else {
          console.log('Không lấy được token');
        }
      } else {
        console.log('Quyền thông báo bị từ chối, đang ở trang login, hoặc user không tồn tại');
      }
    };
    requestPermission();
  }, [isLoginPage, user?.id]);

  if (isLoginPage) {
    return <>{children}</>;
  }

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

// "use client";

// import type { ReactNode } from "react";
// import { SidebarProvider } from "@/components/ui/sidebar";
// import { AppSidebar } from "@/components/app-sidebar";
// import { Header } from "@/components/header";
// import { Toaster } from "sonner";
// import { usePathname } from "next/navigation";
// import { AuthProvider } from "@/components/auth-provider";

// // Đừng import font và globals ở đây nữa (đã có ở root layout)

// export default function ClientRootLayout({ children }: { children: ReactNode }) {
//   return (
//     <AuthProvider>
//       <LayoutContent>{children}</LayoutContent>
//       <Toaster />
//     </AuthProvider>
//   );
// }

// function LayoutContent({ children }: { children: ReactNode }) {
//   const pathname = usePathname();
//   const isLoginPage = pathname === "/login";

//   // Không bọc sidebar/header cho trang login
//   if (isLoginPage) {
//     return <>{children}</>;
//   }

//   // Bọc sidebar + header cho các trang còn lại
//   return (
//     <SidebarProvider>
//       <div className="flex min-h-screen w-full">
//         <AppSidebar />
//         <div className="flex-1 flex flex-col">
//           <Header />
//           <main className="flex-1 p-6 bg-gray-50/50">{children}</main>
//         </div>
//       </div>
//     </SidebarProvider>
//   );
// }
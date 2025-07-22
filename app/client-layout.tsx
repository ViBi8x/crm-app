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
import { supabase } from '@/lib/supabaseClient'; // Import singleton

export default function ClientRootLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';
  const { user } = useAuth();

  useEffect(() => {
    let isMounted = true;

    const requestPermission = async () => {
      if (!('serviceWorker' in navigator)) return;

      const permission = await Notification.requestPermission();
      if (permission === 'granted' && !isLoginPage && user && isMounted) {
        try {
          const registration = await navigator.serviceWorker.ready;
          const vapidKey = 'BOTbg6krvPOcKxu3RnhYAB8p_5eDOmepdmbJtb1uus69SbogwEWOm_SkuehuywaSOpU_0Aete3YZ8p7EmCijF7Q';
          console.log('Messaging object:', messaging);
          const token = await messaging.getToken({ vapidKey });
          if (token && isMounted) {
            console.log('FCM Token:', token);
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
            const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
            if (!supabaseUrl || !supabaseKey) {
              console.error('Missing Supabase environment variables:', { supabaseUrl, supabaseKey });
              return;
            }
            // Sử dụng instance supabase đã được khởi tạo
            const { error } = await supabase
              .from('profiles')
              .update({ fcm_token: token })
              .eq('id', user.id);
            if (error && isMounted) console.error('Lỗi lưu token:', error);
            else if (isMounted) console.log('Token đã được lưu vào Supabase');
          } else if (isMounted) {
            console.log('Không lấy được token');
          }
        } catch (error) {
          if (isMounted) console.error('Lỗi khi lấy token:', error);
        }
      } else if (isMounted) {
        console.log('Quyền thông báo bị từ chối, đang ở trang login, hoặc user không tồn tại');
      }
    };

    requestPermission();

    return () => {
      isMounted = false;
    };
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
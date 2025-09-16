// hooks/useFcm.ts
import { useEffect } from "react";
import { app } from "@/lib/firebase";
import { supabase } from "@/lib/supabaseClient";

const VAPID_KEY = "BOTbg6krvPOcKxu3RnhYAB8p_5eDOmepdmbJtb1uus69SbogwEWOm_SkuehuywaSOpU_0Aete3YZ8p7EmCijF7Q";

export function useFcm() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    // Import động messaging để tránh lỗi SSR
    import("firebase/messaging").then(async ({ getMessaging, getToken }) => {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        console.warn("User từ chối nhận notification.");
        return;
      }

      try {
        // Đảm bảo service worker đã đăng ký
        const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
        const messaging = getMessaging(app);
        const currentToken = await getToken(messaging, {
          vapidKey: VAPID_KEY,
          serviceWorkerRegistration: registration,
        });

        if (currentToken) {
          localStorage.setItem("fcm_token", currentToken);
          console.log("FCM Token:", currentToken);

          // Lấy user id từ localStorage nếu đã đăng nhập
          const userStr = localStorage.getItem("user");
          if (userStr) {
            try {
              const user = JSON.parse(userStr);
              if (user?.id) {
                // Gửi token về Supabase (update vào profiles)
                await supabase
                  .from("profiles")
                  .update({ fcm_token: currentToken })
                  .eq("id", user.id);
                console.log("Cập nhật fcm_token lên Supabase thành công cho user", user.id);
              }
            } catch (err) {
              console.warn("Không lấy được user id từ localStorage:", err);
            }
          }
        } else {
          console.warn("Không lấy được FCM token");
        }
      } catch (err) {
        console.error("FCM error:", err);
      }
    });
  }, []);
}

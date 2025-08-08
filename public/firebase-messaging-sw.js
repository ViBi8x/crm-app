// /public/firebase-messaging-sw.js
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyBS6v4RYQvEaTAgJnZJN_ebrVPfCED-21M",
  authDomain: "crm-tc-trucks.firebaseapp.com",
  projectId: "crm-tc-trucks",
  messagingSenderId: "175553350052",
  appId: "1:175553350052:web:e806f8d4bfd3b95554d931"
});

// Cập nhật SW nhanh, không phải reload nhiều lần
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));


const messaging = firebase.messaging();

// ✅ Bắt cả notification payload & data-only payload
messaging.onBackgroundMessage(({ notification, data }) => {
  // Nếu server đã gửi webpush.notification thì để Chrome tự hiện, không show lần nữa
  if (notification && (notification.title || notification.body)) {
    return;
  }
  // Chỉ xử lý data-only
  const title = data?.title || "CRM";
  const body  = data?.body  || "";
  const url   = data?.url   || "/notifications";
  self.registration.showNotification(title, {
    body,
    icon: "/logo-512x512.jpg",
    data: { url },
    tag: "crm-fcm",
    renotify: true
  });
});


// ✅ Bảo đảm click mở app
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification && event.notification.data && event.notification.data.url) || "/notifications";
  event.waitUntil(clients.openWindow(url));
});

// (tuỳ chọn) Log mọi push raw để debug
self.addEventListener("push", (event) => {
  try { console.log("[SW] push raw:", event.data && event.data.text()); } catch (_) {}
});

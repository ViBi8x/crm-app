// lib/firebase.ts
import { initializeApp } from "firebase/app";
import { getMessaging } from "firebase/messaging";

// Thay thông tin bên dưới bằng cấu hình của bạn (bạn đã lấy được ở trên)
const firebaseConfig = {
  apiKey: "AIzaSyBS6v4RYQvEaTAgJnZJN_ebrVPfCED-21M",
  authDomain: "crm-tc-trucks.firebaseapp.com",
  projectId: "crm-tc-trucks",
  storageBucket: "crm-tc-trucks.firebasestorage.app",
  messagingSenderId: "175553350052",
  appId: "1:175553350052:web:e806f8d4bfd3b95554d931"
};

// Khởi tạo app
const app = initializeApp(firebaseConfig);

// Lấy instance của messaging (dùng để lấy FCM token, nhận push notification)
const messaging = getMessaging(app);

export { messaging };

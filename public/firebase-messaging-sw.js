importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

// Dùng đúng config như ở bước 1
firebase.initializeApp({
  apiKey: "AIzaSyBS6v4RYQvEaTAgJnZJN_ebrVPfCED-21M",
  authDomain: "crm-tc-trucks.firebaseapp.com",
  projectId: "crm-tc-trucks",
  messagingSenderId: "175553350052",
  appId: "1:175553350052:web:e806f8d4bfd3b95554d931"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  console.log("[firebase-messaging-sw.js] Received background message ", payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo-512x512.png' // thay icon nếu muốn
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-messaging.js');

const firebaseConfig = {
  apiKey: "AIzaSyBS6v4RYQvEaTAgJnZJN_ebrVPfCED-21M",
  authDomain: "crm-tc-trucks.firebaseapp.com",
  projectId: "crm-tc-trucks",
  storageBucket: "crm-tc-trucks.firebasestorage.app",
  messagingSenderId: "175553350052",
  appId: "1:175553350052:web:e806f8d4bfd3b95554d931",
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();
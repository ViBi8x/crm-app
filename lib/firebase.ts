// lib/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyBS6v4RYQvEaTAgJnZJN_ebrVPfCED-21M",
  authDomain: "crm-tc-trucks.firebaseapp.com",
  projectId: "crm-tc-trucks",
  storageBucket: "crm-tc-trucks.firebasestorage.app",
  messagingSenderId: "175553350052",
  appId: "1:175553350052:web:e806f8d4bfd3b95554d931",
};

// KHÔNG dùng firebase.initializeApp(...)
// KHÔNG export messaging ở đây
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

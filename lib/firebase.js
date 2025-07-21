import firebase from "firebase/app";
import "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyBS6v4RYQvEaTAgJnZJN_ebrVPfCED-21M",
  authDomain: "crm-tc-trucks.firebaseapp.com",
  projectId: "crm-tc-trucks",
  storageBucket: "crm-tc-trucks.firebasestorage.app",
  messagingSenderId: "175553350052",
  appId: "1:175553350052:web:e806f8d4bfd3b95554d931",
};

// Khởi tạo ứng dụng
const app = firebase.initializeApp(firebaseConfig);

// Lấy instance messaging
const messaging = firebase.messaging();

const vapidKey = "BOTbg6krvPOcKxu3RnhYAB8p_5eDOmepdmbJtb1uus69SbogwEWOm_SkuehuywaSOpU_0Aete3YZ8p7EmCijF7Q";

// Export các giá trị cần thiết
export { messaging, app }; // Export app để sử dụng nếu cần, thay vì getToken riêng
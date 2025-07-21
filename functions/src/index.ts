import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import axios from "axios";

// Khởi tạo Firebase Admin
admin.initializeApp();

// Không cần setGlobalOptions nữa, dùng trực tiếp trong function nếu cần
import { onSchedule } from "firebase-functions/v2/scheduler";

export const scheduleReminder = onSchedule("every 1 minutes", async (event) => {
  try {
    const now = new Date().toISOString();
    const fifteenMinsLater = new Date(new Date().getTime() + 15 * 60 * 1000).toISOString();

    // Sử dụng biến môi trường từ Firebase
    const supabaseUrl = process.env.SUPABASE_URL || "https://igxvutyhdsmanhomamzo.supabase.co/rest/v1/appointments";
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";

    const response = await axios.get(supabaseUrl, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
      params: {
        select: "id,title,scheduled_at,created_by",
        status: "eq.scheduled",
        scheduled_at: `gte.${now},lte.${fifteenMinsLater}`,
      },
    });

    const appointments: any[] = response.data;

    if (appointments.length > 0) {
      for (const appointment of appointments) {
        const userResponse = await axios.get(
          `${process.env.SUPABASE_URL}/profiles?select=email,fcm_token&id=eq.${appointment.created_by}`,
          {
            headers: {
              apikey: supabaseKey,
              Authorization: `Bearer ${supabaseKey}`,
            },
          }
        );

        const user = userResponse.data[0];
        if (user && user.fcm_token) {
          await admin.messaging().send({
            token: user.fcm_token,
            notification: {
              title: "Nhắc nhở sự kiện",
              body: `${appointment.title} sẽ diễn ra trong 15 phút.`,
            },
          });
          logger.info(`Đã gửi thông báo cho ${appointment.created_by}`);
        }
      }
    } else {
      logger.info("Không có sự kiện nào trong 15 phút tới");
    }
  } catch (error) {
    logger.error("Lỗi trong scheduleReminder:", error);
  }
});
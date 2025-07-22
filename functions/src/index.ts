import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import axios from "axios";

// Khởi tạo Firebase Admin
admin.initializeApp();

import { onSchedule } from "firebase-functions/v2/scheduler";
import { defineString } from "firebase-functions/params";

// Định nghĩa biến môi trường
const supabaseUrl = defineString("SUPABASE_URL", { default: "https://igxvutyhdsmanhomamzo.supabase.co/rest/v1/appointments" });
const supabaseKey = defineString("SUPABASE_SERVICE_ROLE_KEY", { default: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." });

export const scheduleReminder = onSchedule(
  { schedule: "every 1 minutes", region: "us-central1" },
  async (event) => {
    try {
      const now = new Date().toISOString();
      const fifteenMinsLater = new Date(new Date().getTime() + 15 * 60 * 1000).toISOString();

      const response = await axios.get(supabaseUrl.value(), {
        headers: {
          apikey: supabaseKey.value(),
          Authorization: `Bearer ${supabaseKey.value()}`,
        },
        params: {
          select: "id,title,scheduled_at,created_by",
          status: "eq.scheduled",
          scheduled_at: `gte.${now},lte.${fifteenMinsLater}`,
        },
      });

      const appointments: { id: string; title: string; scheduled_at: string; created_by: string }[] = response.data;

      if (appointments.length > 0) {
        for (const appointment of appointments) {
          const userResponse = await axios.get(
            `${supabaseUrl.value()}/profiles?select=email,fcm_token&id=eq.${appointment.created_by}`,
            {
              headers: {
                apikey: supabaseKey.value(),
                Authorization: `Bearer ${supabaseKey.value()}`,
              },
            }
          );

          const users: { email: string; fcm_token: string }[] = userResponse.data;
          const user = users[0];
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
  }
);
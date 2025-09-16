import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import axios from "axios";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { defineString } from "firebase-functions/params";

admin.initializeApp();

const supabaseUrl = defineString("SUPABASE_URL", { default: "https://igxvutyhdsmanhomamzo.supabase.co/rest/v1/appointments" });
const supabaseKey = defineString("SUPABASE_SERVICE_ROLE_KEY", { default: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." });

export const scheduleReminder = onSchedule(
  { schedule: "every 1 minutes", region: "us-central1" },
  async (event) => {
    try {
      const response = await axios.get(supabaseUrl.value(), {
        headers: {
          apikey: supabaseKey.value(),
          Authorization: `Bearer ${supabaseKey.value()}`,
        },
        params: {
          select: "id,title,scheduled_at,created_by",
          status: "eq.scheduled",
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
                title: "Test Nhắc nhở sự kiện",
                body: `${appointment.title} - Gửi ngay để test!`,
              },
            });
            logger.info(`Đã gửi thông báo test cho ${appointment.created_by}`);
          }
        }
      } else {
        logger.info("Không có sự kiện nào để gửi test");
      }
    } catch (error) {
      logger.error("Lỗi trong scheduleReminder:", error);
    }
  }
);
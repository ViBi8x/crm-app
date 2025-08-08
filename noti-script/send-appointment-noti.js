// send-appointment-noti.js
// ----------------------------------------------------
// Gửi nhắc lịch (FCM Web) + ghi log vào bảng notifications
// Yêu cầu: trong .env.local ở thư mục gốc có các biến:
//  - SUPABASE_URL
//  - SUPABASE_SERVICE_ROLE_KEY  (service_role key, KHÔNG phải anon)
//  - APP_BASE_URL               (vd: http://localhost:3000 hoặc https://your-domain.com)
//  - APP_ICON_URL (optional)    (vd: http://localhost:3000/logo-512x512.png)
//  - APP_BADGE_URL (optional)   (vd: http://localhost:3000/logo-72x72.png)
// ----------------------------------------------------

require("dotenv").config({ path: "../.env.local" });

const { createClient } = require("@supabase/supabase-js");
const admin = require("firebase-admin");
const { addMinutes } = require("date-fns");
const { toZonedTime, format } = require("date-fns-tz");
const serviceAccount = require("./serviceAccountKey.json");

// ===== ENV helpers =====
function must(name, alts = []) {
  for (const key of [name, ...alts]) {
    const v = process.env[key];
    if (v) return v;
  }
  console.error(
    `Missing ENV: ${name}${alts.length ? ` (or ${alts.join(", ")})` : ""}. Check your .env.local`
  );
  process.exit(1);
}

const SUPABASE_URL = must("SUPABASE_URL", ["NEXT_PUBLIC_SUPABASE_URL"]);
const SUPABASE_SERVICE_ROLE_KEY = must("SUPABASE_SERVICE_ROLE_KEY");
const APP_BASE_URL = process.env.APP_BASE_URL || "http://localhost:3000";
const APP_ICON_URL = process.env.APP_ICON_URL || `${APP_BASE_URL}/logo-512x512.png`;
const APP_BADGE_URL = process.env.APP_BADGE_URL || `${APP_BASE_URL}/logo-72x72.png`;

// ===== Init clients =====
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

// ===== Utils =====
const tz = "Asia/Ho_Chi_Minh";
const toVNString = (iso) => format(toZonedTime(iso, tz), "HH:mm dd/MM/yyyy", { timeZone: tz });

const appointmentUrl = (id) => {
  // chỉnh path theo app của bạn
  // ví dụ: `${APP_BASE_URL}/app/appointments/${id}`
  return `${APP_BASE_URL}/appointments/${id}`;
};

// ===== Queries =====
async function getUpcomingAppointments() {
  const now = new Date(); // UTC
  const fiveMinsLater = addMinutes(now, 5);

  const { data, error } = await supabase
    .from("appointments")
    .select("id, title, scheduled_at, created_by")
    .gt("scheduled_at", now.toISOString())
    .lte("scheduled_at", fiveMinsLater.toISOString());

  if (error) {
    console.error("Lỗi lấy appointments:", error);
    return [];
  }
  return data || [];
}

async function getProfile(user_id) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, fcm_token")
    .eq("id", user_id)
    .single();

  if (error) {
    console.error("Lỗi lấy profile:", error);
    return null;
  }
  return data;
}

// ===== Write notification log =====
// Bảng notifications hiện có: id, user_id, type, message, read_at, created_at,
// link, payload (jsonb), actor_id, priority, contact_id, contact_name
// -> thêm: reference_id (uuid), is_read (boolean)
async function addNotification(user_id, appt, title, body, url) {
  const payload = {
    appointment_id: appt.id,
    scheduled_at: appt.scheduled_at,
    title,
    body,
    url,
  };

  const { error } = await supabase.from("notifications").insert([
    {
      user_id,
      type: "appointment",
      message: body,
      link: url,
      payload,                 // jsonb
      priority: "high",
      actor_id: appt.created_by || null,
      contact_id: null,        // truyền nếu có
      contact_name: null,      // truyền nếu có
      is_read: false,
      read_at: null,
      reference_id: appt.id,   // cột bạn vừa thêm
      created_at: new Date().toISOString(),
    },
  ]);

  if (error) console.error("Lỗi insert notifications:", error);
}

// ===== Push via FCM (webpush.notification) =====
async function sendPush(token, title, body, url) {
  if (!token) return false;

  const message = {
    token,
    webpush: {
      notification: {
        title,
        body,
        icon: APP_ICON_URL,
        badge: APP_BADGE_URL,
        requireInteraction: true,
        tag: "crm-appointment",
        renotify: true,
      },
      fcmOptions: { link: url },
      headers: { TTL: "600", Urgency: "high" },
    },
  };

  try {
    const res = await admin.messaging().send(message);
    console.log("Đã gửi notification:", res);
    return true;
  } catch (err) {
    const code = err?.errorInfo?.code;
    console.error("Lỗi gửi notification:", code || err);

    // Token hỏng → dọn dẹp để lần sau không gửi lại token rác
    if (code === "messaging/registration-token-not-registered") {
      const { error } = await supabase
        .from("profiles")
        .update({ fcm_token: null })
        .eq("fcm_token", token);
      if (error) console.error("Lỗi xoá fcm_token:", error);
      else console.warn("Đã xoá fcm_token không hợp lệ khỏi profiles.");
    }
    return false;
  }
}

// ===== Main =====
async function main() {
  console.log("ENV SUPABASE_URL =", SUPABASE_URL);
  const appts = await getUpcomingAppointments();
  console.log("Số lượng lịch sắp diễn ra:", appts.length);

  for (const appt of appts) {
    const owner = await getProfile(appt.created_by);
    if (!owner?.fcm_token) continue;

    const timeStr = toVNString(appt.scheduled_at);
    const title = "Nhắc nhở lịch hẹn";
    const body = `Bạn đã tạo lịch hẹn "${appt.title || "Không tiêu đề"}" lúc ${timeStr}`;
    const url = appointmentUrl(appt.id);

    const ok = await sendPush(owner.fcm_token, title, body, url);
    if (ok) await addNotification(owner.id, appt, title, body, url);
  }

  process.exit(0);
}

main().catch((e) => {
  console.error("Script error:", e);
  process.exit(1);
});

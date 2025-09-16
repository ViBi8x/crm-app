// noti-script/send-appointment-noti.js
// ----------------------------------------------------
// Nhắc lịch hẹn qua FCM Web (khớp UI hiện tại của bạn):
//  - Gửi NGAY nếu còn <10 phút & mới tạo trong 5 phút   (type: appointment_now)
//  - Nhắc LẦN 1: trước 10 phút (±45s)                    (type: appointment_t10)
//  - Nhắc LẦN 2: trước 5 phút  (±45s)                    (type: appointment_t5)
// Chỉ lấy lịch status = 'scheduled'. Chống trùng bằng unique (user_id, type, reference_id).
// ----------------------------------------------------
require("dotenv").config({ path: "../.env.local" });

const { createClient } = require("@supabase/supabase-js");
const admin = require("firebase-admin");
const { toZonedTime, format } = require("date-fns-tz");
const serviceAccount = require("./serviceAccountKey.json");

// ===== Cấu hình cửa sổ & mốc nhắc =====
const GRACE_SEC = 45;            // ±45s quanh mốc để không miss tick
const IMMEDIATE_WINDOW_MIN = 10; // còn <10 phút thì gửi ngay
const CREATED_GRACE_MIN = 5;     // coi là "mới tạo" nếu created_at trong vòng 5 phút

const REMINDERS = [
  { minutes: 10, type: "appointment_t10", label: "trước 10 phút" },
  { minutes: 5,  type: "appointment_t5",  label: "trước 5 phút"  },
];

// ===== ENV =====
function must(name, alts = []) {
  for (const key of [name, ...alts]) {
    const v = process.env[key];
    if (v) return v;
  }
  console.error(`Missing ENV: ${name}${alts.length ? ` (or ${alts.join(", ")})` : ""}. Check your .env.local`);
  process.exit(1);
}

const SUPABASE_URL = must("SUPABASE_URL", ["NEXT_PUBLIC_SUPABASE_URL"]);
const SUPABASE_SERVICE_ROLE_KEY = must("SUPABASE_SERVICE_ROLE_KEY");
const APP_BASE_URL = process.env.APP_BASE_URL || "http://localhost:3000";
const APP_ICON_URL = process.env.APP_ICON_URL || `${APP_BASE_URL}/logo-512x512.png`;
const APP_BADGE_URL = process.env.APP_BADGE_URL || `${APP_BASE_URL}/logo-72x72.png`;

// ===== Init clients =====
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

// ===== Utils =====
const tz = "Asia/Ho_Chi_Minh";
const toVNString = (iso) =>
  format(toZonedTime(iso, tz), "HH:mm dd/MM/yyyy", { timeZone: tz });
const appointmentUrl = (id) => `${APP_BASE_URL}/appointments/${id}`;

// ===== Data helpers =====
async function getContactName(contact_id) {
  if (!contact_id) return null;
  const { data, error } = await supabase
    .from("contacts")
    .select("id, name, full_name")
    .eq("id", contact_id)
    .single();

  if (error) return null;
  return data?.name || data?.full_name || null;
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

// ===== Kiểm tra chống trùng (theo type) =====
async function alreadySent(user_id, appt_id, type) {
  const { data, error } = await supabase
    .from("notifications")
    .select("id")
    .eq("user_id", user_id)
    .eq("type", type)
    .eq("reference_id", appt_id)
    .limit(1);

  if (error) {
    console.error("Lỗi check alreadySent:", error);
    return false;
  }
  return Array.isArray(data) && data.length > 0;
}

// ===== Ghi log notification (upsert) =====
async function upsertNotification(user_id, appt, type, title, body, url, label, contact_id, contact_name) {
  const payload = {
    appointment_id: appt.id,
    type: appt.type || null,
    duration_min: appt.duration_min ?? null,
    location: appt.location || null,
    note: appt.note || null,
    scheduled_at: appt.scheduled_at,
    reminder_stage: label,        // now / T-10 / T-5
    contact_id: contact_id || null,
    contact_name: contact_name || null,
    title,
    body,
    url,
  };

  const { error } = await supabase
    .from("notifications")
    .upsert(
      [
        {
          user_id,
          type,                       // appointment_now | appointment_t10 | appointment_t5
          message: body,
          link: url,
          payload,
          priority: "high",
          actor_id: appt.created_by || null,
          contact_id: contact_id || null,
          contact_name: contact_name || null,
          is_read: false,
          read_at: null,
          reference_id: appt.id,
          created_at: new Date().toISOString(),
        },
      ],
      { onConflict: "user_id,type,reference_id", ignoreDuplicates: true }
    );

  if (error && error.code !== "23505") {
    console.error("Lỗi upsert notifications:", error);
  }
}

// ===== Gửi FCM =====
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
      headers: { TTL: "900", Urgency: "high" },
    },
  };

  try {
    const res = await admin.messaging().send(message);
    console.log("Đã gửi notification:", res);
    return true;
  } catch (err) {
    const code = err?.errorInfo?.code;
    console.error("Lỗi gửi notification:", code || err);
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

// ===== Xây body thông báo (VN, khớp UI) =====
function buildBody(reminderLabel, appt, timeStr, contactName, minutesLeftText) {
  const who = contactName ? ` với ${contactName}` : "";
  const where = appt.location && appt.location !== "EMPTY" ? ` • Địa điểm: ${appt.location}` : "";
  const dura = appt.duration_min ? ` • Thời lượng: ${appt.duration_min} phút` : "";
  const kind = appt.type ? ` • Loại: ${appt.type}` : "";

  if (reminderLabel === "now") {
    return `Bạn vừa tạo lịch hẹn "${appt.title || "Không tiêu đề"}"${who} lúc ${timeStr} (${minutesLeftText}).${where}${dura}${kind}`;
  }
  // T-10 / T-5
  return `Lịch hẹn "${appt.title || "Không tiêu đề"}"${who} sẽ diễn ra lúc ${timeStr} (${minutesLeftText}).${where}${dura}${kind}`;
}

// ===== Truy vấn theo mốc T-10 / T-5 (± GRACE_SEC) =====
async function getAppointmentsAroundOffset(offsetMin) {
  const now = new Date();
  const target = new Date(now.getTime() + offsetMin * 60 * 1000);
  const from = new Date(target.getTime() - GRACE_SEC * 1000);
  const to   = new Date(target.getTime() + GRACE_SEC * 1000);

  console.log(`[Window ${offsetMin}m] from=${from.toISOString()} to=${to.toISOString()}`);

  const { data, error } = await supabase
    .from("appointments")
    .select("id, title, type, scheduled_at, duration_min, status, note, created_by, created_at, contact_id, location")
    .eq("status", "scheduled")
    .gte("scheduled_at", from.toISOString())
    .lte("scheduled_at", to.toISOString())
    .order("scheduled_at", { ascending: true });

  if (error) {
    console.error("Lỗi lấy appointments:", error);
    return [];
  }
  return data || [];
}

// ===== Truy vấn "gửi ngay" (<10 phút & mới tạo) =====
async function getAppointmentsImmediate() {
  const now = new Date();
  const to  = new Date(now.getTime() + IMMEDIATE_WINDOW_MIN * 60 * 1000);
  const createdFrom = new Date(now.getTime() - CREATED_GRACE_MIN * 60 * 1000);

  console.log(`[Immediate <${IMMEDIATE_WINDOW_MIN}m] to=${to.toISOString()} createdFrom=${createdFrom.toISOString()}`);

  const { data, error } = await supabase
    .from("appointments")
    .select("id, title, type, scheduled_at, duration_min, status, note, created_by, created_at, contact_id, location")
    .eq("status", "scheduled")
    .gte("scheduled_at", now.toISOString())
    .lte("scheduled_at", to.toISOString())
    .gte("created_at", createdFrom.toISOString())
    .order("scheduled_at", { ascending: true });

  if (error) {
    console.error("Lỗi lấy appointments immediate:", error);
    return [];
  }
  return data || [];
}

// ===== Process các mốc =====
async function processReminder(reminder) {
  const { minutes, type, label } = reminder;

  const appts = await getAppointmentsAroundOffset(minutes);
  console.log(`[${label}] Số lịch phù hợp:`, appts.length);

  for (const appt of appts) {
    const owner = await getProfile(appt.created_by);
    if (!owner?.fcm_token) continue;

    if (await alreadySent(owner.id, appt.id, type)) continue;

    const contactName = await getContactName(appt.contact_id);
    const timeStr = toVNString(appt.scheduled_at);
    const body = buildBody(label, appt, timeStr, contactName, `còn ~${minutes} phút`);
    const url  = appointmentUrl(appt.id);
    const title = "Nhắc nhở lịch hẹn";

    const ok = await sendPush(owner.fcm_token, title, body, url);
    if (ok) {
      await upsertNotification(
        owner.id,
        appt,
        type,
        title,
        body,
        url,
        label,
        appt.contact_id,
        contactName
      );
    }
  }
}

async function processImmediate() {
  const type  = "appointment_now";
  const label = "now";

  const appts = await getAppointmentsImmediate();
  console.log(`[Gửi ngay <${IMMEDIATE_WINDOW_MIN}m] Số lịch phù hợp:`, appts.length);

  for (const appt of appts) {
    const owner = await getProfile(appt.created_by);
    if (!owner?.fcm_token) continue;

    if (await alreadySent(owner.id, appt.id, type)) continue;

    const contactName = await getContactName(appt.contact_id);
    const timeStr = toVNString(appt.scheduled_at);
    const body = buildBody("now", appt, timeStr, contactName, `còn < ${IMMEDIATE_WINDOW_MIN} phút`);
    const url  = appointmentUrl(appt.id);
    const title = "Nhắc nhở lịch hẹn";

    const ok = await sendPush(owner.fcm_token, title, body, url);
    if (ok) {
      await upsertNotification(
        owner.id,
        appt,
        type,
        title,
        body,
        url,
        label,
        appt.contact_id,
        contactName
      );
    }
  }
}

// ===== Main =====
async function main() {
  console.log("ENV SUPABASE_URL =", SUPABASE_URL);

  // 1) Gửi NGAY cho lịch mới tạo mà còn <10 phút
  await processImmediate();

  // 2) Mốc chuẩn: T-10 & T-5
  for (const r of REMINDERS) {
    await processReminder(r);
  }

  process.exit(0);
}

main().catch((e) => {
  console.error("Script error:", e);
  process.exit(1);
});

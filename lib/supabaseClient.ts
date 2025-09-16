import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Notification {
  id: string;
  type: string;
  payload: { en: { title: string; message: string }; vi: { title: string; message: string } };
  time: string;
  priority: string;
  read_at: string | null;
  link: string | null;
  contact_id: string | null;
  contact_name: string | null;
  actor_id: string | null;
}

export async function fetchNotifications(
  userId: string,
  filters: { status?: string; type?: string; priority?: string } = {}
): Promise<Notification[]> {
  console.log("Fetching notifications for userId:", userId);
  let query = supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(10);

  if (filters.status === "unread") query = query.is("read_at", null);
  if (filters.status === "read") query = query.not("read_at", "is", null);
  if (filters.type) query = query.eq("type", filters.type);
  if (filters.priority) query = query.eq("priority", filters.priority);

  const { data, error } = await query;
  if (error) {
    console.error("fetchNotifications error:", error);
    throw new Error(error.message);
  }
  console.log("Notifications fetched:", data);
  return data.map((item: any) => ({
    ...item,
    time: new Date(item.created_at).toISOString(),
  })) as Notification[];
}

export async function getNotificationStats(userId: string): Promise<{
  total: number;
  unread: number;
  highPriority: number;
  today: number;
}> {
  console.log("Fetching stats for userId:", userId);
  const today = new Date().toISOString().split("T")[0];
  const [total, unread, highPriority, todayNotifications] = await Promise.all([
    supabase.from("notifications").select("id", { count: "exact" }).eq("user_id", userId),
    supabase.from("notifications").select("id", { count: "exact" }).eq("user_id", userId).is("read_at", null),
    supabase.from("notifications").select("id", { count: "exact" }).eq("user_id", userId).eq("priority", "high"),
    supabase.from("notifications").select("id", { count: "exact" }).eq("user_id", userId).gte("created_at", `${today}T00:00:00Z`),
  ]);

  if (total.error) console.error("total error:", total.error);
  if (unread.error) console.error("unread error:", unread.error);
  if (highPriority.error) console.error("highPriority error:", highPriority.error);
  if (todayNotifications.error) console.error("todayNotifications error:", todayNotifications.error);

  const stats = {
    total: total.count || 0,
    unread: unread.count || 0,
    highPriority: highPriority.count || 0,
    today: todayNotifications.count || 0,
  };
  console.log("Stats fetched:", stats);
  return stats;
}

export function setupRealtimeNotifications(userId: string, callback: (notification: Notification) => void) {
  console.log("Setting up realtime for userId:", userId);
  const subscription = supabase
    .channel("notifications")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        const newNotification = {
          ...payload.new,
          time: new Date(payload.new.created_at).toISOString(),
        } as Notification;
        console.log("New notification received:", newNotification);
        callback(newNotification);
      }
    )
    .subscribe();
  return () => {
    subscription.unsubscribe();
  };
}

export async function updateNotificationSettings(userId: string, type: string, enabled: boolean) {
  console.log("Updating settings for userId:", userId, "type:", type, "enabled:", enabled);
  const { error } = await supabase
    .from("notification_settings")
    .update({ enabled })
    .eq("user_id", userId)
    .eq("type", type);
  if (error) {
    console.error("Error updating settings:", error);
    throw error;
  }
}

export async function markAsRead(notificationId: string) {
  console.log("Marking notification as read:", notificationId);
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId);
  if (error) {
    console.error("Error marking as read:", error);
    throw error;
  }
}

export async function markAllAsRead(userId: string) {
  console.log("Marking all notifications as read for userId:", userId);
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", userId)
    .is("read_at", null);
  if (error) {
    console.error("Error marking all as read:", error);
    throw error;
  }
}
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Lấy thời gian hiện tại (GMT+7)
  const now = new Date();
  now.setHours(now.getHours() + 7); // Điều chỉnh múi giờ
  const fifteenMinsLater = new Date(now.getTime() + 15 * 60 * 1000);

  // Lấy các sự kiện sắp diễn ra trong 15 phút tới
  const { data: appointments, error } = await supabase
    .from("appointments")
    .select(`
      id,
      title,
      scheduled_at,
      contact_id,
      user_id,
      profiles!inner(full_name, email)
    `)
    .gte("scheduled_at", now.toISOString())
    .lte("scheduled_at", fifteenMinsLater.toISOString())
    .eq("status", "scheduled");

  if (error) {
    console.error("Lỗi khi lấy appointments:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  if (appointments && appointments.length > 0) {
    for (const appointment of appointments) {
      const userEmail = appointment.profiles?.email;
      const userName = appointment.profiles?.full_name;
      const contactName = (await supabase
        .from("contacts")
        .select("name")
        .eq("id", appointment.contact_id)
        .single()).data?.name;

      if (userEmail && userName && contactName) {
        // Gọi API Next.js để gửi email
        await fetch("https://your-nextjs-app.com/api/send-reminder-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userEmail,
            userName,
            appointmentTitle: appointment.title,
            contactName,
            scheduledAt: appointment.scheduled_at,
          }),
        });
        console.log(`Đã gửi email nhắc nhở cho ${userName} về sự kiện ${appointment.title}`);
      }
    }
  }

  return new Response(JSON.stringify({ message: "Kiểm tra nhắc nhở hoàn tất" }), { status: 200 });
});
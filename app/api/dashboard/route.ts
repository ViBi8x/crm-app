import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import dayjs from "dayjs";

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Lấy toàn bộ contacts từ view (đảm bảo đã có trường created_at, life_stage)
  const { data: contacts = [] } = await supabase
    .from("dashboard_contacts_view")
    .select("*");

  // Lấy toàn bộ appointments
  const { data: appointments = [] } = await supabase
    .from("appointments")
    .select("scheduled_at");

  // Life Stage
  const stageArr = ["Subscriber", "Lead", "Opportunity", "Customer"];
  const lifeStageData = stageArr.map((stage) => ({
    name: stage,
    value: contacts.filter((c) => c.life_stage?.toLowerCase() === stage.toLowerCase()).length || 0,
  }));

  // Thời gian tính toán
  const startOfThisMonth = dayjs().startOf("month");
  const startOfLastMonth = dayjs().subtract(1, "month").startOf("month");
  const endOfLastMonth = startOfThisMonth;

  // Stats Card 1: Tổng số liên hệ
  const totalContacts = contacts.length;

  // Stats Card 2: Tỷ lệ chuyển đổi (demo: tỷ lệ Customer trên tổng số Contact)
  const totalCustomers = contacts.filter((c) => c.life_stage === "Customer").length;
  const conversionRate = totalContacts === 0 ? 0 : (totalCustomers / totalContacts) * 100;
  // Bạn có thể tuỳ biến logic conversionRate theo nghiệp vụ của bạn

  // Stats Card 3: Số lead đang active
  const totalLeads = contacts.filter((c) => c.life_stage === "Lead").length;

  // Stats Card 4: Liên hệ mới tháng này
  const newContactsThisMonth = contacts.filter((c) =>
    c.created_at && dayjs(c.created_at).isAfter(startOfThisMonth)
  ).length;

  // Liên hệ mới tháng trước
  const newContactsLastMonth = contacts.filter((c) =>
    c.created_at &&
    dayjs(c.created_at).isSame(startOfLastMonth, "month")
  ).length;

  // % thay đổi tháng này so với tháng trước
  const calcChange = (current: number, previous: number) => {
    if (previous === 0) return "+100%";
    const diff = current - previous;
    const percent = ((diff / previous) * 100).toFixed(1);
    return `${diff >= 0 ? "+" : ""}${percent}%`;
  };

  // Stats Cards
  const stats = [
    {
      title: "Total Contacts",
      vietnamese: "Tổng số liên hệ",
      value: totalContacts,
      change: calcChange(newContactsThisMonth, newContactsLastMonth),
      changeType: "positive",
      icon: "Users",
    },
    {
      title: "Conversion Rate",
      vietnamese: "Tỷ lệ chuyển đổi",
      value: `${conversionRate.toFixed(1)}%`,
      change: "+0% from last month",
      changeType: "positive",
      icon: "TrendingUp",
    },
    {
      title: "Active Leads",
      vietnamese: "Khách hàng tiềm năng",
      value: totalLeads,
      change: "+0% from last month",
      changeType: "positive",
      icon: "Target",
    },
    {
      title: "New Contacts",
      vietnamese: "Liên hệ mới",
      value: newContactsThisMonth,
      change: calcChange(newContactsThisMonth, newContactsLastMonth),
      changeType: "positive",
      icon: "UserPlus",
    },
  ];

  // Monthly Activity Trend (12 tháng gần nhất)
  const months = Array.from({ length: 12 }, (_, i) =>
    dayjs().subtract(11 - i, "month").startOf("month")
  );
  const activityData = months.map((month) => {
    const label = month.format("MMM YYYY");
    const contactsCount = contacts.filter((c) =>
      c.created_at && dayjs(c.created_at).isSame(month, "month")
    ).length;
    const appointmentsCount = appointments.filter((a) =>
      a.scheduled_at && dayjs(a.scheduled_at).isSame(month, "month")
    ).length;
    return {
      month: label,
      contacts: contactsCount,
      appointments: appointmentsCount,
    };
  });

  return NextResponse.json({
    stats,
    lifeStageData,
    activityData,
  });
}

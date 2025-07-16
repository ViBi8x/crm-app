"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"

const COLORS: Record<string, string> = {
  Subscriber: "#3b82f6",
  Lead: "#10b981",
  Opportunity: "#f59e0b",
  Customer: "#ef4444",
  Unknown: "#9ca3af",
}

interface ContactsChartProps {
  data?: {
    name: string
    value: number
  }[]
}

export function ContactsChart({ data }: ContactsChartProps) {
  // Đảm bảo data luôn là mảng (kể cả khi undefined)
  const safeData = Array.isArray(data) ? data : []

  const formattedData = safeData.map((item) => ({
    ...item,
    color: COLORS[item.name as keyof typeof COLORS] || "#ccc",
    name: `${item.name} / ${getVietnameseLabel(item.name)}`,
  }))

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={formattedData}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={5}
          dataKey="value"
        >
          {formattedData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}

function getVietnameseLabel(lifeStage: string): string {
  switch (lifeStage) {
    case "Subscriber":
      return "Người đăng ký"
    case "Lead":
      return "Khách tiềm năng"
    case "Opportunity":
      return "Cơ hội"
    case "Customer":
      return "Khách hàng"
    default:
      return "Không xác định"
  }
}

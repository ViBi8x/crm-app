"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"

const data = [
  { name: "Subscriber / Người đăng ký", value: 1200, color: "#3b82f6" },
  { name: "Lead / Khách tiềm năng", value: 800, color: "#10b981" },
  { name: "Opportunity / Cơ hội", value: 600, color: "#f59e0b" },
  { name: "Customer / Khách hàng", value: 247, color: "#ef4444" },
]

export function ContactsChart() {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}

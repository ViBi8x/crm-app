"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"

interface ActivityChartProps {
  data: {
    month: string
    contacts: number
    appointments: number
  }[]
}

export function ActivityChart({ data }: ActivityChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis allowDecimals={false} />
        <Tooltip />
        <Legend />
        <Line
          type="monotone"
          dataKey="contacts"
          stroke="#3b82f6"
          strokeWidth={2}
          name="Contacts / Liên hệ"
        />
        <Line
          type="monotone"
          dataKey="appointments"
          stroke="#10b981"
          strokeWidth={2}
          name="Appointments / Cuộc hẹn"
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

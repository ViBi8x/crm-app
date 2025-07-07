"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

const data = [
  { month: "Jan", contacts: 65, appointments: 28 },
  { month: "Feb", contacts: 59, appointments: 48 },
  { month: "Mar", contacts: 80, appointments: 40 },
  { month: "Apr", contacts: 81, appointments: 19 },
  { month: "May", contacts: 56, appointments: 96 },
  { month: "Jun", contacts: 55, appointments: 27 },
]

export function ActivityChart() {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="contacts" stroke="#3b82f6" strokeWidth={2} name="Contacts / Liên hệ" />
        <Line type="monotone" dataKey="appointments" stroke="#10b981" strokeWidth={2} name="Appointments / Cuộc hẹn" />
      </LineChart>
    </ResponsiveContainer>
  )
}

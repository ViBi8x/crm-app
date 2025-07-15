import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    const { contacts } = await req.json()
    console.log("Received contacts payload:", contacts)

    if (!contacts || !Array.isArray(contacts)) {
      console.error("Invalid contacts payload")
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
    }

    const allowedLifeStages = ["Subscriber", "Lead", "Opportunity", "Customer"]

    // Làm sạch dữ liệu đầu vào
    const cleanedContacts = contacts.map((c: any) => {
      const { errors, status, ...rest } = c
      return {
        ...rest,
        tags: c.tags ? c.tags.split(",").map((t: string) => t.trim()) : [],
        assigned_to: c.assigned_to || null,
        created_by: c.created_by || null,
        next_appointment_at: c.next_appointment_at || null,
        life_stage: allowedLifeStages.includes(c.life_stage) ? c.life_stage : null,
      }
    })

    // Tập hợp các email và phone cần kiểm tra trùng
    const emails = cleanedContacts.map((c) => c.email).filter(Boolean)
    const phones = cleanedContacts.map((c) => c.phone).filter(Boolean)

    // Truy vấn các contact trùng trong Supabase
    const { data: existing, error: fetchError } = await supabase
      .from("contacts")
      .select("email, phone")
      .or([
        `email.in.(${emails.map((e) => `"${e}"`).join(",")})`,
        `phone.in.(${phones.map((p) => `"${p}"`).join(",")})`,
      ].join(","))

    if (fetchError) {
      console.error("Supabase fetch error:", fetchError)
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    const existingEmails = new Set(existing.map((e) => e.email))
    const existingPhones = new Set(existing.map((e) => e.phone))

    // Lọc ra contact không trùng
    const contactsToInsert = cleanedContacts.filter((c) => {
      return !(existingEmails.has(c.email) || existingPhones.has(c.phone))
    })

    const duplicates = cleanedContacts.filter((c) => {
      return existingEmails.has(c.email) || existingPhones.has(c.phone)
    })

    // Thực hiện insert
    const { data, error: insertError } = await supabase
      .from("contacts")
      .insert(contactsToInsert)

    if (insertError) {
      console.error("Supabase insert error:", insertError)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      inserted: contactsToInsert.length,
      skipped: duplicates.length,
      duplicates,
    })
  } catch (err: any) {
    console.error("Unhandled server error:", err)
    return NextResponse.json({ error: err.message || "Unknown error" }, { status: 500 })
  }
}

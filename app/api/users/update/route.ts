// /app/api/users/update/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// KHÔNG dùng anon key!
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      id,           // user id (uuid Supabase Auth)
      name,         // full_name
      email,        // email
      phone,        // phone
      role,         // role
      status,       // status
      manager_id,   // manager_id (nullable)
      password,     // password mới (optional)
    } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing user ID" }, { status: 400 });
    }

    // 1. Update bảng profiles
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({
        full_name: name,
        email,
        phone,
        role,
        status,
        manager_id: manager_id || null,
      })
      .eq("id", id);

    if (profileError) {
      console.error("Supabase profile update error:", profileError);
      return NextResponse.json({ error: "Failed to update profile!" }, { status: 400 });
    }

    // 2. Nếu có password mới thì update luôn ở Auth
    if (password && password.length >= 6) {
      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(id, { password });
      if (authError) {
        console.error("Supabase password update error:", authError);
        return NextResponse.json({ error: "Failed to update password!" }, { status: 400 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Server error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

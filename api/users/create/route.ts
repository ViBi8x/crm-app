// /app/api/users/create/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Không dùng anon key ở đây!
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phone, role, status } = body;

    // 1. Tạo Auth user (mật khẩu random 8 ký tự, có thể truyền thêm nếu muốn)
    const password = Math.random().toString(36).slice(-8);
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (userError || !userData.user) {
      return NextResponse.json(
        { error: "Failed to create Auth user!", detail: userError?.message },
        { status: 400 }
      );
    }

    // 2. Lưu vào bảng profiles
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .insert([
        {
          id: userData.user.id, // Khớp UID với Auth
          full_name: name,
          phone,
          role,
          status: status.toLowerCase(),
          email, // Nếu bảng bạn có trường email
        },
      ]);

    if (profileError) {
      return NextResponse.json({ error: "Failed to save profile!" }, { status: 400 });
    }

    return NextResponse.json({ success: true, uid: userData.user.id });
  } catch (e) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

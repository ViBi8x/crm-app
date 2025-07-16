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
    const { name, email, phone, role, status, password, manager_id } = body; // lấy thêm manager_id

    // Sử dụng password người dùng nhập, nếu không thì random 8 ký tự
    const finalPassword =
      password && password.length >= 6
        ? password
        : Math.random().toString(36).slice(-8);

    // 1. Tạo tài khoản Auth
    console.log("Creating user:", {
      email,
      finalPassword,
      name,
      role,
      status,
      manager_id,
    });

    const { data: userData, error: userError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password: finalPassword,
        email_confirm: true,
      });

    if (userError || !userData?.user) {
      console.error("Supabase Auth Error:", userError);
      return NextResponse.json(
        { error: "Failed to create Auth user!", detail: userError?.message },
        { status: 400 }
      );
    }

    // 2. Lưu vào bảng profiles (liên kết với user id vừa tạo)
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .insert([
        {
          id: userData.user.id, // Khớp UID với Auth
          full_name: name,
          phone,
          role,
          status: status?.toLowerCase(),
          email, // Nếu bảng bạn có trường email
          manager_id: manager_id || null, // <<<<<<<<<<<<<< THÊM DÒNG NÀY!
        },
      ]);

    if (profileError) {
      console.error("Supabase profile error:", profileError);
      return NextResponse.json({ error: "Failed to save profile!" }, { status: 400 });
    }

    return NextResponse.json({ success: true, uid: userData.user.id });
  } catch (e) {
    console.error("Server error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// KHÔNG bao giờ import key này ra client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "Missing user id" }, { status: 400 });

    // 1. Xoá user khỏi Supabase Auth
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id);
    if (authError) {
      return NextResponse.json({ error: "Failed to delete Auth user!" }, { status: 400 });
    }

    // 2. Xoá luôn profiles
    const { error: profileError } = await supabaseAdmin.from("profiles").delete().eq("id", id);
    if (profileError) {
      return NextResponse.json({ error: "Failed to delete profile!" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { user_id, action_type, target_id, target_type, detail } = body;

  // Cập nhật last_updated_by cho mọi hành động khi target_type là "contact"
  if (target_type === "contact") {
    const { error: updateError } = await supabase
      .from("contacts")
      .update({ last_updated_by: user_id })
      .eq("id", target_id);
    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Cập nhật life_stage cho pipeline_moved và life_stage_changed
    if ((action_type === "life_stage_changed" || action_type === "pipeline_moved") && detail?.to) {
      const { error: lifeStageError } = await supabase
        .from("contacts")
        .update({ life_stage: detail.to })
        .eq("id", target_id);
      if (lifeStageError) {
        return NextResponse.json({ error: lifeStageError.message }, { status: 500 });
      }
    }
  }

  // Ghi log cho mọi hành động
  const { error } = await supabase
    .from("activity_log")
    .insert([{ user_id, action_type, target_id, target_type, detail, created_at: new Date() }]);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
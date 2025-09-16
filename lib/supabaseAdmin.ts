// lib/supabaseAdmin.ts
import { createClient } from '@supabase/supabase-js';

// Chỉ dùng ở server-side! KHÔNG BAO GIỜ import file này bên phía client hoặc component React.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

export default supabaseAdmin;

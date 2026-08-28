import { createClient } from "@supabase/supabase-js";

export function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SB_SECRET;

  if (!url) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL mancante");
  }

  if (!secretKey) {
    throw new Error("SB_SECRET mancante");  }

  return createClient(url, secretKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
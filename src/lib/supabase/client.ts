"use client";

import { createBrowserClient } from "@supabase/ssr";
import {
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  supabaseConfigure,
} from "./config";

/** Client navigateur. Renvoie null si Supabase n'est pas configuré (mode démo). */
export function getSupabaseBrowser() {
  if (!supabaseConfigure) return null;
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

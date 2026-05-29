import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseSecretKey = process.env.NEXT_PUBLIC_SUPABASE_SECRET_KEY!;

/**
 * Browser-side Supabase client.
 * Use this in Client Components and hooks.
 */
export const supabase = createBrowserClient(supabaseUrl, supabaseSecretKey);

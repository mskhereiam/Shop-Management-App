import { createClient, SupabaseClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://kbdyxoavixbzmaqltdhc.supabase.co';
const DEFAULT_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_8W2FSa1qffHkDjVphIzhPQ_resa25C3';

let serverSupabaseClient: SupabaseClient | null = null;

export function getServerSupabase(): SupabaseClient {
  if (!serverSupabaseClient) {
    const url = process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL;
    const key =
      process.env.SUPABASE_SECRET_KEY ||
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_PUBLISHABLE_KEY ||
      DEFAULT_SUPABASE_PUBLISHABLE_KEY;

    serverSupabaseClient = createClient(url, key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }
  return serverSupabaseClient;
}

export async function verifySupabaseUserToken(token: string) {
  try {
    const supabase = getServerSupabase();
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return { authenticated: false, error: error?.message || 'Invalid user token' };
    }
    return { authenticated: true, user };
  } catch (err: any) {
    return { authenticated: false, error: err?.message || 'Auth verification error' };
  }
}

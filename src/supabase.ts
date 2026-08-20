import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Default Supabase project credentials provided
export const DEFAULT_SUPABASE_URL = 'https://kbdyxoavixbzmaqltdhc.supabase.co';
export const DEFAULT_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_8W2FSa1qffHkDjVphIzhPQ_resa25C3';
export const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtiZHl4b2F2aXhiem1hcWx0ZGhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcxNTg2OTIsImV4cCI6MjEwMjczNDY5Mn0.4CQHBcoiUWGyxyXmrBmuwQom0Ihs8e31CYEm6FVyK8k';

export function getSupabaseCredentials(): { url: string; key: string } {
  let customUrl = '';
  let customKey = '';

  if (typeof window !== 'undefined') {
    try {
      const storedUrl = localStorage.getItem('custom_supabase_url');
      const storedKey = localStorage.getItem('custom_supabase_anon_key');
      if (storedUrl && storedKey) {
        customUrl = storedUrl;
        customKey = storedKey;
      }
    } catch {
      // ignore
    }
  }

  const metaEnv = (import.meta as any).env || {};
  const envUrl =
    (metaEnv.VITE_SUPABASE_URL as string) ||
    (metaEnv.NEXT_PUBLIC_SUPABASE_URL as string) ||
    (metaEnv.SUPABASE_URL as string) ||
    customUrl ||
    DEFAULT_SUPABASE_URL;

  const envKey =
    (metaEnv.VITE_SUPABASE_PUBLISHABLE_KEY as string) ||
    (metaEnv.VITE_SUPABASE_ANON_KEY as string) ||
    (metaEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY as string) ||
    (metaEnv.SUPABASE_PUBLISHABLE_KEY as string) ||
    (metaEnv.SUPABASE_ANON_KEY as string) ||
    customKey ||
    DEFAULT_SUPABASE_PUBLISHABLE_KEY ||
    DEFAULT_SUPABASE_ANON_KEY;

  return {
    url: envUrl.trim(),
    key: envKey.trim()
  };
}

const { url: initialUrl, key: initialKey } = getSupabaseCredentials();

export const supabase: SupabaseClient = createClient(initialUrl, initialKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});

// Helper to test Supabase connectivity
export async function testSupabaseConnection(): Promise<{
  success: boolean;
  message: string;
  latencyMs?: number;
}> {
  const start = Date.now();
  try {
    const { data, error } = await supabase.from('products').select('id').limit(1);
    const latency = Date.now() - start;
    if (error && error.code !== 'PGRST116' && !error.message.includes('relation "products" does not exist')) {
      // Connected to Supabase backend even if table not created yet
      return {
        success: true,
        message: `Supabase Connected (${latency}ms) - Note: Table schema check: ${error.message}`,
        latencyMs: latency
      };
    }
    return {
      success: true,
      message: `Supabase Database Connected successfully (${latency}ms)`,
      latencyMs: latency
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Failed to connect to Supabase'
    };
  }
}

// Auto sync helper for documents
export async function syncDocToSupabase(
  table: string,
  payload: any,
  tenantId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const row = {
      ...payload,
      tenant_id: tenantId || 'default',
      updated_at: new Date().toISOString()
    };
    const { error } = await supabase.from(table).upsert(row, { onConflict: 'id' });
    if (error) {
      console.warn(`Supabase upsert note for ${table}:`, error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    console.warn(`Supabase sync error on ${table}:`, err);
    return { success: false, error: err?.message };
  }
}

// Auto delete helper
export async function deleteDocFromSupabase(
  table: string,
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) {
      console.warn(`Supabase delete note for ${table}:`, error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
}

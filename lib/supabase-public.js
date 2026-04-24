export function getSupabasePublicConfig() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
  };
}

export function hasSupabasePublicConfig() {
  const { url, anonKey } = getSupabasePublicConfig();
  return Boolean(url && anonKey);
}

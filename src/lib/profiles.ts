import { supabase } from './supabase'

export async function upsertProfile(userId: string, data: { full_name?: string; avatar_url?: string }) {
  const { error } = await supabase.from('profiles').upsert(
    {
      id: userId,
      full_name: data.full_name ?? null,
      avatar_url: data.avatar_url ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' }
  )
  if (error) throw error
}

export async function getProfilesByIds(userIds: string[]): Promise<Record<string, { full_name: string | null; avatar_url: string | null }>> {
  if (userIds.length === 0) return {}
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url')
    .in('id', userIds)
  if (error) return {}
  const map: Record<string, { full_name: string | null; avatar_url: string | null }> = {}
  for (const row of data ?? []) {
    map[row.id] = { full_name: row.full_name ?? null, avatar_url: row.avatar_url ?? null }
  }
  return map
}

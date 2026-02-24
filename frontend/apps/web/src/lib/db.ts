import { supabase } from './supabase';

export interface Conversation {
  id: string;
  user_id: string;
  title: string;
  mode: 'meeting' | 'call' | 'interview';
  livekit_room_name: string | null;
  status: 'active' | 'completed' | 'archived';
  duration_seconds: number | null;
  created_at: string;
  updated_at: string;
}

export interface UserPreferences {
  user_id: string;
  default_mode: string;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export async function createConversation(
  title: string,
  mode: 'meeting' | 'call' | 'interview',
): Promise<Conversation> {
  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user?.id;
  if (!userId) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('conversations')
    .insert({ title, mode, user_id: userId })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateConversationRoom(id: string, roomName: string): Promise<void> {
  const { error } = await supabase
    .from('conversations')
    .update({ livekit_room_name: roomName })
    .eq('id', id);
  if (error) throw error;
}

export async function completeConversation(id: string, durationSeconds: number): Promise<void> {
  const { error } = await supabase
    .from('conversations')
    .update({ status: 'completed', duration_seconds: durationSeconds })
    .eq('id', id);
  if (error) throw error;
}

export async function listConversations(limit = 50, offset = 0): Promise<Conversation[]> {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) throw error;
  return data ?? [];
}

export async function listConversationsByMode(
  mode: 'meeting' | 'call' | 'interview',
  limit = 8,
  offset = 0,
): Promise<{ data: Conversation[]; count: number }> {
  const { data, error, count } = await supabase
    .from('conversations')
    .select('*', { count: 'exact' })
    .eq('mode', mode)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) throw error;
  return { data: data ?? [], count: count ?? 0 };
}

export async function countConversationsByMode(
  mode: 'meeting' | 'call' | 'interview',
): Promise<number> {
  const { count, error } = await supabase
    .from('conversations')
    .select('*', { count: 'exact', head: true })
    .eq('mode', mode);
  if (error) throw error;
  return count ?? 0;
}

export async function deleteConversation(id: string): Promise<void> {
  const { error } = await supabase.from('conversations').delete().eq('id', id);
  if (error) throw error;
}

export async function getConversation(id: string): Promise<Conversation | null> {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export interface Transcription {
  id: string;
  conversation_id: string;
  text: string;
  speaker: string | null;
  sequence_number: number | null;
  created_at: string;
}

export interface BattleCardInsight {
  type: string;
  content: string;
  priority: string;
}

export interface BattleCard {
  id: string;
  conversation_id: string;
  insights: BattleCardInsight[];
  summary: string;
  recommendations: string[];
  created_at: string;
}

export async function getTranscriptions(conversationId: string): Promise<Transcription[]> {
  const { data, error } = await supabase
    .from('transcriptions')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('sequence_number', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getBattleCards(conversationId: string): Promise<BattleCard[]> {
  const { data, error } = await supabase
    .from('battle_cards')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function saveTranscription(params: {
  conversationId: string;
  text: string;
  speaker?: string;
  sequenceNumber?: number;
}): Promise<void> {
  const { error } = await supabase.from('transcriptions').insert({
    conversation_id: params.conversationId,
    text: params.text,
    speaker: params.speaker ?? null,
    sequence_number: params.sequenceNumber ?? null,
  });
  if (error) throw error;
}

export async function saveBattleCard(params: {
  conversationId: string;
  insights: unknown[];
  summary: string;
  recommendations: string[];
}): Promise<void> {
  const { error } = await supabase.from('battle_cards').insert({
    conversation_id: params.conversationId,
    insights: params.insights,
    summary: params.summary,
    recommendations: params.recommendations,
  });
  if (error) throw error;
}

export async function getPreferences(): Promise<UserPreferences | null> {
  const { data, error } = await supabase
    .from('user_preferences')
    .select('*')
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function upsertPreferences(
  update: Partial<Pick<UserPreferences, 'default_mode' | 'settings'>>,
): Promise<void> {
  const { data: existing } = await supabase
    .from('user_preferences')
    .select('user_id')
    .maybeSingle();

  if (existing) {
    const { error } = await supabase.from('user_preferences').update(update).eq('user_id', existing.user_id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from('user_preferences').insert(update);
    if (error) throw error;
  }
}

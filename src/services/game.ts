import { supabase } from '../api/supabase';

export type XpReason =
  | 'homework_uploaded'
  | 'classwork_uploaded'
  | 'practice_completed'
  | 'practice_perfect'
  | 'lesson_completed'
  | 'course_section_completed'
  | 'daily_mission'
  | 'weekly_goal'
  | 'streak_bonus'
  | 'achievement_unlocked'
  | 'boss_completed'
  | 'exam_completed';

export async function awardXp(params: {
  amount: number;
  reason: XpReason;
  description?: string;
  entityType?: string;
  entityId?: string;
  source?: string;
  transactionKey?: string;
}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null as null, error: new Error('Not authenticated') as any };
  const { data, error } = await supabase.rpc('award_xp', {
    p_user: user.id,
    p_amount: params.amount,
    p_reason: params.reason,
    p_description: params.description ?? null,
    p_entity_type: params.entityType ?? null,
    p_entity_id: params.entityId ?? null,
    p_source: params.source ?? 'manual',
    p_transaction_key: params.transactionKey ?? null,
  });
  return { data, error };
}

export async function logActivity(
  kind: 'practice' | 'homework' | 'classwork' | 'lesson' | 'mission' | 'study_session' | 'streak_bonus' | 'achievement',
  date?: string,
  metadata?: Record<string, unknown>
) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null as null, error: new Error('Not authenticated') as any };
  const { data, error } = await supabase.rpc('log_activity', {
    p_user: user.id,
    p_kind: kind,
    p_date: date ?? null,
    p_metadata: metadata ? JSON.stringify(metadata) : '{}',
  });
  return { data, error };
}

export async function checkAchievements() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null as null, error: new Error('Not authenticated') as any };
  return supabase.rpc('check_achievements', { p_user: user.id });
}

export async function generateMissions(date?: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [] as any[], error: new Error('Not authenticated') as any };
  const { data, error } = await supabase.rpc('generate_missions', { p_user: user.id, p_date: date ?? null });
  return { data: data ?? [], error };
}

export async function advanceMission(code: string, increment = 1) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null as null, error: new Error('Not authenticated') as any };
  return supabase.rpc('advance_mission', { p_user: user.id, p_code: code, p_increment: increment });
}

export async function completeLesson(lessonId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: new Error('Not authenticated') as any };
  return supabase.rpc('complete_lesson', { p_user: user.id, p_lesson: lessonId });
}

export async function awardXpAndActivity(params: {
  amount: number;
  reason: XpReason;
  activityKind: 'practice' | 'homework' | 'classwork' | 'lesson' | 'study_session' | 'mission';
  description?: string;
  entityType?: string;
  entityId?: string;
  transactionKey?: string;
  alsoMission?: string;
  missionIncrement?: number;
}) {
  await awardXp({
    amount: params.amount,
    reason: params.reason,
    description: params.description,
    entityType: params.entityType,
    entityId: params.entityId,
    transactionKey: params.transactionKey,
  });
  await logActivity(params.activityKind, undefined, { reason: params.reason });
  if (params.alsoMission) await advanceMission(params.alsoMission, params.missionIncrement ?? 1);
}

import { supabase } from '../api/supabase';

export type QuestionRow = {
  id: string;
  topic_id?: string | null;
  stem: string;
  options: string[];
  correct_option: string;
  difficulty?: string;
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export async function getQuestions(opts: { topicId?: string; limit?: number } = {}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [] as QuestionRow[], error: new Error('Not authenticated') };
  let q = supabase.from('practice_questions').select('*');
  if (opts.topicId) q = q.eq('topic_id', opts.topicId);
  const { data, error } = await q.limit(opts.limit ?? 10);
  return { data: shuffle(data ?? []) as QuestionRow[], error };
}

export async function getMistakes(limit = 50) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [], error: new Error('Not authenticated') };
  const { data, error } = await supabase
    .from('question_attempts')
    .select('*, question:practice_questions(*)')
    .eq('user_id', user.id)
    .eq('correct', false)
    .order('created_at', { ascending: false })
    .limit(limit);
  return { data: data ?? [], error };
}

export async function submitAttempt(opts: {
  questionId: string;
  selectedOption: string;
  correct: boolean;
  topicId?: string | null;
  timeTakenMs?: number;
}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: new Error('Not authenticated') };
  await supabase.from('question_attempts').insert({
    user_id: user.id,
    question_id: opts.questionId,
    selected_option: opts.selectedOption,
    correct: opts.correct,
    time_taken_ms: opts.timeTakenMs ?? 0,
  });
  if (opts.correct) {
    await supabase.rpc('award_xp', {
      p_user: user.id,
      p_amount: 25,
      p_reason: 'practice_correct',
      p_description: 'Correct practice answer',
      p_entity_type: 'question',
      p_entity_id: opts.questionId,
      p_source: 'practice',
      p_transaction_key: `practice:${opts.questionId}:${user.id}`,
    });
  }
  if (opts.topicId) {
    await supabase.rpc('update_topic_mastery', { p_user: user.id, p_topic: opts.topicId, p_correct: opts.correct });
  }
  return { error: null };
}

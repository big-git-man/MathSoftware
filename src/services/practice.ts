import { supabase } from '../api/supabase';

export type QuestionRow = {
  id: string;
  topic_id?: string | null;
  stem: string;
  options: string[];
  correct_option: string;
  difficulty?: string;
  explanation?: string | null;
};

export type PracticeMode = 'practice' | 'recommended' | 'revision' | 'exam';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function normalizeQuestion(row: any): QuestionRow {
  const rawOptions = Array.isArray(row.options) ? row.options : [];
  const options = rawOptions.map((option: any) => {
    if (typeof option === 'string') return option;
    return String(option?.label ?? option?.value ?? '');
  }).filter(Boolean);
  const correct = row.correct_answer ?? row.correct_option ?? '';
  return {
    id: row.id,
    topic_id: row.topic_id ?? null,
    stem: row.question ?? row.stem ?? '',
    options,
    correct_option: String(
      rawOptions.find((o: any) =>
        typeof o === 'object' && (o?.correct === true || o?.value === correct || o?.label === correct)
      )?.value ?? correct
    ),
    difficulty: row.difficulty ?? undefined,
    explanation: row.explanation ?? null,
  };
}

export async function getQuestions(opts: { topicId?: string; limit?: number } = {}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [] as QuestionRow[], error: new Error('Not authenticated') };
  let q = supabase.from('practice_questions').select('*');
  if (opts.topicId) q = q.eq('topic_id', opts.topicId);
  const { data, error } = await q.limit(opts.limit ?? 10);
  return { data: (data ?? []).map(normalizeQuestion).filter((q) => q.stem), error };
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
  const questions = (data ?? [])
    .map((attempt: any) => attempt.question)
    .filter(Boolean)
    .map(normalizeQuestion)
    .filter((q) => q.stem);
  return { data: questions, error };
}

export async function submitAttempt(opts: {
  questionId: string;
  selectedOption: string;
  correct: boolean;
  topicId?: string | null;
  difficulty?: string | null;
  timeTakenMs?: number;
}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: new Error('Not authenticated') };

  const { error: attemptError } = await supabase.from('question_attempts').insert({
    user_id: user.id,
    question_id: opts.questionId,
    topic_id: opts.topicId ?? null,
    student_answer: opts.selectedOption,
    correct: opts.correct,
    points: opts.correct ? 25 : 0,
    time_spent_ms: opts.timeTakenMs ?? 0,
    difficulty: opts.difficulty ?? null,
  });
  if (attemptError) return { error: attemptError };

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
    await supabase.rpc('update_topic_mastery', {
      p_user: user.id,
      p_topic: opts.topicId,
      p_correct: opts.correct,
      p_difficulty: opts.difficulty ?? 'medium',
    });
  }
  return { error: null };
}

export async function getRecommendedQuestions(limit = 10) {
  const { data: weak, error: weakErr } = await getWeakTopics(limit);
  if (weakErr || weak.length === 0) {
    const { data, error } = await supabase.from('practice_questions').select('*').limit(limit);
    return { data: (data ?? []).map(normalizeQuestion).filter((q) => q.stem), error };
  }
  const { data, error } = await supabase
    .from('practice_questions')
    .select('*')
    .in('topic_id', weak)
    .limit(limit);
  return { data: (data ?? []).map(normalizeQuestion).filter((q) => q.stem), error };
}

export async function getWeakTopics(limit = 5) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [] as string[], error: new Error('Not authenticated') };
  const { data, error } = await supabase
    .from('question_attempts')
    .select('topic_id, correct')
    .eq('user_id', user.id)
    .not('topic_id', 'is', null);
  if (error || !data) return { data: [], error };
  const byTopic: Record<string, { total: number; correct: number }> = {};
  (data as any[]).forEach((r) => {
    const tid = r.topic_id;
    if (!tid) return;
    if (!byTopic[tid]) byTopic[tid] = { total: 0, correct: 0 };
    byTopic[tid].total += 1;
    if (r.correct) byTopic[tid].correct += 1;
  });
  return {
    data: Object.entries(byTopic)
      .map(([tid, c]) => ({ tid, rate: c.total ? c.correct / c.total : 1 }))
      .filter((w) => w.rate < 0.7)
      .sort((a, b) => a.rate - b.rate)
      .slice(0, limit)
      .map((w) => w.tid),
    error: null as null,
  };
}

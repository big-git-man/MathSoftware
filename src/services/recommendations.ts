import { supabase } from '../api/supabase';

export async function getWeakTopics(limit = 5) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [] as string[], error: new Error('Not authenticated') };
  const { data, error } = await supabase
    .from('question_attempts')
    .select('question:practice_questions!inner(topic_id), correct')
    .eq('user_id', user.id);
  if (error || !data) return { data: [], error };
  const byTopic: Record<string, { total: number; correct: number }> = {};
  (data as any[]).forEach((r: any) => {
    const tid = r.question?.topic_id;
    if (!tid) return;
    if (!byTopic[tid]) byTopic[tid] = { total: 0, correct: 0 };
    byTopic[tid].total += 1;
    if (r.correct) byTopic[tid].correct += 1;
  });
  const weak = Object.entries(byTopic)
    .map(([tid, c]) => ({ tid, rate: c.total ? c.correct / c.total : 1 }))
    .filter((w) => w.rate < 0.7)
    .sort((a, b) => a.rate - b.rate)
    .slice(0, limit)
    .map((w) => w.tid);
  return { data: weak, error: null as null };
}

export async function getRecommendedQuestions(limit = 10) {
  const { data: weak, error: weakErr } = await getWeakTopics(limit);
  if (weakErr || weak.length === 0) {
    const { data, error } = await supabase.from('practice_questions').select('*').limit(limit);
    return { data: data ?? [], error };
  }
  const { data, error } = await supabase
    .from('practice_questions')
    .select('*')
    .in('topic_id', weak)
    .limit(limit);
  return { data: data ?? [], error };
}

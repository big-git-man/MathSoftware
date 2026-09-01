import { supabase } from '../api/supabase';

export async function listSubjects() {
  const { data, error } = await supabase.from('subjects').select('*').order('position');
  return { data: data ?? [], error };
}

export async function getSubject(subjectId: string) {
  return supabase
    .from('subjects')
    .select('*, courses(*, units(*, topics(*, lessons(*))))')
    .eq('id', subjectId)
    .maybeSingle();
}

export async function listCourses(subjectId?: string) {
  const q = supabase.from('courses').select('*').order('position');
  const { data, error } = subjectId ? await q.eq('subject_id', subjectId) : await q;
  return { data: data ?? [], error };
}

export async function listTopics(courseId?: string) {
  const q = supabase.from('topics').select('id, name, description, position, color, difficulty, unit_id').order('position');
  const { data, error } = courseId
    ? await q.eq('unit_id', courseId)  // course -> units; callers pass unit id when needed
    : await q;
  return { data: data ?? [], error };
}

export async function getTopic(topicId: string) {
  return supabase
    .from('topics')
    .select('*, unit:units(*), lessons(*)')
    .eq('id', topicId)
    .maybeSingle();
}

export async function listLessons(topicId: string) {
  const { data, error } = await supabase
    .from('lessons')
    .select('*')
    .eq('topic_id', topicId)
    .order('position');
  return { data: data ?? [], error };
}

export async function getLesson(lessonId: string) {
  return supabase.from('lessons').select('*, topic:topics(*)').eq('id', lessonId).maybeSingle();
}

export async function listUnits(courseId: string) {
  const { data, error } = await supabase.from('units').select('*').eq('course_id', courseId).order('position');
  return { data: data ?? [], error };
}

export async function getCurriculumTree() {
  const [subjects, courses, units, topics] = await Promise.all([
    supabase.from('subjects').select('*').order('position'),
    supabase.from('courses').select('*').order('position'),
    supabase.from('units').select('*').order('position'),
    supabase.from('topics').select('*').order('position'),
  ]);
  return {
    subjects: subjects.data ?? [],
    courses: courses.data ?? [],
    units: units.data ?? [],
    topics: topics.data ?? [],
  };
}

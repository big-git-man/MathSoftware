import { supabase } from '../api/supabase';
import type { Tables } from '../types/db';

export type DocumentRow = Tables<'documents'>;
export type DocumentType = NonNull<DocumentRow['document_type']>;
export type ProcessingStatus = NonNull<DocumentRow['processing_status']>;
type NonNull<T> = T extends null | undefined ? never : T;

export type DocumentFilter = {
  type?: DocumentType;
  courseId?: string;
  topicId?: string;
  subjectId?: string;
  assignmentId?: string;
  favorite?: boolean;
  processingStatus?: ProcessingStatus;
  search?: string;
  limit?: number;
  offset?: number;
  sort?: 'created_at' | 'upload_date' | 'ai_title' | 'page_count';
  order?: 'desc' | 'asc';
};

export async function listDocuments(filter: DocumentFilter = {}) {
  let q = supabase.from('documents').select('*', { count: 'exact' });
  if (filter.type) q = q.eq('document_type', filter.type);
  if (filter.courseId) q = q.eq('course_id', filter.courseId);
  if (filter.topicId) q = q.eq('topic_id', filter.topicId);
  if (filter.subjectId) q = q.eq('subject_id', filter.subjectId);
  if (filter.assignmentId) q = q.eq('assignment_id', filter.assignmentId);
  if (filter.favorite) q = q.eq('is_favorite', true);
  if (filter.processingStatus) q = q.eq('processing_status', filter.processingStatus);
  const sort = filter.sort ?? 'created_at';
  const asc = (filter.order ?? 'desc') === 'asc';
  const limit = filter.limit ?? 30;
  const offset = filter.offset ?? 0;
  q = q.order(sort, { ascending: asc }).range(offset, offset + limit - 1);
  return q;
}

export async function getDocument(id: string) {
  return supabase
    .from('documents')
    .select('*, assignment:assignments(*), topic:topics(*), course:courses(*), subject:subjects(*)')
    .eq('id', id)
    .maybeSingle();
}

export async function getDocumentsByIds(ids: string[]) {
  return supabase.from('documents').select('*').in('id', ids);
}

export async function searchDocuments(query: string, limit = 30) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [], error: { message: 'Not authenticated' } as any };
  const { data, error } = await supabase.rpc('search_documents', {
    p_user: user.id,
    p_query: query,
    p_limit: limit,
  });
  return { data: (data ?? []) as DocumentRow[], error };
}

export async function setDocumentFavorite(id: string, favorite: boolean) {
  return supabase.from('documents').update({ is_favorite: favorite }).eq('id', id);
}

export async function deleteDocument(id: string) {
  return supabase.from('documents').delete().eq('id', id);
}

export async function getAssignment(id: string) {
  return supabase.from('assignments').select('*').eq('id', id).maybeSingle();
}

export async function listAssignmentDocuments(assignmentId: string) {
  return supabase
    .from('documents')
    .select('*')
    .eq('assignment_id', assignmentId)
    .order('created_at', { ascending: true });
}

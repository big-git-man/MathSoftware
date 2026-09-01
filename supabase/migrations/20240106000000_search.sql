-- =====================================================================
-- Full-text search across OCR text, AI summary, title and filename.
-- Uses the GIN index created on to_tsvector('english', ocr_text).
-- =====================================================================

create or replace function public.search_documents(p_user uuid, p_query text, p_limit int default 30)
returns setof public.documents
language sql
as $$
  select d.*
  from public.documents d
  where d.user_id = p_user
    and (
      to_tsvector('english', coalesce(d.ocr_text, ''))        @@ plainto_tsquery('english', p_query)
      or to_tsvector('english', coalesce(d.ai_summary, ''))   @@ plainto_tsquery('english', p_query)
      or to_tsvector('english', coalesce(d.ai_title, ''))     @@ plainto_tsquery('english', p_query)
      or d.original_filename                                 ilike ('%' || p_query || '%')
    )
  order by d.created_at desc
  limit p_limit;
$$;

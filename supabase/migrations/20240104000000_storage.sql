-- =====================================================================
-- PHASE 2: Private storage bucket + storage RLS
-- Files live under user/{uid}/documents/{doc_id}/... and are locked down at
-- the storage layer: only the owning user can read/write their own objects.
-- =====================================================================

-- Private bucket for all academic documents.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'documents',
  'documents',
  false,
  104857600,
  array[
    'image/jpeg','image/png','image/heic','image/heif','image/webp',
    'application/pdf',
    'image/jpg','image/jxl'
  ]
)
on conflict (id) do update
  set public = false, file_size_limit = 104857600;

-- Supabase owns storage.objects and manages RLS on this table.
-- Do not ALTER storage.objects here, because the migration role is not the
-- owner of Supabase's managed storage table. The table is already protected
-- by RLS, and the policies below add the application-specific restrictions.

-- SELECT / download: only the owning user (path segment: user/{uid}/...).
create policy "documents_select_owner"
  on storage.objects for select
  using (
    bucket_id = 'documents'
    and auth.uid() is not null
    and auth.uid()::text = split_part(name, '/', 2)
  );

-- INSERT: files must be owned by the uploader and live under their path.
create policy "documents_insert_owner"
  on storage.objects for insert
  with check (
    bucket_id = 'documents'
    and auth.uid() is not null
    and auth.uid()::text = split_part(name, '/', 2)
  );

-- UPDATE / DELETE: owned objects only.
create policy "documents_update_owner"
  on storage.objects for update
  using (
    bucket_id = 'documents'
    and auth.uid()::text = split_part(name, '/', 2)
  );

create policy "documents_delete_owner"
  on storage.objects for delete
  using (
    bucket_id = 'documents'
    and auth.uid()::text = split_part(name, '/', 2)
  );

-- Keep legacy default access restricted for this bucket.
revoke all on function storage.read_only_user() from public;

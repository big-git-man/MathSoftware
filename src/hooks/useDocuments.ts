import { useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { listDocuments, getSignedUrl, DocumentMeta, searchDocuments } from '../services/documents';
import { useAuth } from '../store/authStore';

const CACHE_KEY = 'docs_cache';

export function useDocuments(search = '') {
  const user = useAuth((s) => s.user);
  const [data, setData] = useState<DocumentMeta[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(CACHE_KEY);
        if (raw && !cancelled && !search) setData(JSON.parse(raw) as DocumentMeta[]);
      } catch {}
    })();
    return () => { cancelled = true; };
  }, [user, search]);

  const fetch = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const result = search.trim()
      ? await searchDocuments(search.trim())
      : await listDocuments();
    const { data: rows, error } = result;
    const docs: DocumentMeta[] = await Promise.all(
      (rows ?? []).map(async (r: any) => {
        const mime = r.mime_type ?? '';
        const isImage = mime.startsWith('image/');
        const signed = isImage
          ? await getSignedUrl(r.storage_bucket ?? 'documents', r.storage_path)
          : { url: null as string | null };
        const thumb = r.thumbnail_path
          ? await getSignedUrl(r.storage_bucket ?? 'documents', r.thumbnail_path)
          : { url: null as string | null };
        return {
          id: r.id,
          title: r.ai_title ?? r.original_filename ?? 'Untitled',
          description: r.ai_summary ?? '',
          type: isImage ? 'image' : 'pdf',
          mime_type: mime,
          uri: signed.url,
          thumbnail_url: thumb.url,
          storage_path: r.storage_path,
          bucket: r.storage_bucket ?? 'documents',
          document_type: r.document_type,
          subject: r.subject ?? r.subjects ?? null,
          course: r.course ?? r.courses ?? null,
          unit: r.unit ?? r.units ?? null,
          topic: r.topic ?? r.topics ?? null,
          tags: r.tags ?? [],
          created_at: r.created_at,
          updated_at: r.updated_at,
        } as DocumentMeta;
      })
    );
    setData(error ? [] : docs);
    setLoading(false);
    if (!search.trim()) {
      try { await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(error ? [] : docs)); } catch {}
    }
  }, [user, search]);

  useEffect(() => { void fetch(); }, [fetch]);
  return { data, loading, refetch: fetch };
}

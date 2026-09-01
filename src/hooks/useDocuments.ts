import { useEffect, useState, useCallback } from 'react';
import { listDocuments, getSignedUrl, DocumentMeta } from '../services/documents';
import { useAuth } from '../store/authStore';

export function useDocuments() {
  const user = useAuth((s) => s.user);
  const [data, setData] = useState<DocumentMeta[]>([]);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data: rows, error } = await listDocuments();
    const docs: DocumentMeta[] = await Promise.all(
      rows.map(async (r: any) => {
        const signed =
          r.type === 'image'
            ? await getSignedUrl(r.storage_bucket ?? 'documents', r.storage_path)
            : { url: null };
        return {
          id: r.id,
          title: r.title,
          description: r.description,
          type: r.type,
          uri: signed.url,
          thumbnail_url: r.thumbnail_path
            ? (await getSignedUrl(r.storage_bucket ?? 'documents', r.thumbnail_path)).url
            : null,
          storage_path: r.storage_path,
          bucket: r.storage_bucket ?? 'documents',
          subject: r.subjects ? { name: r.subjects.name } : null,
          course: r.courses ? { name: r.courses.name } : null,
          unit: r.units ? { name: r.units.name } : null,
          topic: r.topics ? { name: r.topics.name } : null,
          tags: r.tags ?? [],
          created_at: r.created_at,
          updated_at: r.updated_at,
        } as DocumentMeta;
      })
    );
    setData(error ? [] : docs);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void fetch();
  }, [fetch]);

  return { data, loading, refetch: fetch };
}

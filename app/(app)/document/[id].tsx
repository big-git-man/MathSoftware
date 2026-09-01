import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../../src/theme';
import { ThemeText } from '../../../src/components/ui/Text';
import { Screen } from '../../../src/components/layout/Screen';
import { DocumentViewer } from '../../../src/components/DocumentViewer';
import { getDocument, getSignedUrl, DocumentMeta } from '../../../src/services/documents';

export default function DocumentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useTheme();
  const [doc, setDoc] = useState<DocumentMeta | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data: row } = await getDocument(id);
      if (!row) { setLoading(false); return; }
      const mime = row.mime_type ?? '';
      const isImage = mime.startsWith('image/');
      const signed = isImage
        ? await getSignedUrl(row.storage_bucket ?? 'documents', row.storage_path)
        : { url: null as string | null };
      setUrl(signed.url);
      setDoc({
        id: row.id,
        title: row.title,
        description: row.description,
        type: isImage ? 'image' : 'pdf',
        mime_type: mime,
        uri: signed.url,
        storage_path: row.storage_path,
        bucket: row.storage_bucket ?? 'documents',
        subject: row.subjects ? { name: row.subjects.name } : null,
        tags: row.tags ?? [],
        created_at: row.created_at,
        updated_at: row.updated_at,
      } as DocumentMeta);
      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return (
      <Screen bg="background">
        <ActivityIndicator style={{ marginTop: 40 }} color={useTheme().primary} />
      </Screen>
    );
  }
  if (!doc) {
    return (
      <Screen bg="background">
        <ThemeText style={{ padding: 16 }}>Document not found.</ThemeText>
      </Screen>
    );
  }
  return (
    <>
      <Stack.Screen name="Document" options={{ title: doc.title }} />
      <Screen bg="background">
        {url ? <DocumentViewer uri={url} type={doc.type} style={{ flex: 1 }} /> : <ThemeText style={{ padding: 16 }}>Preview unavailable.</ThemeText>}
      </Screen>
    </>
  );
}

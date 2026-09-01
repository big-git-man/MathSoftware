import { View, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useTheme } from '../../../src/theme';
import { ThemeText } from '../../../src/components/ui/Text';
import { Screen } from '../../../src/components/layout/Screen';
import { listLessons } from '../../../src/services/curriculum';
import { useEffect, useState } from 'react';

type Lesson = { id: string; title?: string };

export default function TopicScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useTheme();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data, error } = await listLessons(id);
      if (!error) setLessons((data ?? []) as Lesson[]);
      setLoading(false);
    })();
  }, [id]);

  return (
    <Screen bg="background">
      <Stack.Screen name="Topic" options={{ title: 'Topic' }} />
      <View style={{ flex: 1, padding: 16 }}>
        <ThemeText variant="h3" style={{ marginBottom: 16 }}>Lessons</ThemeText>
        {loading ? <ThemeText>Loading…</ThemeText> : (
          <FlatList
            data={lessons}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => router.push(`/(app)/practice/session?topicId=${item.id}` as any)}
              >
                <ThemeText>{item.title ?? item.id}</ThemeText>
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </Screen>
  );
}
const styles = StyleSheet.create({ row: { borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 8 } });

import { View, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useTheme } from '../../../src/theme';
import { ThemeText } from '../../../src/components/ui/Text';
import { Screen } from '../../../src/components/layout/Screen';
import { getSubject } from '../../../src/services/curriculum';
import { useEffect, useState } from 'react';

export default function SubjectScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useTheme();
  const [topics, setTopics] = useState<any[]>([]);
  const [name, setName] = useState('');

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data: subj } = await getSubject(id);
      setName(subj?.name ?? '');
      const flat: any[] = [];
      (subj?.courses ?? []).forEach((c: any) =>
        (c.units ?? []).forEach((u: any) => flat.push(...(u.topics ?? [])))
      );
      setTopics(flat);
    })();
  }, [id]);

  return (
    <Screen bg="background">
      <Stack.Screen name="Subject" options={{ title: name || 'Subject' }} />
      <View style={{ flex: 1, padding: 16 }}>
        <ThemeText variant="h3" style={{ marginBottom: 16 }}>{name}</ThemeText>
        <FlatList
          data={topics}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => router.push(`/(app)/topic/${item.id}` as any)}
            >
              <ThemeText>{item.name}</ThemeText>
            </TouchableOpacity>
          )}
        />
      </View>
    </Screen>
  );
}
const styles = StyleSheet.create({ row: { borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 8 } });

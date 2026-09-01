import { View, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/theme';
import { ThemeText } from '../../src/components/ui/Text';
import { Screen } from '../../src/components/layout/Screen';
import { listSubjects } from '../../src/services/curriculum';
import { useEffect, useState } from 'react';

type Subject = { id: string; name: string; description?: string };

export default function LearnScreen() {
  const colors = useTheme();
  const router = useRouter();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data, error } = await listSubjects();
      if (!error) setSubjects((data ?? []) as Subject[]);
      setLoading(false);
    })();
  }, []);

  return (
    <Screen bg="background">
      <View style={{ flex: 1, padding: 16 }}>
        <ThemeText variant="h3" style={{ marginBottom: 16 }}>Curriculum</ThemeText>
        {loading ? (
          <ThemeText>Loading subjects…</ThemeText>
        ) : (
          <FlatList
            data={subjects}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => router.push(`/(app)/subject/${item.id}` as any)}
              >
                <ThemeText variant="subtitle">{item.name}</ThemeText>
                {item.description ? <ThemeText variant="caption" style={{ color: colors.textSecondary }}>{item.description}</ThemeText> : null}
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </Screen>
  );
}
const styles = StyleSheet.create({ card: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 10 } });

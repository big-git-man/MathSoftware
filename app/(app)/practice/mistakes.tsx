import { View, FlatList, StyleSheet } from 'react-native';
import { useEffect, useState } from 'react';
import { useTheme } from '../../../src/theme';
import { ThemeText } from '../../../src/components/ui/Text';
import { Screen } from '../../../src/components/layout/Screen';
import { getMistakes } from '../../../src/services/practice';

export default function MistakesScreen() {
  const colors = useTheme();
  const [items, setItems] = useState<any[]>([]);
  useEffect(() => {
    (async () => {
      const { data } = await getMistakes();
      setItems(data ?? []);
    })();
  }, []);
  return (
    <Screen bg="background">
      <View style={{ flex: 1, padding: 16 }}>
        <ThemeText variant="h3" style={{ marginBottom: 16 }}>Your mistakes</ThemeText>
        <FlatList
          data={items}
          keyExtractor={(item, k) => String(item.id ?? k)}
          renderItem={({ item }) => (
            <View style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <ThemeText style={{ color: colors.textSecondary, marginRight: 8 }}>✕</ThemeText>
              <ThemeText>{item.question?.stem ?? '—'}</ThemeText>
            </View>
          )}
        />
      </View>
    </Screen>
  );
}
const styles = StyleSheet.create({ row: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 8 } });

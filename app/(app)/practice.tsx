import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/theme';
import { ThemeText } from '../../src/components/ui/Text';
import { Screen } from '../../src/components/layout/Screen';
import { Button } from '../../src/components/ui/Button';

export default function PracticeScreen() {
  const colors = useTheme();
  const router = useRouter();
  return (
    <Screen bg="background">
      <View style={{ flex: 1, padding: 16 }}>
        <ThemeText variant="h3" style={{ marginBottom: 16 }}>Practice</ThemeText>
        <Button title="Start a practice session" onPress={() => router.push('/(app)/practice/session' as any)} style={{ marginBottom: 12 }} />
        <Button title="Review mistakes" variant="secondary" onPress={() => router.push('/(app)/practice/mistakes' as any)} style={{ marginBottom: 12 }} />
        <Button title="Daily Boss Battle" variant="danger" onPress={() => router.push('/(app)/boss' as any)} />
      </View>
    </Screen>
  );
}

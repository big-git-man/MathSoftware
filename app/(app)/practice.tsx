import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/theme';
import { ThemeText } from '../../src/components/ui/Text';
import { Screen } from '../../src/components/layout/Screen';
import { Button } from '../../src/components/ui/Button';

export default function PracticeScreen() {
  const colors = useTheme();
  const router = useRouter();
  const start = (mode: string) => router.push(`/(app)/practice/session?mode=${mode}` as any);

  return (
    <Screen scrollable bg="background">
      <View style={{ flex: 1, padding: 16 }}>
        <ThemeText variant="h3" style={{ marginBottom: 8 }}>Practice</ThemeText>
        <ThemeText style={{ color: colors.textSecondary, marginBottom: 20 }}>
          Build mastery with targeted practice, revision, or an exam-style run.
        </ThemeText>
        <Button title="Recommended for me" onPress={() => start('recommended')} style={{ marginBottom: 12 }} />
        <Button title="Practice" variant="secondary" onPress={() => start('practice')} style={{ marginBottom: 12 }} />
        <Button title="Revision mode" variant="secondary" onPress={() => start('revision')} style={{ marginBottom: 12 }} />
        <Button title="Exam mode" variant="secondary" onPress={() => start('exam')} style={{ marginBottom: 12 }} />
        <Button title="Review mistakes" variant="secondary" onPress={() => router.push('/(app)/practice/mistakes' as any)} style={{ marginBottom: 12 }} />
        <Button title="Daily Boss Battle" variant="danger" onPress={() => router.push('/(app)/boss' as any)} />
      </View>
    </Screen>
  );
}

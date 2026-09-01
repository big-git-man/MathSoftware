import { View, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTheme } from '../../../src/theme';
import { ThemeText } from '../../../src/components/ui/Text';
import { Screen } from '../../../src/components/layout/Screen';
import { Button } from '../../../src/components/ui/Button';
import { getQuestions, submitAttempt } from '../../../src/services/practice';

type Question = { id: string; topic_id?: string | null; stem: string; options: string[]; correct_option: string };

export default function PracticeSessionScreen() {
  const router = useRouter();
  const { topicId } = useLocalSearchParams<{ topicId: string }>();
  const colors = useTheme();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [correctCount, setCorrectCount] = useState(0);

  useEffect(() => {
    (async () => {
      const { data } = await getQuestions({ topicId, limit: 10 });
      setQuestions(data ?? []);
      setLoading(false);
    })();
  }, [topicId]);

  const q = questions[index];
  const onSelect = (opt: string) => {
    if (!q || selected) return;
    setSelected(opt);
    const correct = opt === q.correct_option;
    if (correct) setCorrectCount((c) => c + 1);
    void submitAttempt({ questionId: q.id, selectedOption: opt, correct, topicId: q.topic_id });
  };

  if (loading) {
    return (
      <Screen bg="background">
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
      </Screen>
    );
  }
  if (!q) {
    return (
      <Screen bg="background">
        <ThemeText style={{ padding: 16 }}>No questions available.</ThemeText>
      </Screen>
    );
  }
  const answered = !!selected;
  const isCorrect = selected === q.correct_option;

  return (
    <Screen scrollable bg="background">
      <View style={{ padding: 16 }}>
        <ThemeText variant="caption" style={{ color: colors.textSecondary }}>{index + 1} / {questions.length}</ThemeText>
        <ThemeText variant="h3" style={{ marginVertical: 16 }}>{q.stem}</ThemeText>
        {q.options.map((opt, i) => {
          const chosen = selected === opt;
          let bg = colors.card;
          if (answered && opt === q.correct_option) bg = '#dcfce7';
          else if (answered && chosen && !isCorrect) bg = '#fee2e2';
          return (
            <TouchableOpacity
              key={i}
              style={[styles.opt, { backgroundColor: bg, borderColor: colors.border }]}
              onPress={() => onSelect(opt)}
              disabled={answered}
            >
              <ThemeText>{opt}</ThemeText>
            </TouchableOpacity>
          );
        })}
        {answered && (
          <View style={{ marginTop: 16 }}>
            <ThemeText>{isCorrect ? 'Correct!' : `Correct answer: ${q.correct_option}`}</ThemeText>
            <Button title="Next question" onPress={() => { setSelected(null); setIndex((i) => i + 1); }} style={{ marginTop: 12 }} />
          </View>
        )}
      </View>
    </Screen>
  );
}
const styles = StyleSheet.create({ opt: { borderRadius: 12, borderWidth: 1, padding: 16, marginBottom: 10 } });

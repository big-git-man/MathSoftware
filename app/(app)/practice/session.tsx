import { View, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTheme } from '../../../src/theme';
import { ThemeText } from '../../../src/components/ui/Text';
import { Screen } from '../../../src/components/layout/Screen';
import { Button } from '../../../src/components/ui/Button';
import { getQuestions, getMistakes, getRecommendedQuestions, submitAttempt, PracticeMode, QuestionRow } from '../../../src/services/practice';

export default function PracticeSessionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ topicId?: string; mode?: PracticeMode }>();
  const mode: PracticeMode = params.mode ?? 'practice';
  const colors = useTheme();
  const [questions, setQuestions] = useState<QuestionRow[]>([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [correctCount, setCorrectCount] = useState(0);
  const [examAnswers, setExamAnswers] = useState<Record<string, string>>({});
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    (async () => {
      let result;
      if (mode === 'recommended') result = await getRecommendedQuestions(10);
      else if (mode === 'revision') result = await getMistakes(10);
      else result = await getQuestions({ topicId: params.topicId, limit: mode === 'exam' ? 20 : 10 });
      setQuestions(result.data ?? []);
      setLoading(false);
    })();
  }, [mode, params.topicId]);

  const q = questions[index];

  const submitCurrent = async (opt: string) => {
    if (!q || selected) return;
    setSelected(opt);
    const correct = opt === q.correct_option;
    if (correct) setCorrectCount((c) => c + 1);
    setExamAnswers((answers) => ({ ...answers, [q.id]: opt }));
    if (mode !== 'exam') {
      await submitAttempt({ questionId: q.id, selectedOption: opt, correct, topicId: q.topic_id, difficulty: q.difficulty });
    }
  };

  const next = async () => {
    if (index + 1 >= questions.length) {
      if (mode === 'exam') {
        const answers = { ...examAnswers };
        if (q && selected) answers[q.id] = selected;
        let score = 0;
        for (const question of questions) if (answers[question.id] === question.correct_option) score += 1;
        for (const question of questions) {
          const answer = answers[question.id];
          if (answer) {
            await submitAttempt({ questionId: question.id, selectedOption: answer, correct: answer === question.correct_option, topicId: question.topic_id, difficulty: question.difficulty });
          }
        }
        setCorrectCount(score);
      }
      setFinished(true);
      return;
    }
    setSelected(null);
    setIndex((i) => i + 1);
  };

  if (loading) {
    return <Screen bg="background"><ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} /></Screen>;
  }

  if (!questions.length) {
    return (
      <Screen bg="background">
        <View style={{ padding: 16 }}>
          <ThemeText variant="h3">{mode === 'revision' ? 'No mistakes to revise' : 'No questions available'}</ThemeText>
          <ThemeText style={{ marginTop: 8, color: colors.textSecondary }}>
            Add practice questions to the selected topic, then come back here.
          </ThemeText>
          <Button title="Back to Practice" onPress={() => router.back()} style={{ marginTop: 20 }} />
        </View>
      </Screen>
    );
  }

  if (finished) {
    const total = questions.length;
    return (
      <Screen bg="background">
        <View style={{ padding: 24, alignItems: 'center' }}>
          <ThemeText variant="h2">{mode === 'exam' ? 'Exam complete' : 'Session complete'}</ThemeText>
          <ThemeText variant="h3" style={{ marginTop: 16 }}>{correctCount} / {total}</ThemeText>
          <ThemeText style={{ marginTop: 8, color: colors.textSecondary }}>
            {Math.round((correctCount / total) * 100)}% accuracy
          </ThemeText>
          <Button title="Done" onPress={() => router.back()} style={{ marginTop: 24 }} />
        </View>
      </Screen>
    );
  }

  const answered = !!selected;
  const isCorrect = selected === q.correct_option;

  return (
    <Screen scrollable bg="background">
      <View style={{ padding: 16 }}>
        <ThemeText variant="caption" style={{ color: colors.textSecondary }}>
          {mode.toUpperCase()} · {index + 1} / {questions.length}
        </ThemeText>
        <ThemeText variant="h3" style={{ marginVertical: 16 }}>{q.stem}</ThemeText>
        {q.options.map((opt, i) => {
          const chosen = selected === opt;
          let bg = colors.card;
          if (mode !== 'exam' && answered && opt === q.correct_option) bg = colors.successSoft;
          else if (mode !== 'exam' && answered && chosen && !isCorrect) bg = colors.dangerSoft;
          else if (mode === 'exam' && chosen) bg = colors.primarySoft;
          return (
            <TouchableOpacity
              key={`${q.id}-${i}`}
              style={[styles.opt, { backgroundColor: bg, borderColor: colors.border }]}
              onPress={() => void submitCurrent(opt)}
              disabled={answered}
            >
              <ThemeText>{opt}</ThemeText>
            </TouchableOpacity>
          );
        })}
        {answered && mode !== 'exam' && (
          <ThemeText style={{ marginTop: 16 }}>
            {isCorrect ? 'Correct!' : `Correct answer: ${q.correct_option}`}
          </ThemeText>
        )}
        {answered && (
          <Button title={index + 1 === questions.length ? 'Finish' : 'Next question'} onPress={() => void next()} style={{ marginTop: 12 }} />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  opt: { borderRadius: 12, borderWidth: 1, padding: 16, marginBottom: 10 },
});

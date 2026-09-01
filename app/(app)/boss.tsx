import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTheme } from '../../src/theme';
import { ThemeText } from '../../src/components/ui/Text';
import { Screen } from '../../src/components/layout/Screen';
import { Button } from '../../src/components/ui/Button';
import { LevelBadge } from '../../src/components/ui/LevelBadge';
import { getQuestions, submitAttempt } from '../../src/services/practice';
import { supabase } from '../../src/api/supabase';

const BOSS_HP = 3;

export default function BossBattleScreen() {
  const colors = useTheme();
  const router = useRouter();
  const [questions, setQuestions] = useState<any[]>([]);
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [bossHp, setBossHp] = useState(BOSS_HP);
  const [rewarded, setRewarded] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await getQuestions({ limit: BOSS_HP });
      setQuestions(data ?? []);
      setLoading(false);
    })();
  }, []);

  const q = questions[idx];
  const answered = !!selected;

  const onSelect = (opt: string) => {
    if (!q || answered) return;
    setSelected(opt);
    const correct = opt === q.correct_option;
    void submitAttempt({ questionId: q.id, selectedOption: opt, correct, topicId: q.topic_id });
    if (correct) setBossHp((h) => h - 1);
  };

  const onNext = () => {
    setSelected(null);
    if (idx + 1 < questions.length) {
      setIdx(idx + 1);
    } else {
      void finish();
    }
  };

  const finish = async () => {
    if (rewarded) { router.back(); return; }
    setRewarded(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.rpc('award_xp', {
        p_user: user.id,
        p_amount: 50,
        p_reason: 'boss_victory',
        p_description: 'Daily boss battle',
        p_entity_type: 'boss',
        p_entity_id: 'daily',
        p_source: 'practice',
        p_transaction_key: `boss:${user.id}:${new Date().toISOString().slice(0, 10)}`,
      });
      await supabase.rpc('check_achievements', { p_user: user.id });
    }
    router.back();
  };

  if (loading) return <Screen bg="background"><ThemeText style={{ padding: 16 }}>Summoning the boss…</ThemeText></Screen>;
  if (!q) return <Screen bg="background"><ThemeText style={{ padding: 16 }}>No boss today. Come back later!</ThemeText></Screen>;

  return (
    <Screen scrollable bg="background">
      <View style={{ padding: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <ThemeText variant="h3">🔥 Daily Boss</ThemeText>
          <LevelBadge level={0} />
        </View>
        <View style={{ height: 10, backgroundColor: colors.borderAlt, borderRadius: 999, overflow: 'hidden', marginBottom: 4 }}>
          <View style={{ width: `${((BOSS_HP - bossHp) / BOSS_HP) * 100}%`, height: 10, backgroundColor: '#ef4444', borderRadius: 999 }} />
        </View>
        <ThemeText variant="caption" style={{ color: colors.textSecondary, marginBottom: 16 }}>{BOSS_HP - bossHp}/{BOSS_HP} weak spot(s) hit</ThemeText>
        <ThemeText variant="h3" style={{ marginVertical: 16 }}>{q.stem}</ThemeText>
        {q.options.map((opt: string, i: number) => (
          <TouchableOpacity key={i} style={[styles.opt, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => onSelect(opt)} disabled={answered}>
            <ThemeText>{opt}</ThemeText>
          </TouchableOpacity>
        ))}
        {answered && <Button title={idx + 1 < questions.length ? 'Next' : 'Claim reward'} onPress={onNext} style={{ marginTop: 16 }} />}
      </View>
    </Screen>
  );
}
const styles = StyleSheet.create({ opt: { borderRadius: 12, borderWidth: 1, padding: 16, marginBottom: 10 } });

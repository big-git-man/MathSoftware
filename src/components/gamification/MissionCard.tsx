import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { useTheme } from '../../theme';
import { ThemeText } from '../ui/Text';
import { ProgressBar } from '../ui/ProgressBar';
import { Check } from 'lucide-react-native';

export type Mission = {
  id: string;
  code: string;
  name: string;
  description: string;
  xpReward: number;
  progress: number;
  target: number;
  status: 'active' | 'completed';
};

export type MissionCardProps = {
  mission: Mission;
  onPress?: () => void;
  style?: ViewStyle;
};

export function MissionCard({ mission, onPress, style }: MissionCardProps) {
  const colors = useTheme();
  const done = mission.status === 'completed' || mission.progress >= mission.target;
  const progress = mission.target > 0 ? mission.progress / mission.target : 0;
  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }, style]}>
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <ThemeText variant="subtitle">{mission.name}</ThemeText>
          <ThemeText variant="caption" style={{ color: colors.textSecondary }}>{mission.description}</ThemeText>
          <ProgressBar progress={progress} height={6} style={{ marginTop: 8 }} />
          <View style={styles.meta}>
            <Text style={[styles.xp, { color: colors.gold }]}>+{mission.xpReward} XP</Text>
            <Text style={[styles.count, { color: colors.textSecondary }]}>{mission.progress}/{mission.target}</Text>
          </View>
        </View>
        {done ? <Check size={22} color={colors.success} /> : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  meta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  xp: { fontSize: 13, fontWeight: '700' },
  count: { fontSize: 12 },
});

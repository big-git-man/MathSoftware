import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../theme';
import { ThemeText } from '../ui/Text';
import { ProgressBar } from '../ui/ProgressBar';
import { Lock } from 'lucide-react-native';

export type AchievementCardProps = {
  code: string;
  name: string;
  description?: string;
  icon?: string;
  xpReward?: number;
  unlocked?: boolean;
  unlockedAt?: string | null;
  onPress?: () => void;
  style?: ViewStyle;
};

export function AchievementCard({
  code, name, description, icon, xpReward, unlocked, unlockedAt, onPress, style,
}: AchievementCardProps) {
  const colors = useTheme();
  const IconFallback = Lock;
  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, opacity: unlocked ? 1 : 0.55 }, style]}>
      <View style={styles.inner}>
        <View style={[styles.icon, { backgroundColor: unlocked ? colors.goldSoft : colors.cardAlt }]}>
          {icon ? <Text style={{ fontSize: 22 }}>{icon}</Text> : <Lock size={22} color={colors.textSecondary} />}
        </View>
        <View style={{ flex: 1 }}>
          <ThemeText variant="subtitle">{name}</ThemeText>
          {description ? <ThemeText variant="caption" style={{ color: colors.textSecondary }}>{description}</ThemeText> : null}
          {xpReward ? <Text style={{ color: colors.gold, fontWeight: '700', marginTop: 2 }}>+{xpReward} XP</Text> : null}
          {unlocked && unlockedAt ? <ThemeText variant="caption" style={{ color: colors.textSecondary, marginTop: 2 }}>Unlocked {new Date(unlockedAt).toLocaleDateString()}</ThemeText> : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 14, borderWidth: 1, padding: 12, marginBottom: 10 },
  inner: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});

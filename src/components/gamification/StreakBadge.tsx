import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Flame } from 'lucide-react-native';
import { useTheme } from '../../theme';

export type StreakBadgeProps = { days: number; size?: 'sm' | 'md'; style?: ViewStyle };

export function StreakBadge({ days, size = 'md', style }: StreakBadgeProps) {
  const colors = useTheme();
  const iconSize = size === 'sm' ? 14 : 18;
  return (
    <View style={[styles.wrap, { backgroundColor: colors.goldSoft, borderColor: colors.gold }, style]}>
      <Flame size={iconSize} color={colors.gold} />
      <Text style={[styles.text, { fontSize: size === 'sm' ? 12 : 14, color: colors.gold }]}>{days} DAY</Text>
      {days !== 1 ? <Text style={[styles.text, { fontSize: size === 'sm' ? 12 : 14, color: colors.gold }]}>STREAK</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1 },
  text: { fontWeight: '700' },
});

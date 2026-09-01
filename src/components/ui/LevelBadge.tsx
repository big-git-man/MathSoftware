import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../theme';

export type LevelBadgeProps = {
  level: number;
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
};

export function LevelBadge({ level, size = 'md', style }: LevelBadgeProps) {
  const colors = useTheme();
  const cfg = size === 'sm' ? styles.sm : size === 'lg' ? styles.lg : styles.md;
  return (
    <View
      style={[
        cfg.badge,
        { backgroundColor: colors.primarySoft, borderColor: colors.primary },
        style,
      ]}
    >
      <Text style={cfg.text}>Lv. {level}</Text>
    </View>
  );
}

const base = { borderRadius: 999, borderWidth: 1.5, fontWeight: '700' } as const;
const styles = StyleSheet.create({
  sm: { badge: { ...base, paddingHorizontal: 8, paddingVertical: 2 }, text: { color: '#2563eb', fontSize: 12 } },
  md: { badge: { ...base, paddingHorizontal: 12, paddingVertical: 4 }, text: { color: '#2563eb', fontSize: 14 } },
  lg: { badge: { ...base, paddingHorizontal: 16, paddingVertical: 6 }, text: { color: '#2563eb', fontSize: 16 } },
});

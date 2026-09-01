import { Text, View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../theme';
import { ThemeText } from './Text';

export type BadgeProps = {
  label: string;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'neutral';
  style?: ViewStyle;
};

export function Badge({ label, variant = 'default', style }: BadgeProps) {
  const colors = useTheme();
  const cfg: Record<string, { bg: string; fg: string }> = {
    default: { bg: colors.primarySoft, fg: colors.primary },
    success: { bg: colors.successSoft, fg: colors.success },
    warning: { bg: colors.warningSoft, fg: colors.warning },
    danger: { bg: colors.dangerSoft, fg: colors.danger },
    neutral: { bg: colors.cardAlt, fg: colors.textSecondary },
  };
  const c = cfg[variant] ?? cfg.default;
  return (
    <View style={[styles.badge, { backgroundColor: c.bg }, style]}>
      <Text style={[styles.label, { color: c.fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  label: { fontSize: 11, fontWeight: '700' },
});

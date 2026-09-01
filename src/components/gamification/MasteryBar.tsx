import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../theme';
import { ThemeText } from '../ui/Text';
import { ProgressBar } from '../ui/ProgressBar';

export type MasteryBarProps = {
  name: string;
  mastery: number;          // 0..100
  color?: string;
  onPress?: () => void;
  style?: ViewStyle;
};

export function MasteryBar({ name, mastery, color, onPress, style }: MasteryBarProps) {
  const colors = useTheme();
  const pct = Math.round(mastery);
  const barColor = color
    ? color
    : pct >= 80 ? colors.success
    : pct >= 50 ? colors.warning
    : colors.danger;
  return (
    <View style={[styles.wrap, style]}>
      <View style={styles.head}>
        <ThemeText variant="body">{name}</ThemeText>
        <Text style={{ color: colors.textSecondary, fontWeight: '600' }}>{pct}%</Text>
      </View>
      <ProgressBar progress={mastery / 100} color={barColor} height={8} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 12 },
  head: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
});

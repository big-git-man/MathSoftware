import { View, StyleSheet, ViewStyle, Animated } from 'react-native';
import { useTheme } from '../../theme';

export type ProgressBarProps = {
  progress: number; // 0..1
  height?: number;
  color?: string;
  trackColor?: string;
  animated?: boolean;
  style?: ViewStyle;
  label?: string;
  labelRight?: string;
};

export function ProgressBar({
  progress, height = 10, color, trackColor, animated = true, style, label, labelRight,
}: ProgressBarProps) {
  const colors = useTheme();
  const fill = color ?? colors.primary;
  const track = trackColor ?? colors.borderAlt;
  const safe = Math.max(0, Math.min(1, progress));
  const anim = new Animated.Value(safe);
  if (animated) anim.setValue(safe);
  return (
    <View style={[styles.row, style]}>
      {label ? <View style={{ flex: 1 }}><View style={styles.barBg}><View style={[styles.barFill, { width: `${safe * 100}%`, backgroundColor: fill, height }]} /></View></View> : (
        <View style={styles.barBg}>
          <Animated.View style={[styles.barFill, { width: `${safe * 100}%`, backgroundColor: fill, height }]} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  barBg: {
    flex: 1,
    backgroundColor: '#e2e8f0',
    borderRadius: 999,
    overflow: 'hidden',
  },
  barFill: {
    height: 10,
    borderRadius: 999,
    backgroundColor: '#2563eb',
  },
});

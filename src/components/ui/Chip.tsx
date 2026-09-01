import { TouchableOpacity, StyleSheet, ViewStyle, GestureResponderEvent } from 'react-native';
import { useTheme } from '../../theme';
import { ThemeText } from './Text';

export type ChipProps = {
  label: string;
  selected?: boolean;
  onPress?: (e: GestureResponderEvent) => void;
  style?: ViewStyle;
};

export function Chip({ label, selected, onPress, style }: ChipProps) {
  const colors = useTheme();
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? colors.primary : colors.cardAlt,
          borderColor: selected ? colors.primary : colors.border,
        },
        style,
      ]}
    >
      <ThemeText variant="caption" style={{ color: selected ? '#fff' : colors.text }}>
        {label}
      </ThemeText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
});

import { TouchableOpacity, StyleSheet, GestureResponderEvent, ViewStyle } from 'react-native';
import { useTheme } from '../../theme';

export type IconButtonProps = {
  icon: React.ReactNode;
  onPress?: (e: GestureResponderEvent) => void;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'ghost' | 'outline';
  disabled?: boolean;
  style?: ViewStyle;
};

export function IconButton({ icon, onPress, size = 'md', variant = 'default', disabled, style }: IconButtonProps) {
  const colors = useTheme();
  const pad = size === 'sm' ? 6 : size === 'lg' ? 14 : 10;
  const bg =
    variant === 'ghost' ? 'transparent'
    : variant === 'outline' ? 'transparent'
    : colors.cardAlt;
  const border = variant === 'outline' ? colors.border : 'transparent';
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      disabled={disabled}
      style={[styles.btn, { padding: pad, backgroundColor: bg, borderColor: border }, style]}
    >
      {icon}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    borderWidth: 1,
  },
});

import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  GestureResponderEvent,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../../theme';
import { ThemeText } from './Text';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';

export type ButtonProps = {
  title: string;
  onPress?: (e: GestureResponderEvent) => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  fullWidth?: boolean;
};

export function Button({
  title, onPress, variant = 'primary', disabled, loading, icon, style, fullWidth,
}: ButtonProps) {
  const colors = useTheme();
  const isDisabled = disabled || loading;
  const bg =
    variant === 'primary'
      ? isDisabled ? colors.textTertiary : colors.primary
      : variant === 'secondary'
      ? colors.cardAlt
      : variant === 'danger'
      ? colors.dangerSoft
      : 'transparent';
  const textColor =
    variant === 'primary'
      ? '#ffffff'
      : variant === 'danger'
      ? colors.danger
      : colors.text;
  const borderColor =
    variant === 'outline' || variant === 'secondary'
      ? colors.border
      : variant === 'ghost'
      ? 'transparent'
      : 'transparent';

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={isDisabled}
      style={[
        styles.btn,
        { backgroundColor: bg, borderColor, opacity: isDisabled ? 0.6 : 1 },
        fullWidth && { alignSelf: 'stretch' },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <>
          {icon ? <>{icon}{' '}</> : null}
          <ThemeText variant="button" style={{ color: textColor }}>
            {title}
          </ThemeText>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
  },
});

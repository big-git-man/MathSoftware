import { Text as RNText, TextProps, StyleSheet, TextStyle } from 'react-native';
import { useTheme } from '../../theme';

export type TextVariant = 'h1' | 'h2' | 'h3' | 'title' | 'subtitle' | 'body' | 'caption' | 'overline' | 'button';

export type ThemeTextProps = TextProps & { variant?: TextVariant; strong?: boolean };

export function ThemeText({ variant = 'body', strong, style, children, ...rest }: ThemeTextProps) {
  const colors = useTheme();
  const base: TextStyle = { color: colors.text };
  const variantStyle = styles[variant];
  const combined: TextStyle = { ...base, ...variantStyle, ...(strong ? { fontWeight: '700' } : {}) };
  return (
    <RNText style={[combined, style]} {...rest}>
      {children}
    </RNText>
  );
}

const styles = StyleSheet.create<Record<TextVariant, TextStyle>>({
  h1: { fontSize: 32, fontWeight: '700', lineHeight: 38 },
  h2: { fontSize: 26, fontWeight: '700', lineHeight: 32 },
  h3: { fontSize: 20, fontWeight: '600', lineHeight: 26 },
  title: { fontSize: 22, fontWeight: '600', lineHeight: 28 },
  subtitle: { fontSize: 16, fontWeight: '600', lineHeight: 22 },
  body: { fontSize: 16, lineHeight: 22 },
  caption: { fontSize: 13, lineHeight: 18 },
  overline: { fontSize: 11, fontWeight: '700', letterSpacing: 1, lineHeight: 14, textTransform: 'uppercase' },
  button: { fontSize: 15, fontWeight: '700', lineHeight: 20 },
});

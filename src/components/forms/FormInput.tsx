import { View, TextInput, StyleSheet, TextInputProps, Platform } from 'react-native';
import { useTheme } from '../theme';
import { ThemeText } from '../ui/Text';

export type FormInputProps = TextInputProps & {
  label?: string;
  error?: string;
};

export function FormInput({ label, error, ...rest }: FormInputProps) {
  const colors = useTheme();
  return (
    <View style={{ marginBottom: 16 }}>
      {label ? <ThemeText variant="caption" style={{ marginBottom: 6, color: colors.textSecondary }}>{label}</ThemeText> : null}
      <TextInput
        placeholderTextColor={colors.textTertiary}
        style={[
          styles.input,
          {
            backgroundColor: colors.card,
            borderColor: error ? '#ef4444' : colors.border,
            color: colors.text,
          },
        ]}
        {...rest}
      />
      {error ? <ThemeText variant="caption" style={{ color: '#ef4444', marginTop: 4 }}>{error}</ThemeText> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    paddingHorizontal: 16,
    paddingVertical: Platform.select({ ios: 14, android: 12 }) as number,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 16,
  },
});

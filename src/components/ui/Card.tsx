import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../theme';

export type CardProps = {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: number;
  elevated?: boolean;
};

export function Card({ children, style, padding = 16, elevated }: CardProps) {
  const colors = useTheme();
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: elevated ? colors.primarySoft : colors.card,
          borderColor: colors.border,
          padding,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
  },
});

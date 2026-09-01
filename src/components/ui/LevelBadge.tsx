import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../theme';

export type LevelBadgeProps = {
  level: number;
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
};

export function LevelBadge({ level, size = 'md', style }: LevelBadgeProps) {
  const colors = useTheme();
  const padding = size === 'sm' ? [8, 2] : size === 'lg' ? [16, 6] : [12, 4];
  const fontSize = size === 'sm' ? 12 : size === 'lg' ? 16 : 14;
  return (
    <View
      style={[
        { borderRadius: 999, borderWidth: 1.5, paddingHorizontal: padding[0], paddingVertical: padding[1], backgroundColor: colors.primarySoft, borderColor: colors.primary },
        style,
      ]}
    >
      <Text style={{ color: '#2563eb', fontSize, fontWeight: '700' }}>Lv. {level}</Text>
    </View>
  );
}

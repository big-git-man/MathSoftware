import { View, Image, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';
import { ThemeText } from './Text';

export type AvatarProps = {
  source?: { uri: string } | number;
  name?: string;
  size?: number;
};

export function Avatar({ source, name, size = 40 }: AvatarProps) {
  const colors = useTheme();
  const initials = (name ?? '')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  return source ? (
    <Image source={source} style={[styles.img, { width: size, height: size, borderRadius: size / 2 }]} />
  ) : (
    <View
      style={[
        styles.placeholder,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: colors.primarySoft },
      ]}
    >
      <ThemeText variant="subtitle">{initials}</ThemeText>
    </View>
  );
}

const styles = StyleSheet.create({
  img: { resizeMode: 'cover' },
  placeholder: { alignItems: 'center', justifyContent: 'center' },
});

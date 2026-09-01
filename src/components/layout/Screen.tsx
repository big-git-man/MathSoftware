import { ScrollView, StyleSheet, ViewStyle, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';

export type ScreenProps = {
  children: React.ReactNode;
  scrollable?: boolean;
  style?: ViewStyle;
  bg?: 'background' | 'surface';
};

export function Screen({ children, scrollable, style, bg = 'background' }: ScreenProps) {
  const colors = useTheme();
  const bgHex = bg === 'surface' ? colors.card : colors.background;
  const Container: any = scrollable ? ScrollView : require('react-native').View;
  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: bgHex }, style]} edges={['top', 'bottom'] as any}>
      <StatusBar barStyle={bgHex === '#0f172a' ? 'light-content' : 'dark-content'} />
      <Container style={[styles.inner, { backgroundColor: bgHex }]}>{children}</Container>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  inner: { flex: 1 },
});

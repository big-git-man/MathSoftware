import { Image, View, TouchableOpacity, Linking, StyleSheet } from 'react-native';
import { useTheme } from '@/theme';
import { ThemeText } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';

export type DocumentViewerProps = {
  uri: string | null;
  type: 'pdf' | 'image';
  style?: any;
  onOpenPress?: (uri: string) => void;
};

export function DocumentViewer({ uri, type, style, onOpenPress }: DocumentViewerProps) {
  const colors = useTheme();
  if (!uri) {
    return (
      <View style={[styles.center, style, { backgroundColor: colors.card }]}>
        <ThemeText style={{ color: colors.textSecondary }}>No preview available.</ThemeText>
      </View>
    );
  }
  if (type === 'image') {
    return <Image source={{ uri }} style={[styles.image, style]} resizeMode="contain" />;
  }
  const open = () => {
    if (onOpenPress) onOpenPress(uri);
    else Linking.openURL(uri).catch(() => {});
  };
  return (
    <View style={[styles.center, style]}>
      <Button title="Open PDF" onPress={open} />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  image: { width: '100%', height: '100%', resizeMode: 'contain' },
});

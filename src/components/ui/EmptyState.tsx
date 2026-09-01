import { View, StyleSheet, GestureResponderEvent } from 'react-native';
import { ThemeText } from './Text';
import { Button } from './Button';
import { useTheme } from '../../theme';

export type EmptyStateProps = {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: (e: GestureResponderEvent) => void;
};

export function EmptyState({ title, description, icon, actionLabel, onAction }: EmptyStateProps) {
  const colors = useTheme();
  return (
    <View style={styles.container}>
      {icon ? <View style={{ marginBottom: 16 }}>{icon}</View> : null}
      <ThemeText variant="h3" style={{ marginBottom: 8, textAlign: 'center' }}>
        {title}
      </ThemeText>
      {description ? (
        <ThemeText variant="body" style={{ color: colors.textSecondary, marginBottom: 24, textAlign: 'center' }}>
          {description}
        </ThemeText>
      ) : null}
      {actionLabel ? <Button title={actionLabel} onPress={onAction} fullWidth /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
});

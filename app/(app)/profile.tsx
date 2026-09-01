import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/theme';
import { ThemeText } from '../../src/components/ui/Text';
import { Screen } from '../../src/components/layout/Screen';
import { Button } from '../../src/components/ui/Button';
import { LevelBadge } from '../../src/components/ui/LevelBadge';
import { useAuth } from '../../src/store/authStore';
import { useDashboard } from '../../src/hooks/useDashboard';

export default function ProfileScreen() {
  const colors = useTheme();
  const router = useRouter();
  const user = useAuth((s) => s.user);
  const { data: dash } = useDashboard();

  const onSignOut = async () => {
    await useAuth.getState().signOut();
    router.replace('/(auth)/login');
  };

  return (
    <Screen bg="background">
      <View style={{ flex: 1, padding: 16 }}>
        <ThemeText variant="h3">Profile</ThemeText>
        {user && <ThemeText style={{ marginTop: 8, color: colors.textSecondary }}>{user.email}</ThemeText>}
        {dash?.level ? (
          <View style={{ marginTop: 24, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <LevelBadge level={dash.level.level} />
            <ThemeText>{dash.level.level} · {dash.level.xpIntoLevel.toLocaleString()} / {dash.level.xpForNext.toLocaleString()} XP</ThemeText>
          </View>
        ) : null}
        <Button title="Sign out" variant="secondary" onPress={onSignOut} style={{ marginTop: 32 }} />
      </View>
    </Screen>
  );
}

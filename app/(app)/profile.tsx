import { View, StyleSheet, Switch, Pressable } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/theme';
import { ThemeText } from '../../src/components/ui/Text';
import { Screen } from '../../src/components/layout/Screen';
import { Button } from '../../src/components/ui/Button';
import { LevelBadge } from '../../src/components/ui/LevelBadge';
import { useAuth } from '../../src/store/authStore';
import { useDashboard } from '../../src/hooks/useDashboard';
import { useDailyNotifications } from '../../src/hooks/useNotifications';
import { useUIStore, ThemeOverride } from '../../src/store/uiStore';

export default function ProfileScreen() {
  const colors = useTheme();
  const router = useRouter();
  const user = useAuth((s) => s.user);
  const { data: dash } = useDashboard();
  const [notifEnabled, setNotifEnabled] = useState(false);
  const themeOverride = useUIStore((s) => s.themeOverride);
  const setThemeOverride = useUIStore((s) => s.setThemeOverride);
  useDailyNotifications(notifEnabled);

  const onSignOut = async () => {
    await useAuth.getState().signOut();
    router.replace('/(auth)/login');
  };

  const setTheme = (value: ThemeOverride) => setThemeOverride(value);

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

        <View style={{ marginTop: 32 }}>
          <ThemeText variant="subtitle" style={{ marginBottom: 10 }}>Appearance</ThemeText>
          <View style={styles.themeRow}>
            {([['auto', null], ['light', 'light'], ['dark', 'dark']] as const).map(([label, value]) => {
              const active = themeOverride === value;
              return (
                <Pressable
                  key={label}
                  onPress={() => setTheme(value)}
                  style={[styles.themeChoice, { backgroundColor: active ? colors.primarySoft : colors.card, borderColor: active ? colors.primary : colors.border }]}
                >
                  <ThemeText>{label[0].toUpperCase() + label.slice(1)}</ThemeText>
                </Pressable>
              );
            })}
          </View>

          <View style={{ marginTop: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <ThemeText variant="body">Daily reminder @ 6pm</ThemeText>
            <Switch value={notifEnabled} onValueChange={setNotifEnabled} />
          </View>
          <Button title="Sign out" variant="secondary" onPress={onSignOut} />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  themeRow: { flexDirection: 'row', gap: 8 },
  themeChoice: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 10, borderWidth: 1 },
});

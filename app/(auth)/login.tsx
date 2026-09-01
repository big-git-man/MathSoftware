import { View, StyleSheet, Keyboard } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../../src/store/authStore';
import { useTheme, useIsDark } from '../../src/theme';
import { ThemeText } from '../../src/components/ui/Text';
import { Button } from '../../src/components/ui/Button';
import { FormInput } from '../../src/components/forms/FormInput';

export default function LoginScreen() {
  const router = useRouter();
  const colors = useTheme();
  const isDark = useIsDark();
  const { signIn, error, clearError, loading } = useAuth((s) => ({
    signIn: s.signIn,
    error: s.error,
    clearError: s.clearError,
    loading: s.loading,
  }));

  const emailRef = { value: '' };
  const passRef = { value: '' };

  const onSignIn = async () => {
    Keyboard.dismiss();
    const res = await signIn(emailRef.value, passRef.value);
    if (!res.error) router.replace('/(app)' as any);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={styles.card}>
        <ThemeText variant="h2" style={{ marginBottom: 8, textAlign: 'center' }}>Welcome back</ThemeText>
        <ThemeText variant="body" style={{ color: colors.textSecondary, marginBottom: 24, textAlign: 'center' }}>
          Sign in to continue your Maths journey.
        </ThemeText>
        <FormInput
          label="Email"
          placeholder="you@example.com"
          autoCapitalize="none"
          keyboardType="email-address"
          onChangeText={(t) => (emailRef.value = t)}
          error={error?.message}
        />
        <FormInput label="Password" placeholder="••••••••" secureTextEntry onChangeText={(t) => (passRef.value = t)} />
        <Button title={loading ? 'Signing in…' : 'Sign In'} onPress={onSignIn} fullWidth disabled={loading} />
        <Link href="/(auth)/register" style={{ marginTop: 18 }}>
          <ThemeText style={{ color: colors.primary, textAlign: 'center' }}>Don’t have an account? Create one</ThemeText>
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24 },
  card: { padding: 8 },
});

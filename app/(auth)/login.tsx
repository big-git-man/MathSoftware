import { View, StyleSheet, Keyboard, Platform } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { useAuth } from '../../src/store/authStore';
import { useTheme } from '../../src/theme';
import { ThemeText } from '../../src/components/ui/Text';
import { Button } from '../../src/components/ui/Button';
import { FormInput } from '../../src/components/forms/FormInput';
import { StatusBar } from 'expo-status-bar';

export default function LoginScreen() {
  const router = useRouter();
  const colors = useTheme();
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
    const res = await signIn({ email: emailRef.value, password: passRef.value });
    if (!res.error) router.replace('/(app)');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={colors.background === '#0f172a' ? 'light' : 'dark'} />
      <View style={styles.card}>
        <ThemeText variant="h1" style={{ marginBottom: 8, textAlign: 'center' }}>Welcome back</ThemeText>
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
        <FormInput
          label="Password"
          placeholder="••••••••"
          secureTextEntry
          onChangeText={(t) => (passRef.value = t)}
        />
        <Button title={loading ? 'Signing in…' : 'Sign In'} onPress={onSignIn} fullWidth disabled={loading} />
        <Link href="/(auth)/register" style={{ marginTop: 18, textAlign: 'center' }}>
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

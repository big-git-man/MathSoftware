import { View, StyleSheet, Keyboard, Alert } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { useAuth } from '../../src/store/authStore';
import { useTheme } from '../../src/theme';
import { ThemeText } from '../../src/components/ui/Text';
import { Button } from '../../src/components/ui/Button';
import { FormInput } from '../../src/components/forms/FormInput';
import { StatusBar } from 'expo-status-bar';

export default function RegisterScreen() {
  const router = useRouter();
  const colors = useTheme();
  const { signUp, error, clearError, loading } = useAuth((s) => ({
    signUp: s.signUp,
    error: s.error,
    clearError: s.clearError,
    loading: s.loading,
  }));

  const emailRef = { value: '' };
  const passRef = { value: '' };
  const confirmRef = { value: '' };

  const onCreate = async () => {
    Keyboard.dismiss();
    clearError();
    if (passRef.value.length < 6) {
      Alert.alert('Password too short', 'Use at least 6 characters.');
      return;
    }
    if (passRef.value !== confirmRef.value) {
      Alert.alert('Passwords do not match', 'Please try again.');
      return;
    }
    const res = await signUp({ email: emailRef.value, password: passRef.value });
    if (res.error) {
      if (String(res.error?.__raw?.message ?? '').includes('registration')) {
        Alert.alert('Registration is closed', 'This application is for a single student account.');
      }
      return;
    }
    if (res.needsEmailConfirmation) {
      Alert.alert('Check your email', 'A confirmation link has been sent.');
    } else {
      router.replace('/(app)');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={colors.background === '#0f172a' ? 'light' : 'dark'} />
      <View style={styles.card}>
        <ThemeText variant="h1" style={{ marginBottom: 8, textAlign: 'center' }}>Create your account</ThemeText>
        <ThemeText variant="body" style={{ color: colors.textSecondary, marginBottom: 24, textAlign: 'center' }}>
          This is a private study space for one student.
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
        <FormInput label="Confirm password" placeholder="••••••••" secureTextEntry onChangeText={(t) => (confirmRef.value = t)} />
        <Button title={loading ? 'Creating account…' : 'Create account'} onPress={onCreate} fullWidth disabled={loading} />
        <Link href="/(auth)/login" style={{ marginTop: 18 }}>
          <ThemeText style={{ color: colors.primary, textAlign: 'center' }}>Already have an account? Sign in</ThemeText>
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24 },
  card: { padding: 8 },
});

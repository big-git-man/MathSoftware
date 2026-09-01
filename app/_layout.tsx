import { useEffect } from 'react';
import { Slot } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '../src/theme';
import { useAuth } from '../src/store/authStore';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const initialized = useAuth((s) => s.initialized);

  useEffect(() => {
    let unsub: (() => void) | undefined;
    void useAuth.getState().initialize().then((u) => {
      unsub = u;
    });
    return () => {
      if (unsub) unsub();
    };
  }, []);

  useEffect(() => {
    if (initialized) {
      void SplashScreen.hideAsync();
    }
  }, [initialized]);

  if (!initialized) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <Slot />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

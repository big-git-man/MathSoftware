import { useEffect } from 'react';
import { Slot } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '../src/theme';
import { useAuthStore } from '../src/store/authStore';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const initialized = useAuthStore((s) => s.initialized);

  useEffect(() => {
    let unsub: (() => void) | undefined;
    void useAuthStore.getState().initialize().then((u) => {
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

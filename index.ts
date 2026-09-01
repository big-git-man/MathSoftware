import { registerRootComponent } from 'expo';
import { ExpoRoot } from 'expo-router';

// Must be exported as default
export default function Root() {
  const ctx = ExpoRoot(require.context('./app'));
  return ctx;
}

registerRootComponent(Root);

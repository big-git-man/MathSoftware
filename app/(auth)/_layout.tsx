import { Redirect, Slot } from 'expo-router';
import { useUser } from '../../src/hooks/useAuth';

export default function AuthLayout() {
  const user = useUser();
  if (user) {
    return <Redirect href="/(app)" />;
  }
  return <Slot />;
}

import { Stack } from 'expo-router';
export default function UploadLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#ffffff' },
        headerTitleStyle: { color: '#111827', fontWeight: '600' },
        headerBackTitle: 'Back',
        headerTintColor: '#2563eb',
        presentation: 'modal',
      }}
    />
  );
}

import 'dotenv/config';

export default ({ config }: { config: Record<string, any> }) => ({
  ...config,
  name: 'MathsTutor',
  slug: 'mathstutor',
  description:
    'Private mathematics study companion: gamified progression, AI tutor, personal academic library.',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff',
  },
  scheme: 'mathstutor',
  assetBundlePatterns: ['**/*'],
  ios: {
    bundleIdentifier: 'com.mathstutor',
    supportsTablet: true,
  },
  android: {
    package: 'com.mathstutor',
    adaptiveIcon: {
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundColor: '#1e3a8a',
    },
    permissions: ['camera', 'photo'],
  },
  plugins: [
    'expo-router',
    'expo-document-picker',
    [
      'expo-notifications',
      { icon: './assets/icon.png', color: '#ffffff' },
    ],
    'expo-image-manipulator',
  ],
  extra: {
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
    API_BASE_URL: process.env.API_BASE_URL ?? '',
  },
});

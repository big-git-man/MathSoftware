import 'dotenv/config';

export default ({ config }: { config: Record<string, any> }) => ({
  ...config,
  name: 'MathsTutor',
  slug: 'mathstutor',
  description: 'Private mathematics study companion: gamified progression, AI tutor, and personal academic library.',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  splash: { image: './assets/splash-icon.png', resizeMode: 'contain', backgroundColor: '#ffffff' },
  scheme: 'mathstutor',
  assetBundlePatterns: ['**/*'],
  ios: {
    bundleIdentifier: 'com.mathstutor',
    supportsTablet: true,
    infoPlist: {
      NSCameraUsageDescription: 'MathsTutor uses the camera to scan homework and classwork.',
      NSPhotoLibraryUsageDescription: 'MathsTutor uses your photo library to import homework and classwork.',
      NSPhotoLibraryAddUsageDescription: 'MathsTutor may save captured study images to your photo library.',
    },
  },
  android: {
    package: 'com.mathstutor',
    adaptiveIcon: {
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundColor: '#1e3a8a',
    },
    permissions: ['CAMERA', 'READ_MEDIA_IMAGES'],
  },
  plugins: [
    'expo-router',
    'expo-document-picker',
    ['expo-notifications', { icon: './assets/icon.png', color: '#ffffff' }],
    'expo-image-manipulator',
  ],
  extra: {
    SUPABASE_URL: process.env.SUPABASE_URL ?? '',
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ?? '',
    API_BASE_URL: process.env.API_BASE_URL ?? '',
  },
});

import { View, StyleSheet, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ThemeText } from '../../src/components/ui/Text';
import { Screen } from '../../src/components/layout/Screen';
import { Button } from '../../src/components/ui/Button';
import { Camera, Image, FileText } from 'lucide-react-native';
import { useUploadStore } from '../../src/store/uploadStore';
import { takePhoto, pickImages, pickDocuments } from '../../src/services/picker';

export default function UploadOptionsScreen() {
  const router = useRouter();
  const addFiles = useUploadStore((s) => s.addFiles);
  const addFile = useUploadStore((s) => s.addFile);

  const onCamera = async () => {
    const photo = await takePhoto();
    if (photo) {
      addFile({ ...photo, id: photo.fileName ?? 'cam', local: true });
      router.push('/(upload)/camera');
    } else {
      Alert.alert('Camera unavailable', 'Please allow camera permission.');
    }
  };

  const onPhotos = async () => {
    const files = await pickImages();
    if (files.length) {
      addFiles(files.map((f) => ({ ...f, id: f.fileName ?? '', local: true })));
      router.push('/(upload)/confirm');
    } else {
      Alert.alert('No photos selected');
    }
  };

  const onDocuments = async () => {
    const files = await pickDocuments();
    if (files.length) {
      addFiles(files.map((f) => ({ ...f, id: f.fileName ?? '', local: true })));
      router.push('/(upload)/confirm');
    } else {
      Alert.alert('No files selected');
    }
  };

  return (
    <Screen bg="background">
      <Stack.Screen name="index" options={{ title: 'Upload' }} />
      <View style={styles.container}>
        <ThemeText variant="h3" style={{ marginBottom: 24, textAlign: 'center' }}>
          Add work to your library
        </ThemeText>
        <Button
          title="Take a photo"
          onPress={onCamera}
          fullWidth
          icon={<Camera size={20} color="#fff" />}
          style={{ marginBottom: 12 }}
        />
        <Button
          title="Choose from photos"
          onPress={onPhotos}
          fullWidth
          variant="secondary"
          icon={<Image size={20} color="#fff" />}
          style={{ marginBottom: 12 }}
        />
        <Button
          title="Choose PDF / documents"
          onPress={onDocuments}
          fullWidth
          variant="secondary"
          icon={<FileText size={20} color="#fff" />}
          style={{ marginBottom: 12 }}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center' },
});

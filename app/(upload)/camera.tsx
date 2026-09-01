import { View, FlatList, Image, Alert, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemeText } from '../../src/components/ui/Text';
import { Screen } from '../../src/components/layout/Screen';
import { Button } from '../../src/components/ui/Button';
import { Camera } from 'lucide-react-native';
import { takePhoto } from '../../src/services/picker';
import { useUploadStore } from '../../src/store/uploadStore';

export default function CameraCaptureScreen() {
  const router = useRouter();
  const files = useUploadStore((s) => s.files);
  const addFile = useUploadStore((s) => s.addFile);

  const onCapture = async () => {
    const photo = await takePhoto();
    if (photo) {
      addFile({ ...photo, id: photo.fileName ?? `cam-${Date.now()}`, local: true });
    } else {
      Alert.alert('Camera unavailable');
    }
  };

  const onDone = () => {
    if (files.length === 0) return Alert.alert('No photos', 'Capture at least one photo.');
    router.push('/(upload)/confirm');
  };

  return (
    <Screen bg="background">
      <View style={{ flex: 1, padding: 16 }}>
        <ThemeText variant="h3" style={{ marginBottom: 16 }}>
          Captured pages ({files.length})
        </ThemeText>
        <FlatList
          data={files}
          keyExtractor={(item) => item.id}
          numColumns={3}
          columnWrapperStyle={{ gap: 10 }}
          contentContainerStyle={{ gap: 10 }}
          renderItem={({ item }) => <Image source={{ uri: item.uri }} style={styles.thumb} />}
        />
        <View style={{ marginTop: 16, gap: 12 }}>
          <Button title="Capture another page" onPress={onCapture} fullWidth icon={<Camera size={20} color="#fff" />} />
          <Button title="Done" variant="secondary" onPress={onDone} fullWidth />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  thumb: { width: 96, height: 96, borderRadius: 8, resizeMode: 'cover' },
});

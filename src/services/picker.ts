import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import type { UploadableFile } from './upload';

export async function takePhoto(): Promise<UploadableFile | null> {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== 'granted') return null;
  const res = await ImagePicker.launchCameraAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.9,
  });
  if (res.canceled || !res.assets?.length) return null;
  const a = res.assets[0];
  return {
    uri: a.uri,
    mimeType: a.mimeType ?? (a.uri.toLowerCase().endsWith('.heic') ? 'image/heic' : 'image/jpeg'),
    fileName: a.fileName ?? undefined,
    width: a.width,
    height: a.height,
  };
}

export async function pickImages(): Promise<UploadableFile[]> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') return [];
  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsMultipleSelection: true,
    quality: 0.9,
  });
  if (res.canceled || !res.assets) return [];
  return res.assets.map((a) => ({
    uri: a.uri,
    mimeType: a.mimeType ?? 'image/jpeg',
    fileName: a.fileName ?? undefined,
    width: a.width,
    height: a.height,
  }));
}

export async function pickDocuments(): Promise<UploadableFile[]> {
  const res = await DocumentPicker.getDocumentAsync({ multiple: true, type: '*/*' });
  if (res.canceled || !res.assets) return [];
  return res.assets.map((a) => ({
    uri: a.uri,
    mimeType: a.mimeType ?? 'application/octet-stream',
    fileName: a.name,
    size: a.size,
  }));
}

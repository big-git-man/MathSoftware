import { useState } from 'react';
import { View, FlatList, Image, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/theme';
import { ThemeText } from '../../src/components/ui/Text';
import { Screen } from '../../src/components/layout/Screen';
import { Button } from '../../src/components/ui/Button';
import { Card, Chip } from '../../src/components/ui';
import { FormInput } from '../../src/components/forms/FormInput';
import { TopicPicker, TopicOption } from '../../src/components/curriculum/TopicPicker';
import { useUploadStore } from '../../src/store/uploadStore';
import { uploadDocuments, AssignmentType } from '../../src/services/upload';

const TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: 'homework', label: 'Homework' },
  { value: 'classwork', label: 'Classwork' },
  { value: 'worksheet', label: 'Worksheet' },
  { value: 'test', label: 'Test' },
  { value: 'exam', label: 'Exam' },
  { value: 'revision', label: 'Revision' },
  { value: 'notes', label: 'Notes' },
];

export default function UploadConfirmScreen() {
  const colors = useTheme();
  const router = useRouter();
  const { files, removeFile, clear } = useUploadStore();
  const [type, setType] = useState<string>('homework');
  const [name, setName] = useState('');
  const [topic, setTopic] = useState<TopicOption | null>(null);
  const [tagsText, setTagsText] = useState('');
  const [topicPickerVisible, setTopicPickerVisible] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: files.length });

  const tags = tagsText.split(',').map((t) => t.trim()).filter(Boolean);

  const onUpload = async () => {
    if (files.length === 0) return Alert.alert('No files', 'Add files before uploading.');
    setUploading(true);
    setProgress({ done: 0, total: files.length });
    try {
      const result = await uploadDocuments(files, {
        documentType: type as AssignmentType,
        assignmentName: name || undefined,
        topicId: topic?.id,
        tags,
        onProgress: (uploaded, total) => setProgress({ done: uploaded, total }),
      });
      if (result.documents.length > 0) {
        clear();
        router.replace('/(app)/library' as any);
      } else {
        Alert.alert('Nothing uploaded', 'All files failed to upload.');
      }
    } catch (e: any) {
      Alert.alert('Upload failed', e.message ?? 'Something went wrong.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Screen scrollable bg="background">
      <View style={{ padding: 16 }}>
        <ThemeText variant="h3">Review & upload</ThemeText>

        <View style={{ marginTop: 18 }}>
          <ThemeText variant="caption" style={{ color: colors.textSecondary, marginBottom: 6 }}>Type</ThemeText>
          <View style={styles.chips}>
            {TYPE_OPTIONS.map((t) => (
              <Chip key={t.value} label={t.label} selected={type === t.value} onPress={() => setType(t.value)} />
            ))}
          </View>
          <FormInput label="Assignment name" placeholder="e.g. Algebra Homework 3" value={name} onChangeText={setName} />
          <FormInput label="Tags (comma separated)" placeholder="fractions, algebra" value={tagsText} onChangeText={setTagsText} />
          <TouchableOpacity onPress={() => setTopicPickerVisible(true)} style={{ marginTop: 6 }}>
            <ThemeText style={{ color: topic ? colors.primary : colors.textSecondary }}>
              {topic ? `${topic.name}  ·  tap to change` : 'Select a topic (optional)'}
            </ThemeText>
          </TouchableOpacity>
        </View>

        <Card style={{ marginTop: 18, padding: 10 }}>
          <ThemeText variant="subtitle" style={{ marginBottom: 8 }}>Files ({files.length})</ThemeText>
          <FlatList
            data={files}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <View style={styles.fileRow}>
                <Image source={{ uri: item.uri }} style={styles.fileThumb} />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <ThemeText variant="subtitle" numberOfLines={1}>{item.fileName ?? 'Photo'}</ThemeText>
                  <ThemeText variant="caption" style={{ color: colors.textSecondary }}>
                    {Math.round((item.size ?? 0) / 1024)} KB
                  </ThemeText>
                </View>
                <TouchableOpacity onPress={() => removeFile(item.id)} hitSlop={16}>
                  <ThemeText style={{ color: '#ef4444', fontWeight: '700' }}>✕</ThemeText>
                </TouchableOpacity>
              </View>
            )}
          />
        </Card>

        {uploading && (
          <View style={{ marginTop: 16 }}>
            <ThemeText variant="caption">Uploading {progress.done}/{progress.total}</ThemeText>
            <View style={{ height: 8, backgroundColor: colors.borderAlt, borderRadius: 999, overflow: 'hidden', marginTop: 8 }}>
              <View
                style={{
                  width: `${(progress.done / (progress.total || 1)) * 100}%`,
                  height: 10,
                  backgroundColor: colors.primary,
                  borderRadius: 999,
                }}
              />
            </View>
          </View>
        )}

        <Button title={uploading ? 'Uploading…' : 'Upload to library'} onPress={onUpload} fullWidth disabled={uploading} style={{ marginTop: 24 }} />

        <TopicPicker
          visible={topicPickerVisible}
          value={topic?.id}
          onSelect={(t) => { setTopic(t); setTopicPickerVisible(false); }}
          onDismiss={() => setTopicPickerVisible(false)}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  fileRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#e2e8f0' },
  fileThumb: { width: 56, height: 56, borderRadius: 8, resizeMode: 'cover' },
});

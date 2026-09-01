import { useState, useEffect } from 'react';
import { View, FlatList, TouchableOpacity, Modal, TextInput, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';
import { ThemeText } from '../ui/Text';
import { listTopics } from '../../services/curriculum';

export type TopicOption = { id: string; name: string };

export type TopicPickerProps = {
  visible: boolean;
  value?: string;
  placeholder?: string;
  onSelect: (topic: TopicOption) => void;
  onDismiss: () => void;
};

export function TopicPicker({ visible, value, placeholder = 'Search topics...', onSelect, onDismiss }: TopicPickerProps) {
  const colors = useTheme();
  const [query, setQuery] = useState('');
  const [topics, setTopics] = useState<TopicOption[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible) return;
    let active = true;
    setLoading(true);
    listTopics()
      .then(({ data }) => {
        if (!active) return;
        setTopics((data as any[] | undefined ?? []).map((t: any) => ({ id: t.id, name: t.name ?? t.title ?? '' })));
      })
      .finally(() => active && setLoading(false));
  }, [visible]);

  const filtered = query.trim()
    ? topics.filter((t) => t.name.toLowerCase().includes(query.toLowerCase()))
    : topics;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onDismiss}>
      <View style={[styles.backdrop, { backgroundColor: colors.background }]}>
        <View style={[styles.panel, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.handle} />
          <ThemeText variant="subtitle" style={{ marginBottom: 12 }}>Select a topic</ThemeText>
          <TextInput
            placeholder={placeholder}
            placeholderTextColor={colors.textTertiary}
            value={query}
            onChangeText={setQuery}
            style={[styles.input, { backgroundColor: colors.cardAlt, borderColor: colors.border, color: colors.text }]}
          />
          <FlatList
            data={filtered}
            keyExtractor={(t) => t.id}
            contentContainerStyle={{ paddingVertical: 6 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => { onSelect(item); onDismiss(); }}
                style={[styles.row, { borderBottomColor: colors.border }]}
              >
                <ThemeText variant="subtitle" style={{ color: item.id === value ? colors.primary : colors.text }}>
                  {item.name}
                </ThemeText>
              </TouchableOpacity>
            )}
          />
          {loading && <ThemeText variant="caption" style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 8 }}>Loading topics...</ThemeText>}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end' },
  panel: { padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20, borderWidth: 1, maxHeight: '70%' },
  handle: { width: 48, height: 5, backgroundColor: '#cbd5e1', borderRadius: 999, alignSelf: 'center', marginBottom: 12 },
  input: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, borderWidth: 1, fontSize: 16, marginBottom: 8 },
  row: { paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
});

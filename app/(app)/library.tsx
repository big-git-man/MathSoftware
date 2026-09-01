import { View, FlatList, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/theme';
import { ThemeText } from '../../src/components/ui/Text';
import { Screen } from '../../src/components/layout/Screen';
import { Card } from '../../src/components/ui/Card';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { useDocuments } from '../../src/hooks/useDocuments';
import { FileText, Search, RotateCw } from 'lucide-react-native';

export default function LibraryScreen() {
  const colors = useTheme();
  const router = useRouter();
  const { data: docs, loading, refetch } = useDocuments();

  return (
    <Screen bg="background">
      <View style={{ flex: 1, padding: 16 }}>
        <View style={styles.bar}>
          <View style={[styles.search, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Search size={18} color={colors.textTertiary} />
            <ThemeText style={{ color: colors.textTertiary, marginLeft: 8 }}>Search library</ThemeText>
          </View>
          <TouchableOpacity onPress={refetch} style={{ paddingLeft: 12 }}>
            <RotateCw size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
        {loading ? (
          <ThemeText style={{ marginTop: 24 }}>Loading your library…</ThemeText>
        ) : docs.length === 0 ? (
          <Card style={{ marginTop: 40, padding: 32, alignItems: 'center' }}>
            <FileText size={48} color={colors.textTertiary} />
            <EmptyState title="Your library is empty" description="Tap the + to add your first document." />
          </Card>
        ) : (
          <FlatList
            data={docs}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => router.push(`/(app)/document/${item.id}` as any)}
              >
                {item.thumbnail_url ? <Image source={{ uri: item.thumbnail_url }} style={styles.thumb} /> : <FileText size={24} color={colors.textTertiary} style={styles.thumb} />}
                <View style={styles.info}>
                  <ThemeText variant="subtitle" numberOfLines={1}>{item.title}</ThemeText>
                  <ThemeText variant="caption" style={{ color: colors.textSecondary }}>{item.subject?.name ?? 'Unsorted'}</ThemeText>
                </View>
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </Screen>
  );
}
const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  search: { flex: 1, flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, paddingHorizontal: 10, height: 40 },
  row: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 10 },
  thumb: { width: 48, height: 48, borderRadius: 8, marginRight: 12 },
  info: { flex: 1 },
});

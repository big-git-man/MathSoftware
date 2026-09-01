import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, BookOpen, HelpCircle, Library, User, Plus } from 'lucide-react-native';
import { useTheme } from '../../theme';
import { ThemeText } from '../ui/Text';

type RouteDef = { name: string; label: string; Icon: React.ComponentType<any> };

const routes: RouteDef[] = [
  { name: 'index', label: 'Home', Icon: Home },
  { name: 'learn', label: 'Learn', Icon: BookOpen },
  { name: 'practice', label: 'Practice', Icon: HelpCircle },
  { name: 'library', label: 'Library', Icon: Library },
  { name: 'profile', label: 'Profile', Icon: User },
];

export function BottomTabBar({ state, descriptors, navigation }: any) {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const goTo = (name: string) => {
    const focused = state.routes[state.index]?.name === name;
    if (!focused) navigation.navigate(name);
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          paddingBottom: Math.max(insets.bottom, 8),
          paddingTop: 10,
        },
      ]}
    >
      <View style={styles.row}>
        {routes.map((r) => {
          const focused = state.routes[state.index]?.name === r.name;
          const { options } = descriptors[state.routes.find((rt: any) => rt.name === r.name)?.key ?? ''];
          const Label = options?.title ?? r.label;
          const tint = focused ? colors.primary : colors.textTertiary;
          return (
            <TouchableOpacity key={r.name} accessibilityState={{ selected: focused }} onPress={() => goTo(r.name)} style={styles.tab}>
              <r.Icon size={focused ? 24 : 22} color={tint} />
              <ThemeText variant="caption" style={{ color: tint, marginTop: 2 }}>
                {Label}
              </ThemeText>
            </TouchableOpacity>
          );
        })}
      </View>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => router.navigate('/(upload)')}
        style={[styles.fab, { backgroundColor: colors.primary }]}
      >
        <Plus size={28} color="#ffffff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -2 },
  },
  row: { flexDirection: 'row', justifyContent: 'space-around' },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 6 },
  fab: {
    position: 'absolute',
    bottom: 24,
    left: '50%',
    marginLeft: -30,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
});

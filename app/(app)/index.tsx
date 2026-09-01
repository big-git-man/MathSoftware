import { View, FlatList, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useTheme } from '../../src/theme';
import { ThemeText } from '../../src/components/ui/Text';
import { Button } from '../../src/components/ui/Button';
import { LevelBadge } from '../../src/components/ui/LevelBadge';
import { StreakBadge } from '../../src/components/gamification/StreakBadge';
import { MissionCard, Mission } from '../../src/components/gamification/MissionCard';
import { MasteryBar } from '../../src/components/gamification/MasteryBar';
import { Card } from '../../src/components/ui/Card';
import { useDashboard } from '../../src/hooks/useDashboard';
import { Avatar } from '../../src/components/ui/Avatar';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { Image as ImageIcon } from 'lucide-react-native';

export default function HomeScreen() {
  const colors = useTheme();
  const router = useRouter();
  const { data: dash, loading, refetch } = useDashboard();

  if (loading || !dash) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', paddingTop: 60 }}>
        <ThemeText>Preparing your dashboard…</ThemeText>
      </View>
    );
  }

  const level = dash.level;
  const xpPct = Math.max(0, Math.min(1, level.xpIntoLevel / level.xpForNext));

  const recentDocs = dash.recentDocuments ?? [];

  return (
    <ScrollView
      style={{ backgroundColor: colors.background, flex: 1 }}
      contentContainerStyle={{ padding: 16, paddingBottom: 110 }}
      refreshing={loading}
      onRefresh={refetch}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <ThemeText variant="h2">MATHEMATICS</ThemeText>
          <ThemeText variant="h1">LEVEL {level.level}</ThemeText>
        </View>
        <Avatar name={dash.profile?.display_name ?? 'Mateo'} size={44} />
      </View>

      {/* XP + streak */}
      <Card style={{ marginTop: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <LevelBadge level={level.level} size="md" />
          <StreakBadge days={dash.streak.current} />
        </View>
        <ThemeText variant="body" style={{ marginTop: 8 }}>
          {level.xpIntoLevel.toLocaleString()} / {level.xpForNext.toLocaleString()} XP
        </ThemeText>
        <View style={{ marginTop: 10 }}>
          <View style={{ height: 10, backgroundColor: colors.borderAlt, borderRadius: 999, overflow: 'hidden' }}>
            <View style={{ width: `${xpPct * 100}%`, height: 10, backgroundColor: colors.primary, borderRadius: 999 }} />
          </View>
        </View>
        <ThemeText variant="caption" style={{ color: colors.textSecondary, marginTop: 4 }}>
          {level.progressToNext > 0 ? `${Math.round((1 - level.progressToNext) * level.xpForNext)} XP to Level ${level.nextLevel}` : 'Level up!'}
        </ThemeText>
      </Card>

      {/* Today's missions */}
      <View style={{ marginTop: 22 }}>
        <ThemeText variant="h3" style={{ marginBottom: 10 }}>Today's Missions</ThemeText>
        <View>
          {dash.todayMissions.length === 0 ? (
            <ThemeText variant="caption" style={{ color: colors.textSecondary }}>All caught up! New missions appear tomorrow.</ThemeText>
          ) : (
            dash.todayMissions.map((m: Mission) => (
              <MissionCard key={m.id} mission={m} onPress={() => {}} />
            ))
          )}
        </View>
      </View>

      {/* Weekly progress */}
      <Card style={{ marginTop: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
          <ThemeText variant="subtitle">Weekly goal</ThemeText>
          <ThemeText variant="caption" style={{ color: colors.textSecondary }}>
            {dash.weeklyProgress.earned}/{dash.weeklyProgress.target} complete
          </ThemeText>
        </View>
        <View style={{ height: 8, backgroundColor: colors.borderAlt, borderRadius: 999, overflow: 'hidden' }}>
          <View
            style={{
              width: `${dash.weeklyProgress.target ? (dash.weeklyProgress.earned / dash.weeklyProgress.target) * 100 : 0}%`,
              height: 8,
              backgroundColor: colors.gold,
              borderRadius: 999,
            }}
          />
        </View>
      </Card>

      {/* Weak topics */}
      <View style={{ marginTop: 22 }}>
        <ThemeText variant="h3" style={{ marginBottom: 10 }}>Topic Mastery</ThemeText>
        {(dash.weakTopics ?? []).length === 0 ? (
          <ThemeText variant="caption" style={{ color: colors.textSecondary }}>Practice to build mastery here.</ThemeText>
        ) : (
          dash.weakTopics.map((t: any) => (
            <MasteryBar
              key={t?.topic?.id ?? t?.id}
              name={t?.topic?.name ?? t?.name ?? 'Topic'}
              mastery={t?.mastery_score ?? 0}
            />
          ))
        )}
      </View>

      {/* Recommendations */}
      <Card style={{ marginTop: 22, backgroundColor: colors.goldSoft }}>
        <ThemeText variant="subtitle" style={{ marginBottom: 6 }}>Recommended next step</ThemeText>
        {dash.recommendations.length === 0 ? (
          <ThemeText variant="caption" style={{ color: colors.textSecondary }}>Great work — keep learning!</ThemeText>
        ) : (
          dash.recommendations.map((r: string, i: number) => (
            <ThemeText key={i} variant="body" style={{ color: colors.text, marginTop: i === 0 ? 0 : 4 }}>
              • {r}
            </ThemeText>
          ))
        )}
      </Card>

      {/* Recent documents */}
      <View style={{ marginTop: 22 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <ThemeText variant="h3">Recent Work</ThemeText>
          <Link href="/(app)/library" style={{ color: colors.primary }}>
            <ThemeText variant="caption" style={{ color: colors.primary }}>See all</ThemeText>
          </Link>
        </View>
        {recentDocs.length === 0 ? (
          <Card style={{ alignItems: 'center', padding: 24 }}>
            <ImageIcon size={36} color={colors.textTertiary} />
            <ThemeText variant="subtitle" style={{ marginTop: 8 }}>No work yet</ThemeText>
            <ThemeText variant="caption" style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 6 }}>
              Tap the + button to photograph homework and start building your library.
            </ThemeText>
            <TouchableOpacity onPress={() => router.navigate('/(upload)')} style={{ marginTop: 14 }}>
              <ThemeText style={{ color: colors.primary, fontWeight: '700' }}>Upload now</ThemeText>
            </TouchableOpacity>
          </Card>
        ) : (
          <FlatList
            data={recentDocs}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => router.navigate(`/document/${item.id}` as any)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  paddingVertical: 10,
                  borderBottomWidth: StyleSheet.hairlineWidth,
                  borderBottomColor: colors.border,
                }}
              >
                <View style={{ width: 44, height: 44, backgroundColor: colors.cardAlt, borderRadius: 8 }} />
                <View style={{ flex: 1 }}>
                  <ThemeText variant="subtitle" numberOfLines={1}>
                    {item.ai_title ?? item.original_filename}
                  </ThemeText>
                  <ThemeText variant="caption" style={{ color: colors.textSecondary }}>
                    {item.processing_status === 'ready' ? 'Ready' : item.processing_status} · {new Date(item.created_at).toLocaleDateString()}
                  </ThemeText>
                </View>
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
});

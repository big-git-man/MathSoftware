import { supabase } from '../api/supabase';
import {
  levelFromTotalXP,
  xpIntoCurrentLevel,
  xpForNextLevel,
  progressToNextLevel,
  cumulativeXP,
} from '../utils/level';

export type LevelInfo = {
  level: number;
  totalXp: number;
  xpIntoLevel: number;
  xpForNext: number;
  progressToNext: number; // 0..1
  nextLevel: number;
};

export type MissionInfo = {
  id: string;
  code: string;
  name: string;
  description?: string;
  xpReward: number;
  progress: number;
  target: number;
  status: string;
};

export type Dashboard = {
  level: LevelInfo;
  streak: { current: number; longest: number };
  todayMissions: MissionInfo[];
  weeklyProgress: { earned: number; target: number };
  recentDocuments: any[];
  weakTopics: any[];
  recentAchievements: any[];
  recommendations: string[];
  profile: any;
};

export async function getDashboard(): Promise<Dashboard | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const uid = user.id;

  const [progRes, missionsRes, docsRes, masteryRes, achRes, profileRes] = await Promise.all([
    supabase.from('user_progression').select('*').eq('user_id', uid).maybeSingle(),
    supabase.rpc('generate_missions', { p_user: uid, p_date: null }),
    supabase.from('documents').select('*').eq('user_id', uid).order('created_at', { ascending: false }).limit(8),
    supabase.from('topic_mastery').select('*, topic:topics(*)').eq('user_id', uid).order('mastery_score', { ascending: true }).limit(6),
    supabase
      .from('user_achievements')
      .select('unlocked_at, achievement:achievements(*)')
      .eq('user_id', uid)
      .order('unlocked_at', { ascending: false })
      .limit(6),
    supabase.from('profiles').select('*').eq('id', uid).maybeSingle(),
  ]);

  const prog = progRes.data;
  const totalXp: number = prog?.total_xp ?? 0;
  const lvl = levelFromTotalXP(totalXp);
  const into = xpIntoCurrentLevel(totalXp);
  const next = xpForNextLevel(lvl);
  const levelInfo: LevelInfo = {
    level: lvl,
    totalXp,
    xpIntoLevel: into,
    xpForNext: next,
    progressToNext: next > 0 ? into / next : 0,
    nextLevel: lvl + 1,
  };

  const rawMissions = (missionsRes.data ?? []) as any[];
  const todayMissions: MissionInfo[] = rawMissions
    .filter((m) => m.type === 'daily')
    .map((m) => ({
      id: m.mission_id,
      code: m.code,
      name: m.name,
      description: '',
      xpReward: m.xp_reward,
      progress: m.progress ?? 0,
      target: m.target ?? 0,
      status: m.status,
    }));

  const weekly = rawMissions.filter((m) => m.type === 'weekly');
  const weeklyProgress = {
    earned: weekly.filter((m) => m.status === 'completed').length,
    target: weekly.length,
  };

  const weakTopics = (masteryRes.data ?? [])
    .map((m: any) => m.topic)
    .filter(Boolean)
    .slice(0, 4);

  const recommendations: string[] = [];
  if (weakTopics.length) {
    recommendations.push(`${weakTopics[0]?.name ?? 'Your weakest topic'} is waiting for review. Practice to raise mastery.`);
  }
  const incompleteToday = todayMissions.filter((m) => m.status !== 'completed');
  if (incompleteToday.length) {
    recommendations.push(`You have ${incompleteToday.length} mission${incompleteToday.length > 1 ? 's' : ''} left today.`);
  }
  if (levelInfo.progressToNext > 0.7 && levelInfo.level > 1) {
    recommendations.push(`You're close to Level ${levelInfo.nextLevel}. Keep going.`);
  }

  return {
    level: levelInfo,
    streak: { current: prog?.current_streak ?? 0, longest: prog?.longest_streak ?? 0 },
    todayMissions,
    weeklyProgress,
    recentDocuments: docsRes.data ?? [],
    weakTopics,
    recentAchievements: achRes.data ?? [],
    recommendations,
    profile: profileRes.data,
  };
}

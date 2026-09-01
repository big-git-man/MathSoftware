import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { AndroidImportance, SchedulableTriggerInputTypes } from 'expo-notifications';

export async function configureNotifications() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('daily', {
      name: 'Daily reminder',
      importance: AndroidImportance.DEFAULT,
      sound: 'default',
      vibrationPattern: [0, 250, 250, 250],
    });
  }
}

export async function registerDailyReminder(): Promise<string | null> {
  await configureNotifications();
  const { status } = await Notifications.getPermissionsAsync();
  let granted = status === 'granted';
  if (status !== 'granted') {
    const res = await Notifications.requestPermissionsAsync();
    granted = res.status === 'granted';
  }
  if (!granted) return null;

  await Notifications.cancelAllScheduledNotificationsAsync();
  return Notifications.scheduleNotificationAsync({
    content: {
      title: 'Maths Companion',
      body: "Your daily boss is waiting. Don't let your streak die!",
      sound: 'default',
      ...(Platform.OS === 'android' ? { channelId: 'daily' } : {}),
    },
    trigger: { type: SchedulableTriggerInputTypes.CALENDAR, hour: 18, minute: 0, repeats: true },
  });
}

export async function cancelDailyReminder() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

import { useEffect } from 'react';
import { registerDailyReminder, cancelDailyReminder } from '../services/notifications';

export function useDailyNotifications(enabled: boolean) {
  useEffect(() => {
    if (enabled) {
      registerDailyReminder().catch(() => {});
    } else {
      cancelDailyReminder().catch(() => {});
    }
  }, [enabled]);
}

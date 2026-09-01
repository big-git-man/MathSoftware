import dayjs from 'dayjs';
import 'dayjs/locale/en';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);

export const d = dayjs;

export function formatDate(date: string | Date, fmt = 'MMM D, YYYY'): string {
  return dayjs(date).format(fmt);
}

export function formatDateRelative(date: string | Date): string {
  const target = dayjs(date);
  if (target.isSame(dayjs(), 'day')) return 'Today';
  if (target.isSame(dayjs().subtract(1, 'day'), 'day')) return 'Yesterday';
  if (target.isAfter(dayjs().subtract(7, 'day'), 'day')) return target.format('ddd');
  return target.format('MMM D');
}

export function isToday(date: string | Date): boolean {
  return dayjs(date).isSame(dayjs(), 'day');
}

export function dateKey(date = dayjs()): string {
  return date.format('YYYY-MM-DD');
}

export function weekKey(date = dayjs()): string {
  return `week-${date.format('YYYY-[W]ww')}`;
}

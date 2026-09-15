import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'
import type { NotificationSettings, ReminderSchedule } from '../game/progression'

const MORNING_REMINDER_ID = 8_000
const EVENING_REMINDER_ID = 21_000
const DEBUG_REMINDER_ID = 21_001
const DAILY_REMINDER_IDS = [MORNING_REMINDER_ID, EVENING_REMINDER_ID]

const ensureNotificationPermission = async () => {
  if (!Capacitor.isNativePlatform()) {
    return { granted: false, reason: 'web' as const }
  }

  const currentPermission = await LocalNotifications.checkPermissions()
  const permission = currentPermission.display === 'prompt'
    ? await LocalNotifications.requestPermissions()
    : currentPermission

  if (permission.display !== 'granted') {
    return { granted: false, reason: 'denied' as const }
  }

  return { granted: true as const }
}

const reminderTitle = (kind: 'morning' | 'evening') => kind === 'morning' ? 'Ночь прошла' : 'Герой готовится ко сну'

const reminderBody = (kind: 'morning' | 'evening') =>
  kind === 'morning'
    ? 'Герой пережил ночь. Загляни в утренний дневник — и выбери, куда идти сегодня.'
    : 'Костёр уже горит. Закрой день вместе с героем — завтра путь продолжится.'

const createReminder = (id: number, kind: 'morning' | 'evening', reminder: ReminderSchedule) => ({
  id,
  title: reminderTitle(kind),
  body: reminderBody(kind),
  schedule: { on: { hour: reminder.hour, minute: reminder.minute } },
  threadIdentifier: `daily-${kind}-reminder`,
  extra: { kind: `daily-${kind}-reminder` },
})

export const scheduleDailyReminders = async (settings: NotificationSettings) => {
  const permission = await ensureNotificationPermission()
  if (!permission.granted) return { scheduled: false, reason: permission.reason }

  const notifications = [
    settings.frequency === 'twice' && settings.morning.enabled
      ? createReminder(MORNING_REMINDER_ID, 'morning', settings.morning)
      : null,
    settings.evening.enabled
      ? createReminder(EVENING_REMINDER_ID, 'evening', settings.evening)
      : null,
  ].filter((notification): notification is ReturnType<typeof createReminder> => Boolean(notification))

  await LocalNotifications.cancel({ notifications: DAILY_REMINDER_IDS.map((id) => ({ id })) })
  if (notifications.length) {
    await LocalNotifications.schedule({ notifications })
  }

  return { scheduled: true, count: notifications.length }
}

export const scheduleDebugNotification = async () => {
  const permission = await ensureNotificationPermission()
  if (!permission.granted) return { scheduled: false, reason: permission.reason }

  await LocalNotifications.cancel({ notifications: [{ id: DEBUG_REMINDER_ID }] })
  await LocalNotifications.schedule({
    notifications: [
      {
        id: DEBUG_REMINDER_ID,
        title: 'Тропа ждёт',
        body: 'Пробное уведомление Shadow Path доставлено.',
        schedule: { at: new Date(Date.now() + 10_000) },
        threadIdentifier: 'debug-evening-reminder',
        extra: { kind: 'debug-evening-reminder' },
      },
    ],
  })

  return { scheduled: true, seconds: 10 }
}

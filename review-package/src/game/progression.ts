export type RewardBundle = {
  coins: number
}

export type DayEntry = {
  date: string
  steps: number
  goal: number
  xp: number
  rewards: RewardBundle
  savedAt?: string
}

export type ReminderSchedule = {
  enabled: boolean
  hour: number
  minute: number
}

export type NotificationSettings = {
  frequency: 'once' | 'twice'
  morning: ReminderSchedule
  evening: ReminderSchedule
}

export type GameSave = {
  daily: Record<string, DayEntry>
  coins: number
  camp: CampState
  map: MapProgress
  world: WorldProgress
  story: StoryProgress
  evolution: HeroEvolutionState
  night: NightProgress
  minigames: MinigameProgress
  notifications: NotificationSettings
  streak: StreakState
  eveningShownDate: string
}

export const STEP_GOAL = 10000

export const createDefaultNotificationSettings = (): NotificationSettings => ({
  frequency: 'twice',
  morning: { enabled: true, hour: 8, minute: 0 },
  evening: { enabled: true, hour: 21, minute: 0 },
})

export const normalizeNotificationSettings = (settings?: Partial<NotificationSettings>): NotificationSettings => {
  const defaults = createDefaultNotificationSettings()
  const normalizeReminder = (reminder: Partial<ReminderSchedule> | undefined, fallback: ReminderSchedule): ReminderSchedule => ({
    enabled: reminder?.enabled ?? fallback.enabled,
    hour: typeof reminder?.hour === 'number' && reminder.hour >= 0 && reminder.hour <= 23 ? Math.floor(reminder.hour) : fallback.hour,
    minute: typeof reminder?.minute === 'number' && reminder.minute >= 0 && reminder.minute <= 59 ? Math.floor(reminder.minute) : fallback.minute,
  })
  const frequency = settings?.frequency === 'once' ? 'once' : 'twice'
  const morning = normalizeReminder(settings?.morning, { ...defaults.morning, enabled: frequency === 'twice' })
  const evening = normalizeReminder(settings?.evening, defaults.evening)

  return {
    frequency,
    morning: frequency === 'once' ? { ...morning, enabled: false } : morning,
    evening: frequency === 'once' ? { ...evening, enabled: true } : evening,
  }
}

export const getTodayKey = () => {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export const createEmptySave = (): GameSave => ({
  daily: {},
  coins: 0,
  camp: createInitialCamp(),
  map: createInitialMapProgress(),
  world: createInitialWorldProgress(),
  story: createInitialStoryProgress(),
  evolution: createInitialHeroEvolution(),
  night: createInitialNightProgress(),
  minigames: createInitialMinigameProgress(),
  notifications: createDefaultNotificationSettings(),
  streak: createInitialStreak(),
  eveningShownDate: '',
})

export const createDayEntry = (date: string, steps: number): DayEntry => ({
  date,
  steps,
  goal: STEP_GOAL,
  xp: 0,
  rewards: { coins: 0 },
})

export const sumXp = (daily: Record<string, DayEntry>) =>
  Object.values(daily).reduce((total, day) => total + day.xp, 0)

export const getLevelXpTarget = (level: number) => 260 + (level - 1) * 140 + Math.max(0, level - 2) * 70

export const getLevel = (xp: number) => {
  let level = 1
  let spent = 0
  while (xp >= spent + getLevelXpTarget(level)) {
    spent += getLevelXpTarget(level)
    level += 1
  }
  return level
}

export const getLevelProgress = (xp: number) => {
  let level = 1
  let levelFloor = 0
  while (xp >= levelFloor + getLevelXpTarget(level)) {
    levelFloor += getLevelXpTarget(level)
    level += 1
  }
  const target = getLevelXpTarget(level)
  return {
    current: xp - levelFloor,
    target,
    percent: Math.min(100, Math.round(((xp - levelFloor) / target) * 100)),
  }
}

import { createInitialMapProgress, type MapProgress } from './map.ts'
import { createInitialWorldProgress, type WorldProgress } from './world.ts'
import { createInitialCamp, type CampState } from './camp.ts'
import { createInitialStoryProgress, type StoryProgress } from './story.ts'
import { createInitialHeroEvolution, type HeroEvolutionState } from './evolution.ts'
import { createInitialNightProgress, type NightProgress } from './night.ts'
import { createInitialMinigameProgress, type MinigameProgress } from './minigames.ts'
import { createInitialStreak, type StreakState } from './streak.ts'

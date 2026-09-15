import { Preferences } from '@capacitor/preferences'
import { createInitialMapProgress } from '../game/map'
import { createEmptySave, normalizeNotificationSettings, type GameSave } from '../game/progression'
import { createInitialWorldProgress } from '../game/world'
import { createInitialStoryProgress } from '../game/story'
import { createInitialNightProgress } from '../game/night'
import { createInitialMinigameProgress } from '../game/minigames'
import { createInitialHeroEvolution, normalizeHeroEvolution } from '../game/evolution'
import { normalizeStreak } from '../game/streak'

const SAVE_KEY = 'shadow-path-v0.2'

export const loadGame = async (): Promise<GameSave> => {
  const { value } = await Preferences.get({ key: SAVE_KEY })
  if (!value) return createEmptySave()

  try {
    const parsed = JSON.parse(value) as GameSave & { wood?: number; crystals?: number }
    const initialMap = createInitialMapProgress()
    const initialWorld = createInitialWorldProgress()
    const initialStory = createInitialStoryProgress()
    const initialEvolution = createInitialHeroEvolution()
    const initialNight = createInitialNightProgress()
    const initialMinigames = createInitialMinigameProgress()
    return {
      daily: parsed.daily ?? {},
      coins: parsed.coins ?? (parsed.wood ?? 0) * 10 + (parsed.crystals ?? 0) * 25,
      camp: {
        fire: parsed.camp?.fire ?? 0,
        storage: parsed.camp?.storage ?? 0,
        altar: parsed.camp?.altar ?? 0,
      },
      map: {
        ...initialMap,
        ...(parsed.map ?? {}),
        completedNodeIds: parsed.map?.completedNodeIds?.length ? parsed.map.completedNodeIds : initialMap.completedNodeIds,
        rewardedNodeIds: parsed.map?.rewardedNodeIds ?? initialMap.rewardedNodeIds,
        locationCompleted: parsed.map?.locationCompleted ?? parsed.map?.currentNodeId === 'spire-overlook',
      },
      world: {
        ...initialWorld,
        ...(parsed.world ?? {}),
        completedLocationIds: parsed.world?.completedLocationIds ?? (
          parsed.map?.locationCompleted ? [initialWorld.currentLocationId] : initialWorld.completedLocationIds
        ),
        completedRegionIds: parsed.world?.completedRegionIds ?? [],
        locationProgress: parsed.world?.locationProgress ?? {},
      },
      story: {
        ...initialStory,
        ...(parsed.story ?? {}),
        identity: { ...initialStory.identity, ...(parsed.story?.identity ?? {}) },
        completedEncounterIds: parsed.story?.completedEncounterIds ?? [],
        abilities: parsed.story?.abilities ?? [],
        choices: parsed.story?.choices ?? {},
        journal: parsed.story?.journal ?? [],
      },
      evolution: normalizeHeroEvolution(parsed.evolution ?? initialEvolution),
      night: {
        ...initialNight,
        ...(parsed.night ?? {}),
        history: parsed.night?.history ?? [],
      },
      minigames: {
        ...initialMinigames,
        ...(parsed.minigames ?? {}),
        lockpicking: parsed.minigames?.lockpicking ?? {},
        battles: parsed.minigames?.battles ?? {},
        pointEvents: parsed.minigames?.pointEvents ?? {},
      },
      notifications: normalizeNotificationSettings(parsed.notifications),
      streak: normalizeStreak(parsed.streak),
      eveningShownDate: typeof parsed.eveningShownDate === 'string' ? parsed.eveningShownDate : '',
    }
  } catch {
    return createEmptySave()
  }
}

export const saveGame = async (save: GameSave) => {
  await Preferences.set({ key: SAVE_KEY, value: JSON.stringify(save) })
}

import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent } from 'react'
import {
  addDebugRouteSteps,
  carryStepCreditToMap,
  createInitialMapProgress,
  creditTodaySteps,
  getAvailableTargetIds,
  getLocationMap,
  getMapNode,
  isLocationPlayable,
  startMapRoute,
  type MapProgress,
} from './game/map'
import {
  getLocalLockedHint,
  getLocalNodePresentation,
  getLocalNodeVisualRole,
  getLocalNodeVisualState,
  getLocalRouteVisualState,
  getWorldLocationPresentation,
  getWorldLocationVisualRole,
  getWorldLocationVisualState,
  getWorldRouteVisualState,
  getWorldSelectionCopy,
} from './game/mapPresentation'
import {
  WORLD_EDGES,
  WORLD_LOCATIONS,
  getWorldLocation,
  getWorldNeighbors,
  getWorldRegion,
  type WorldProgress,
} from './game/world'
import {
  CAMP_UPGRADES,
  calculateCampNodeReward,
  getCampUpgradeCost,
  type CampUpgradeDefinition,
  type CampUpgradeId,
} from './game/camp'
import { getDominantIdentityPath, getStoryEncounter, resolveStoryEncounter, type StoryEncounter, type StoryJournalEntry, type StoryProgress } from './game/story'
import { createNightEvent, resolveNightEvent, type NightEvent } from './game/night'
import {
  EVOLUTION_REQUIREMENTS,
  EVOLUTION_STAGE_DESCRIPTIONS,
  EVOLUTION_STAGE_TITLES,
  advanceHeroEvolution,
  canAdvanceEvolution,
  getEvolutionShardSourceForNode,
  getMissingEvolutionShards,
  getNextEvolutionRequirement,
  grantEvolutionShardSource,
  grantEvolutionShards,
  isEvolutionStageReached,
  type EvolutionShardSource,
  type HeroEvolutionStage,
  type HeroEvolutionState,
} from './game/evolution'
import {
  areConnectBattleTilesAdjacent,
  createConnectBattleBoard,
  getConnectBattleConfig,
  getLockpickingConfig,
  getLockpickingPinPosition,
  rateLockpickingPin,
  refillConnectBattleBoard,
  resolveConnectBattle,
  resolveLockpicking,
  scoreConnectBattleChains,
  type ConnectBattleChain,
  type ConnectBattleResult,
  type ConnectBattleSymbol,
  type LockpickingPinRating,
  type LockpickingResult,
} from './game/minigames'
import {
  getCarefulCrossingMarkerPosition,
  getPointEventDefinition,
  getPointEventSaveKey,
  rateCarefulCrossingTap,
  resolveAreaSearch,
  resolveCarefulCrossing,
  resolvePointEventChoice,
  type PointEventResult,
  type PointEventRewardTier,
} from './game/pointEvents'
import {
  STEP_GOAL,
  createDayEntry,
  createEmptySave,
  getLevel,
  getLevelProgress,
  getLevelXpTarget,
  getTodayKey,
  sumXp,
  type DayEntry,
  type GameSave,
  type NotificationSettings,
} from './game/progression'
import { pluralStreakDays, registerActiveDay, type StreakState } from './game/streak'
import { readTodaySteps, type StepSnapshot } from './services/steps'
import { loadGame, saveGame } from './services/storage'
import { scheduleDailyReminders, scheduleDebugNotification } from './services/notifications'
import { playLockpickFeedback } from './services/feedback'
import { PrologueEncounter, PrologueJourney } from './components/PrologueShell'
import { getPendingPrologueSceneNodeId } from './components/prologueShellState'
import './App.css'

type Tab = 'map' | 'hero' | 'camp' | 'journal'
type BecomingNoticeState = { source: EvolutionShardSource; openWorldAfterClose: boolean }
type BattleReportState = { nodeId: string; locationId: string; result: ConnectBattleResult }

const tabs: { id: Tab; label: string; icon: string }[] = [
  { id: 'map', label: 'Карта', icon: '⌖' },
  { id: 'hero', label: 'Герой', icon: '✦' },
  { id: 'camp', label: 'Лагерь', icon: '🔥' },
  { id: 'journal', label: 'Журнал', icon: '☰' },
]

const fmt = (value: number) => value.toLocaleString('ru-RU')
const FIRST_REGION_LOCATION_IDS = ['silent-ruins', 'quiet-road', 'moss-gate']
const daysBetween = (from: string, to: string) => Math.max(1, Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000))

const abilityInfo: Record<string, { title: string; text: string }> = {
  'guard-stance': {
    title: 'Стойка Перехода',
    text: 'Смягчает опасное действие, когда герой выбирает выдержку и защиту.',
  },
  'ash-lunge': {
    title: 'Пепельный выпад',
    text: 'Усиливает решительное действие, когда путь требует рывка вперёд.',
  },
  'silent-break': {
    title: 'Тихий разрыв',
    text: 'Разрывает навязанный ритм испытаний и открывает третий способ пройти.',
  },
}

const pluralDays = (amount: number) => {
  const lastTwo = amount % 100
  const last = amount % 10
  if (lastTwo >= 11 && lastTwo <= 14) return 'дней'
  if (last === 1) return 'день'
  if (last >= 2 && last <= 4) return 'дня'
  return 'дней'
}

const pluralShard = (amount: number) => {
  const lastTwo = amount % 100
  const last = amount % 10
  if (lastTwo >= 11 && lastTwo <= 14) return 'осколков'
  if (last === 1) return 'осколок'
  if (last >= 2 && last <= 4) return 'осколка'
  return 'осколков'
}

const getEvolutionGateCopy = (evolution: HeroEvolutionState) => {
  const requirement = getNextEvolutionRequirement(evolution)
  if (!requirement) return 'Общий ствол собран. Дальше важны навыки, территории, решения и будущий выбор ветви.'
  const missing = getMissingEvolutionShards(evolution, requirement)
  if (missing > 0) return `${requirement.title}: нужно ${requirement.shardCost} свободных ${pluralShard(requirement.shardCost)}; не хватает ${missing}.`
  return `${requirement.title}: осколки готовы, можно пройти порог становления.`
}

const isEvolutionShardSourceCompleted = (save: GameSave, source: EvolutionShardSource) => {
  const storedMap = save.world.locationProgress[source.locationId]
  return save.world.completedLocationIds.includes(source.locationId) ||
    (save.world.currentLocationId === source.locationId && save.map.rewardedNodeIds.includes(source.nodeId)) ||
    Boolean(storedMap?.rewardedNodeIds.includes(source.nodeId))
}

const shouldShowPointEvent = (locationId: string, nodeId: string) => Boolean(getPointEventDefinition(locationId, nodeId))

const grantCompletedEvolutionShardSources = (save: GameSave) => {
  let nextEvolution = save.evolution
  let gainedSource: EvolutionShardSource | null = null

  for (const source of [getEvolutionShardSourceForNode('silent-ruins', 'spire-overlook')].filter(Boolean) as EvolutionShardSource[]) {
    if (!isEvolutionShardSourceCompleted(save, source)) continue
    const beforeFound = nextEvolution.shards.found
    nextEvolution = grantEvolutionShardSource(nextEvolution, source)
    if (nextEvolution.shards.found > beforeFound) gainedSource = source
  }

  return {
    save: nextEvolution === save.evolution ? save : { ...save, evolution: nextEvolution },
    shardSource: gainedSource,
  }
}

const grantNodeReward = (save: GameSave, locationId: string, nodeId: string, todayKey: string, steps: number): { save: GameSave; shardSource: EvolutionShardSource | null } => {
  if (save.map.rewardedNodeIds.includes(nodeId)) return { save, shardSource: null }
  const locationMap = getLocationMap(locationId)
  const node = getMapNode(nodeId, locationId)
  if (!node) return { save, shardSource: null }
  const currentDay = save.daily[todayKey] ?? createDayEntry(todayKey, steps)
  const reward = calculateCampNodeReward(node, save.camp)
  const shardSource = getEvolutionShardSourceForNode(locationId, nodeId)
  const nextEvolution = shardSource ? grantEvolutionShardSource(save.evolution, shardSource) : save.evolution
  const gainedShardSource = nextEvolution.shards.found > save.evolution.shards.found ? shardSource ?? null : null

  const completedLocation = nodeId === locationMap.finalNodeId
  const completedLocationIds = completedLocation
    ? Array.from(new Set([...save.world.completedLocationIds, locationId]))
    : save.world.completedLocationIds
  const completedFirstRegion = FIRST_REGION_LOCATION_IDS.every((id) => completedLocationIds.includes(id))
  const firstRegionReward = completedFirstRegion && !save.world.completedRegionIds.includes('silent-marches')
  const regionCoins = firstRegionReward ? 200 : 0
  const regionXp = firstRegionReward ? 300 : 0
  return {
    shardSource: gainedShardSource,
    save: {
      ...save,
      coins: save.coins + reward.coins + regionCoins,
      evolution: nextEvolution,
      daily: {
        ...save.daily,
        [todayKey]: { ...currentDay, xp: currentDay.xp + reward.xp + regionXp },
      },
      map: {
        ...save.map,
        rewardedNodeIds: [...save.map.rewardedNodeIds, nodeId],
        locationCompleted: save.map.locationCompleted || completedLocation,
      },
      world: completedLocation
        ? {
            ...save.world,
            completedLocationIds,
            completedRegionIds: firstRegionReward
              ? [...save.world.completedRegionIds, 'silent-marches']
              : save.world.completedRegionIds,
          }
        : save.world,
    },
  }
}

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('map')
  const [save, setSave] = useState<GameSave>(() => createEmptySave())
  const [stepsSnapshot, setStepsSnapshot] = useState<StepSnapshot | null>(null)
  const [isBooted, setIsBooted] = useState(false)
  const [arrivalNodeId, setArrivalNodeId] = useState<string | null>(null)
  const [isArrivalQueued, setIsArrivalQueued] = useState(false)
  const [activeEncounterId, setActiveEncounterId] = useState<string | null>(null)
  const [activeLockpickingNodeId, setActiveLockpickingNodeId] = useState<string | null>(null)
  const [activeBattleNodeId, setActiveBattleNodeId] = useState<string | null>(null)
  const [battleReport, setBattleReport] = useState<BattleReportState | null>(null)
  const [becomingNotice, setBecomingNotice] = useState<BecomingNoticeState | null>(null)
  const [evolutionTreeOpenSignal, setEvolutionTreeOpenSignal] = useState(0)
  const [isDevPanelOpen, setIsDevPanelOpen] = useState(false)
  const [isWorldMapOpen, setIsWorldMapOpen] = useState(false)
  const [deferredArrivalNodeId, setDeferredArrivalNodeId] = useState<string | null>(null)
  const [isStepsDetailOpen, setIsStepsDetailOpen] = useState(false)
  const [prologueSceneNodeId, setPrologueSceneNodeId] = useState<string | null>(null)
  const [isPrologueSceneOpen, setIsPrologueSceneOpen] = useState(false)
  const [isPrologueLocalMapOpen, setIsPrologueLocalMapOpen] = useState(false)
  const arrivalTimer = useRef<number | null>(null)
  const devPressTimer = useRef<number | null>(null)

  const todayKey = getTodayKey()
  const today = save.daily[todayKey] ?? createDayEntry(todayKey, stepsSnapshot?.steps ?? 0)
  const steps = stepsSnapshot?.steps ?? today.steps
  const totalXp = sumXp(save.daily)
  const level = getLevel(totalXp)
  const levelProgress = getLevelProgress(totalXp)

  const lastDays = useMemo(
    () =>
      Object.values(save.daily)
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 7),
    [save.daily],
  )

  const dailyAverageSteps = useMemo(() => {
    const activeDays = lastDays.filter((day) => day.steps > 0)
    if (!activeDays.length) return 6000
    return Math.max(1000, Math.round(activeDays.reduce((sum, day) => sum + day.steps, 0) / activeDays.length))
  }, [lastDays])

  const queueArrival = useCallback((nodeId: string) => {
    if (arrivalTimer.current !== null) window.clearTimeout(arrivalTimer.current)
    setIsArrivalQueued(true)
    arrivalTimer.current = window.setTimeout(() => {
      setArrivalNodeId(nodeId)
      setIsArrivalQueued(false)
      arrivalTimer.current = null
    }, 900)
  }, [])

  useEffect(() => () => {
    if (arrivalTimer.current !== null) window.clearTimeout(arrivalTimer.current)
    if (devPressTimer.current !== null) window.clearTimeout(devPressTimer.current)
  }, [])

  useEffect(() => {
    const boot = async () => {
      const [loadedSave, snapshot] = await Promise.all([loadGame(), readTodaySteps()])
      void scheduleDailyReminders(loadedSave.notifications).catch((error) => {
        console.warn('Не удалось запланировать уведомления Shadow Path.', error)
      })
      const currentDay = loadedSave.daily[todayKey]
      const previousDate = Object.keys(loadedSave.daily).filter((date) => date < todayKey).sort().at(-1)
      const night = !loadedSave.night.pending && previousDate && loadedSave.night.lastProcessedDate !== todayKey
        ? {
            ...loadedSave.night,
            lastProcessedDate: todayKey,
            pending: createNightEvent({
              date: todayKey,
              locationId: loadedSave.world.currentLocationId,
              daysAway: daysBetween(previousDate, todayKey),
              camp: loadedSave.camp,
              story: loadedSave.story,
              history: loadedSave.night.history,
            }),
          }
        : { ...loadedSave.night, lastProcessedDate: loadedSave.night.lastProcessedDate ?? todayKey }
      let hydratedSave: GameSave = {
        ...loadedSave,
        night,
        map: creditTodaySteps(loadedSave.map, todayKey, snapshot.steps, loadedSave.world.currentLocationId),
        daily: {
          ...loadedSave.daily,
          [todayKey]: {
            ...(currentDay ?? createDayEntry(todayKey, snapshot.steps)),
            steps: snapshot.steps,
            goal: STEP_GOAL,
          },
        },
      }

      let gainedShardSource: EvolutionShardSource | null = null
      if (hydratedSave.map.currentNodeId !== loadedSave.map.currentNodeId) {
        const rewardGrant = grantNodeReward(hydratedSave, loadedSave.world.currentLocationId, hydratedSave.map.currentNodeId, todayKey, snapshot.steps)
        hydratedSave = rewardGrant.save
        gainedShardSource = rewardGrant.shardSource
      }
      const reconciledSources = grantCompletedEvolutionShardSources(hydratedSave)
      hydratedSave = reconciledSources.save
      gainedShardSource = gainedShardSource ?? reconciledSources.shardSource

      const streakUpdate = registerActiveDay(hydratedSave.streak, todayKey, snapshot.steps)
      if (streakUpdate.streak !== hydratedSave.streak) hydratedSave = { ...hydratedSave, streak: streakUpdate.streak }

      setStepsSnapshot(snapshot)
      setSave(hydratedSave)
      setIsBooted(true)
      if (gainedShardSource) {
        setBecomingNotice({
          source: gainedShardSource,
          openWorldAfterClose: hydratedSave.map.currentNodeId === getLocationMap(gainedShardSource.locationId).finalNodeId,
        })
      }
      if (hydratedSave.map.currentNodeId !== loadedSave.map.currentNodeId && shouldShowPointEvent(loadedSave.world.currentLocationId, hydratedSave.map.currentNodeId)) {
        if (night.pending) setDeferredArrivalNodeId(hydratedSave.map.currentNodeId)
        else queueArrival(hydratedSave.map.currentNodeId)
      }
    }

    void boot()
  }, [queueArrival, todayKey])

  useEffect(() => {
    if (!isBooted) return
    void saveGame(save)
  }, [isBooted, save])

  const refreshTodaySteps = useCallback(async () => {
    const snapshot = await readTodaySteps()
    setStepsSnapshot(snapshot)
    if (getTodayKey() !== todayKey) return

    const locationId = save.world.currentLocationId
    const nextMap = creditTodaySteps(save.map, todayKey, snapshot.steps, locationId)
    const currentDay = save.daily[todayKey] ?? createDayEntry(todayKey, snapshot.steps)
    let nextSave: GameSave = {
      ...save,
      map: nextMap,
      daily: {
        ...save.daily,
        [todayKey]: { ...currentDay, steps: Math.max(currentDay.steps, snapshot.steps), goal: STEP_GOAL },
      },
    }
    const arrived = nextMap.currentNodeId !== save.map.currentNodeId
    let shardSource: EvolutionShardSource | null = null
    if (arrived) {
      const grant = grantNodeReward(nextSave, locationId, nextMap.currentNodeId, todayKey, snapshot.steps)
      nextSave = grant.save
      shardSource = grant.shardSource
    }
    const streakUpdate = registerActiveDay(nextSave.streak, todayKey, snapshot.steps)
    if (streakUpdate.streak !== nextSave.streak) nextSave = { ...nextSave, streak: streakUpdate.streak }
    setSave(nextSave)
    if (shardSource) {
      setBecomingNotice({
        source: shardSource,
        openWorldAfterClose: nextMap.currentNodeId === getLocationMap(locationId).finalNodeId,
      })
    }
    if (arrived && shouldShowPointEvent(locationId, nextMap.currentNodeId)) queueArrival(nextMap.currentNodeId)
  }, [save, todayKey, queueArrival])

  useEffect(() => {
    if (!isBooted) return undefined
    const syncOnReturn = () => {
      if (document.visibilityState === 'visible') void refreshTodaySteps()
    }
    document.addEventListener('visibilitychange', syncOnReturn)
    window.addEventListener('focus', syncOnReturn)
    return () => {
      document.removeEventListener('visibilitychange', syncOnReturn)
      window.removeEventListener('focus', syncOnReturn)
    }
  }, [isBooted, refreshTodaySteps])

  const beginRoute = (targetId: string) => {
    const locationId = save.world.currentLocationId
    const nextMap = startMapRoute(save.map, targetId, locationId, save.story)
    const arrived = nextMap.currentNodeId !== save.map.currentNodeId
    const rewardGrant = arrived
      ? grantNodeReward({ ...save, map: nextMap }, locationId, nextMap.currentNodeId, todayKey, steps)
      : { save: { ...save, map: nextMap }, shardSource: null }
    const nextSave = rewardGrant.save
    setSave(nextSave)
    if (rewardGrant.shardSource) {
      setBecomingNotice({
        source: rewardGrant.shardSource,
        openWorldAfterClose: nextMap.currentNodeId === getLocationMap(locationId).finalNodeId,
      })
    }
    if (arrived && shouldShowPointEvent(locationId, nextMap.currentNodeId)) queueArrival(nextMap.currentNodeId)
  }

  const upgradeCamp = (upgradeId: CampUpgradeId, coinCost: number) => {
    setSave((prev) => {
      if (prev.coins < coinCost || prev.camp[upgradeId] >= 3) return prev
      return {
        ...prev,
        coins: prev.coins - coinCost,
        camp: { ...prev.camp, [upgradeId]: prev.camp[upgradeId] + 1 },
      }
    })
  }

  const beginDevPress = () => {
    if (devPressTimer.current !== null) window.clearTimeout(devPressTimer.current)
    devPressTimer.current = window.setTimeout(() => {
      setIsDevPanelOpen(true)
      devPressTimer.current = null
    }, 650)
  }

  const cancelDevPress = () => {
    if (devPressTimer.current !== null) window.clearTimeout(devPressTimer.current)
    devPressTimer.current = null
  }

  const addRouteSteps = (amount: number) => {
    const locationId = save.world.currentLocationId
    const nextMap = addDebugRouteSteps(save.map, amount, locationId)
    const arrived = nextMap.currentNodeId !== save.map.currentNodeId
    const rewardGrant = arrived
      ? grantNodeReward({ ...save, map: nextMap }, locationId, nextMap.currentNodeId, todayKey, steps)
      : { save: { ...save, map: nextMap }, shardSource: null }
    const nextSave = rewardGrant.save
    setSave(nextSave)
    if (rewardGrant.shardSource) {
      setBecomingNotice({
        source: rewardGrant.shardSource,
        openWorldAfterClose: nextMap.currentNodeId === getLocationMap(locationId).finalNodeId,
      })
    }
    if (arrived && shouldShowPointEvent(locationId, nextMap.currentNodeId)) queueArrival(nextMap.currentNodeId)
  }

  const completeActiveRoute = () => {
    const activeNode = save.map.activeTargetId ? getMapNode(save.map.activeTargetId, save.world.currentLocationId) : null
    if (!activeNode) return
    addRouteSteps(Math.max(0, activeNode.cost - save.map.activeProgress))
  }

  const addDebugXp = (amount: number) => {
    setSave((prev) => {
      const currentDay = prev.daily[todayKey] ?? createDayEntry(todayKey, steps)
      return {
        ...prev,
        daily: {
          ...prev.daily,
          [todayKey]: { ...currentDay, xp: currentDay.xp + amount },
        },
      }
    })
  }

  const addDebugCoins = (amount: number) => {
    setSave((prev) => ({ ...prev, coins: prev.coins + amount }))
  }

  const updateNotificationSettings = (notifications: NotificationSettings) => {
    setSave((prev) => ({ ...prev, notifications }))
    void scheduleDailyReminders(notifications).catch((error) => {
      console.warn('Не удалось обновить уведомления Shadow Path.', error)
    })
  }

  const addDebugShard = () => {
    setSave((prev) => ({ ...prev, evolution: grantEvolutionShards(prev.evolution, 1) }))
  }

  const advanceEvolution = () => {
    setSave((prev) => ({ ...prev, evolution: advanceHeroEvolution(prev.evolution) }))
  }

  const showDebugNightEvent = () => {
    setSave((prev) => ({
      ...prev,
      night: {
        ...prev.night,
        pending: createNightEvent({
          date: todayKey,
          locationId: prev.world.currentLocationId,
          daysAway: 1,
          camp: prev.camp,
          story: prev.story,
          history: prev.night.history,
        }, true),
      },
    }))
    setIsDevPanelOpen(false)
  }

  const showDebugNotification = async () => {
    const result = await scheduleDebugNotification()
    window.alert(result.scheduled ? 'Пробное уведомление придёт через 10 секунд.' : 'Уведомление не запланировано.')
  }

  const resetProgress = () => {
    const reset = createEmptySave()
    reset.daily[todayKey] = createDayEntry(todayKey, steps)
    reset.map.creditedDate = todayKey
    reset.map.creditedSteps = steps
    setArrivalNodeId(null)
    setIsArrivalQueued(false)
    setActiveEncounterId(null)
    setActiveLockpickingNodeId(null)
    setActiveBattleNodeId(null)
    setBattleReport(null)
    setBecomingNotice(null)
    setPrologueSceneNodeId(null)
    setIsPrologueSceneOpen(false)
    setIsPrologueLocalMapOpen(false)
    setIsDevPanelOpen(false)
    setSave(reset)
  }

  const travelToLocation = (locationId: string) => {
    const canTravel = save.map.locationCompleted && isLocationPlayable(locationId) && getWorldNeighbors(save.world.currentLocationId).includes(locationId)
    if (!canTravel) return
    setSave((prev) => {
      const storedCurrent = { ...prev.world.locationProgress, [prev.world.currentLocationId]: prev.map }
      const targetMap = carryStepCreditToMap(prev.map, storedCurrent[locationId] ?? createInitialMapProgress(locationId))
      return {
        ...prev,
        map: targetMap,
        world: { ...prev.world, currentLocationId: locationId, locationProgress: storedCurrent },
      }
    })
    setIsWorldMapOpen(false)
    setPrologueSceneNodeId(null)
    setIsPrologueSceneOpen(false)
    setIsPrologueLocalMapOpen(false)
    setActiveTab('map')
  }

  const currentWorldLocation = getWorldLocation(save.world.currentLocationId)
  const currentWorldRegion = currentWorldLocation ? getWorldRegion(currentWorldLocation.regionId) : undefined
  const currentLocationMap = getLocationMap(save.world.currentLocationId)
  const currentMapNode = getMapNode(save.map.currentNodeId, save.world.currentLocationId)
  const isPrologueShell = save.world.currentLocationId === 'silent-ruins'
  const pendingPrologueNodeId = isPrologueShell ? getPendingPrologueSceneNodeId(save) : null
  const journeySceneNodeId = prologueSceneNodeId ?? pendingPrologueNodeId ?? arrivalNodeId
  const isPrologueJourney = isPrologueShell && activeTab === 'map'
  const isEveningNow = new Date().getHours() >= 20
  const eveningActiveNode = save.map.activeTargetId ? getMapNode(save.map.activeTargetId, save.world.currentLocationId) : null
  const eveningRouteStatus = eveningActiveNode
    ? `Герой в пути к «${eveningActiveNode.title}» — осталось ${fmt(Math.max(0, eveningActiveNode.cost - save.map.activeProgress))} шагов.`
    : save.map.locationCompleted
      ? 'Локация исследована. Впереди — выбор новой дороги на карте мира.'
      : 'Герой отдыхает у костра. Утром можно выбрать новую дорогу.'
  const pendingEncounterId = !isPrologueShell && !arrivalNodeId && !isArrivalQueued && currentMapNode?.encounterId && !save.story.completedEncounterIds.includes(currentMapNode.encounterId)
    ? currentMapNode.encounterId
    : null
  const displayedEncounterId = activeEncounterId ?? pendingEncounterId
  const pendingLockpickingNodeId = !isPrologueShell && !arrivalNodeId && !isArrivalQueued && !displayedEncounterId && currentMapNode && getLockpickingConfig(currentMapNode.id) && !save.minigames.lockpicking[currentMapNode.id]
    ? currentMapNode.id
    : null
  const displayedLockpickingNodeId = activeLockpickingNodeId ?? pendingLockpickingNodeId
  const pendingBattleNodeId = !isPrologueShell && !battleReport && !arrivalNodeId && !isArrivalQueued && !displayedEncounterId && !displayedLockpickingNodeId && currentMapNode && getConnectBattleConfig(currentMapNode.id) && !save.minigames.battles[currentMapNode.id]
    ? currentMapNode.id
    : null
  const displayedBattleNodeId = activeBattleNodeId ?? pendingBattleNodeId

  const resolveEncounter = (encounterId: string, choiceId: string) => {
    setSave((prev) => {
      const resolved = resolveStoryEncounter(prev.story, encounterId, choiceId)
      const currentDay = prev.daily[todayKey] ?? createDayEntry(todayKey, steps)
      return {
        ...prev,
        coins: prev.coins + resolved.coins,
        story: resolved.progress,
        daily: {
          ...prev.daily,
          [todayKey]: { ...currentDay, xp: currentDay.xp + resolved.xp },
        },
      }
    })
  }

  const resolveNightChoice = (choiceId: string) => {
    setSave((prev) => {
      const resolved = resolveNightEvent(prev.night, choiceId)
      const currentDay = prev.daily[todayKey] ?? createDayEntry(todayKey, steps)
      return {
        ...prev,
        coins: prev.coins + resolved.coins,
        night: resolved.progress,
        daily: { ...prev.daily, [todayKey]: { ...currentDay, xp: currentDay.xp + resolved.xp } },
      }
    })
    if (deferredArrivalNodeId) {
      const nodeId = deferredArrivalNodeId
      setDeferredArrivalNodeId(null)
      queueArrival(nodeId)
    }
  }

  const resolveLockpickingCache = (nodeId: string, ratings: LockpickingPinRating[]) => {
    const result = resolveLockpicking(nodeId, ratings)
    setSave((prev) => {
      if (prev.minigames.lockpicking[nodeId]) return prev
      const currentDay = prev.daily[todayKey] ?? createDayEntry(todayKey, steps)
      return {
        ...prev,
        coins: prev.coins + result.coins,
        daily: { ...prev.daily, [todayKey]: { ...currentDay, xp: currentDay.xp + result.xp } },
        minigames: {
          ...prev.minigames,
          lockpicking: { ...prev.minigames.lockpicking, [nodeId]: result },
        },
      }
    })
    return result
  }

  const resolveBattle = (nodeId: string, chains: ConnectBattleChain[], keepLegacyModalActive = true) => {
    const result = resolveConnectBattle(nodeId, chains, save.story.abilities)
    if (keepLegacyModalActive) setActiveBattleNodeId(nodeId)
    setSave((prev) => {
      if (prev.minigames.battles[nodeId]) return prev
      const currentDay = prev.daily[todayKey] ?? createDayEntry(todayKey, steps)
      return {
        ...prev,
        coins: prev.coins + result.coins,
        daily: { ...prev.daily, [todayKey]: { ...currentDay, xp: currentDay.xp + result.xp } },
        minigames: {
          ...prev.minigames,
          battles: { ...prev.minigames.battles, [nodeId]: result },
        },
      }
    })
    return result
  }

  const resolvePointEvent = (locationId: string, result: PointEventResult) => {
    const key = getPointEventSaveKey(locationId, result.nodeId)
    setSave((prev) => {
      if (prev.minigames.pointEvents[key]) return prev
      const currentDay = prev.daily[todayKey] ?? createDayEntry(todayKey, steps)
      return {
        ...prev,
        coins: prev.coins + result.coins,
        daily: { ...prev.daily, [todayKey]: { ...currentDay, xp: currentDay.xp + result.xp } },
        minigames: {
          ...prev.minigames,
          pointEvents: { ...prev.minigames.pointEvents, [key]: result },
        },
      }
    })
    return result
  }

  return (
    <main className="appShell">
      <section className={`phoneFrame ${isPrologueJourney ? 'prologueMode' : ''}`} aria-label="Shadow Path">
        {isPrologueJourney ? (
          <section className="prologueContent">
            <PrologueJourney
              mapProgress={save.map}
              onBeginRoute={beginRoute}
              onHeroPointerCancel={cancelDevPress}
              onHeroPointerDown={beginDevPress}
              onHeroPointerUp={cancelDevPress}
              onOpenCamp={() => {
                if (isEveningNow) setSave((prev) => ({ ...prev, eveningShownDate: todayKey }))
                setActiveTab('camp')
              }}
              onOpenDevPanel={() => setIsDevPanelOpen(true)}
              onOpenHero={() => setActiveTab('hero')}
              onOpenLocalMap={() => setIsPrologueLocalMapOpen(true)}
              onOpenScene={(nodeId) => {
                setPrologueSceneNodeId(nodeId)
                setIsPrologueSceneOpen(true)
                setArrivalNodeId(null)
              }}
              onOpenWorld={() => setIsWorldMapOpen(true)}
              onStayOnPath={() => setSave((prev) => ({ ...prev, eveningShownDate: todayKey }))}
              pendingNodeId={journeySceneNodeId}
              sceneSuspended={Boolean(prologueSceneNodeId && !isPrologueSceneOpen)}
              showEvening={isEveningNow && save.eveningShownDate !== todayKey && !save.night.pending}
              steps={steps}
              story={save.story}
            />
          </section>
        ) : (
          <>
        <header className="topBar">
          <div className="identity">
            <button
              aria-label="Аватар героя. Удерживайте для тестового меню"
              className="avatar"
              onContextMenu={(event) => event.preventDefault()}
              onDoubleClick={() => setIsDevPanelOpen(true)}
              onPointerCancel={cancelDevPress}
              onPointerDown={beginDevPress}
              onPointerLeave={cancelDevPress}
              onPointerUp={cancelDevPress}
              type="button"
            >
              <img alt="" src="/generated-assets/character.png" />
            </button>
            <div>
              <span className="eyebrow">Shadowwalker</span>
              <strong>Уровень {level}</strong>
            </div>
          </div>

          <div className="resources" aria-label="Ресурсы">
            <button
              aria-expanded={isStepsDetailOpen}
              className="stepsPlaque"
              onClick={() => setIsStepsDetailOpen((open) => !open)}
              title="Шаги за сегодня. Нажми, чтобы увидеть подробности"
              type="button"
            >
              <small>Шаги</small>{fmt(steps)}
            </button>
            <span className="coinBalance" title="Монеты"><small>Монеты</small><b><img alt="" src="/generated-assets/coin.png" />{fmt(save.coins)}</b></span>
          </div>
        </header>

        {isStepsDetailOpen ? (
          <div className="stepsDetail" role="status" aria-label="Подробности шагов">
            <span><small>Всего за день</small><strong>{fmt(steps)}</strong></span>
            <span><small>В текущем переходе</small><strong>{fmt(save.map.activeProgress)}</strong></span>
            <span><small>Свободный запас</small><strong>{fmt(save.map.stepBank)}</strong></span>
          </div>
        ) : null}

        <div className="levelTrack" aria-label="Прогресс уровня">
          <span style={{ width: `${levelProgress.percent}%` }} />
        </div>

        <section className={`contentPane ${activeTab === 'map' ? 'mapContent' : ''}`}>
          {activeTab === 'map' ? (
            <MapScreen
              beginRoute={beginRoute}
              dailyAverageSteps={dailyAverageSteps}
              key={save.world.currentLocationId}
              locationId={save.world.currentLocationId}
              locationTitle={currentWorldLocation?.title ?? 'Неизвестная локация'}
              mapProgress={save.map}
              openWorldMap={() => setIsWorldMapOpen(true)}
              regionId={currentWorldLocation?.regionId ?? 'silent-marches'}
              regionTitle={currentWorldRegion?.title ?? 'Неизвестный регион'}
              story={save.story}
            />
          ) : null}

          {activeTab === 'hero' ? <TeamScreen evolution={save.evolution} level={level} levelProgress={levelProgress} openEvolutionTreeSignal={evolutionTreeOpenSignal} onAdvanceEvolution={advanceEvolution} ownedAbilities={save.story.abilities} /> : null}
          {activeTab === 'camp' ? <CampScreen onUpgrade={upgradeCamp} save={save} /> : null}
          {activeTab === 'journal' ? <ProfileScreen journal={save.story.journal} lastDays={lastDays} notifications={save.notifications} onUpdateNotifications={updateNotificationSettings} streak={save.streak} totalXp={totalXp} /> : null}
        </section>

        <nav className="bottomTabs" aria-label="Основная навигация">
          {tabs.map((tab) => (
            <button
              className={`tab ${activeTab === tab.id ? 'active' : ''}`}
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              type="button"
            >
              <span className="tabIcon">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
          </>
        )}

        {isPrologueJourney && isPrologueLocalMapOpen ? (
          <section className="prologueMapOverlay" aria-label="Функциональная карта пролога">
            <button className="prologueMapBack" onClick={() => setIsPrologueLocalMapOpen(false)} type="button">Назад к пути</button>
            <MapScreen
              beginRoute={(targetId) => {
                beginRoute(targetId)
                setIsPrologueLocalMapOpen(false)
              }}
              dailyAverageSteps={dailyAverageSteps}
              key={`prologue-functional-map:${save.map.currentNodeId}:${save.map.activeTargetId ?? 'idle'}`}
              locationId={save.world.currentLocationId}
              locationTitle={currentWorldLocation?.title ?? 'Руины у Немого шпиля'}
              mapProgress={save.map}
              openWorldMap={() => setIsWorldMapOpen(true)}
              regionId={currentWorldLocation?.regionId ?? 'silent-marches'}
              regionTitle={currentWorldRegion?.title ?? 'Безмолвные пределы'}
              story={save.story}
            />
          </section>
        ) : null}

        {isPrologueShell && prologueSceneNodeId ? (
          <PrologueEncounter
            camp={save.camp}
            key={prologueSceneNodeId}
            nodeId={prologueSceneNodeId}
            onClose={() => setIsPrologueSceneOpen(false)}
            onContinue={() => {
              const completedLocation = prologueSceneNodeId === currentLocationMap.finalNodeId
              setIsPrologueSceneOpen(false)
              setPrologueSceneNodeId(null)
              setArrivalNodeId(null)
              if (completedLocation && !becomingNotice) setIsWorldMapOpen(true)
            }}
            onResolveBattle={(nodeId, chains) => resolveBattle(nodeId, chains, false)}
            onResolveLockpicking={resolveLockpickingCache}
            onResolvePointEvent={(result) => resolvePointEvent('silent-ruins', result)}
            onResolveStory={resolveEncounter}
            open={isPrologueSceneOpen}
            save={save}
          />
        ) : null}

        {!isPrologueShell && arrivalNodeId ? (
          <PointEventNotice
            camp={save.camp}
            key={`${save.world.currentLocationId}:${arrivalNodeId}`}
            locationId={save.world.currentLocationId}
            nodeId={arrivalNodeId}
            onClose={() => {
              const node = getMapNode(arrivalNodeId, save.world.currentLocationId)
              const encounterId = node?.encounterId
              const completedLocation = arrivalNodeId === currentLocationMap.finalNodeId
              const lockpickingConfig = node ? getLockpickingConfig(node.id) : undefined
              const battleConfig = node ? getConnectBattleConfig(node.id) : undefined
              setArrivalNodeId(null)
              if (encounterId && !save.story.completedEncounterIds.includes(encounterId)) setActiveEncounterId(encounterId)
              else if (lockpickingConfig && !save.minigames.lockpicking[lockpickingConfig.nodeId]) setActiveLockpickingNodeId(lockpickingConfig.nodeId)
              else if (battleConfig && !save.minigames.battles[battleConfig.nodeId]) setActiveBattleNodeId(battleConfig.nodeId)
              else if (completedLocation && !becomingNotice) setIsWorldMapOpen(true)
            }}
            onResolve={(result) => resolvePointEvent(save.world.currentLocationId, result)}
          />
        ) : null}

        {!isPrologueShell && displayedEncounterId ? (
          <StoryEncounterModal
            encounter={getStoryEncounter(displayedEncounterId)}
            onClose={() => setActiveEncounterId(null)}
            onResolve={(choiceId) => {
              setActiveEncounterId(displayedEncounterId)
              resolveEncounter(displayedEncounterId, choiceId)
            }}
            storyIdentity={getDominantIdentityPath(save.story)}
            ownedAbilities={save.story.abilities}
          />
        ) : null}

        {isWorldMapOpen ? (
          <WorldMap
            onClose={() => setIsWorldMapOpen(false)}
            onTravel={travelToLocation}
            progress={save.world}
          />
        ) : null}

        {!isPrologueShell && displayedLockpickingNodeId ? (
          <LockpickingModal
            nodeId={displayedLockpickingNodeId}
            onClose={() => setActiveLockpickingNodeId(null)}
            onResolve={resolveLockpickingCache}
          />
        ) : null}

        {!isPrologueShell && displayedBattleNodeId ? (
          <ConnectBattleModal
            nodeId={displayedBattleNodeId}
            onClose={(result) => {
              setActiveBattleNodeId(null)
              if (result) setBattleReport({ nodeId: result.nodeId, locationId: save.world.currentLocationId, result })
            }}
            onResolve={resolveBattle}
            ownedAbilities={save.story.abilities}
          />
        ) : null}

        {!isPrologueShell && battleReport && !displayedBattleNodeId ? (
          <BattleResultNotice
            camp={save.camp}
            locationId={battleReport.locationId}
            nodeId={battleReport.nodeId}
            onClose={() => setBattleReport(null)}
            result={battleReport.result}
          />
        ) : null}

        {becomingNotice && !arrivalNodeId && !isArrivalQueued && !displayedEncounterId && !displayedLockpickingNodeId && !displayedBattleNodeId && !battleReport && (!isPrologueShell || (!pendingPrologueNodeId && !prologueSceneNodeId)) ? (
          <BecomingNotice
            evolution={save.evolution}
            onAdvanceEvolution={advanceEvolution}
            onClose={() => {
              const shouldOpenWorld = becomingNotice.openWorldAfterClose
              setBecomingNotice(null)
              if (shouldOpenWorld) setIsWorldMapOpen(true)
            }}
            onOpenTree={() => {
              const shouldOpenWorld = becomingNotice.openWorldAfterClose
              setBecomingNotice(null)
              setActiveTab('hero')
              setEvolutionTreeOpenSignal((signal) => signal + 1)
              if (shouldOpenWorld) setIsWorldMapOpen(false)
            }}
            source={becomingNotice.source}
          />
        ) : null}

        {save.night.pending && !arrivalNodeId && !displayedEncounterId && !displayedLockpickingNodeId && !displayedBattleNodeId && !battleReport && !becomingNotice && !isWorldMapOpen && !isDevPanelOpen && (!isPrologueShell || (!pendingPrologueNodeId && !prologueSceneNodeId)) ? (
          <NightEventModal
            event={save.night.pending}
            morningNote={deferredArrivalNodeId ? `Утром герой продолжил путь и достиг: «${getMapNode(deferredArrivalNodeId, save.world.currentLocationId)?.title ?? 'новая точка'}».` : null}
            onResolve={resolveNightChoice}
          />
        ) : null}

        {!isPrologueJourney && isEveningNow && save.eveningShownDate !== todayKey && !save.night.pending && !arrivalNodeId && !isArrivalQueued && !displayedEncounterId && !displayedLockpickingNodeId && !displayedBattleNodeId && !battleReport && !becomingNotice && !isWorldMapOpen && !isDevPanelOpen ? (
          <CampfireEveningModal
            dateKey={todayKey}
            onClose={() => setSave((prev) => ({ ...prev, eveningShownDate: todayKey }))}
            routeStatus={eveningRouteStatus}
            steps={steps}
            streak={save.streak}
            xp={today.xp}
          />
        ) : null}

        {isDevPanelOpen ? (
          <DevPanel
            canCompleteRoute={Boolean(save.map.activeTargetId)}
            coins={save.coins}
            evolution={save.evolution}
            onAddCoins={addDebugCoins}
            onAddShard={addDebugShard}
            onAddRouteSteps={addRouteSteps}
            onAddXp={addDebugXp}
            onClose={() => setIsDevPanelOpen(false)}
            onCompleteRoute={completeActiveRoute}
            onAdvanceEvolution={advanceEvolution}
            onShowNotification={showDebugNotification}
            onShowNight={showDebugNightEvent}
            onReset={resetProgress}
            routeSteps={save.map.stepBank}
            totalXp={totalXp}
          />
        ) : null}
      </section>
    </main>
  )
}

type MapScreenProps = {
  beginRoute: (targetId: string) => void
  dailyAverageSteps: number
  locationId: string
  locationTitle: string
  mapProgress: MapProgress
  openWorldMap: () => void
  regionId: string
  regionTitle: string
  story: StoryProgress
}

function MapScreen({
  beginRoute,
  dailyAverageSteps,
  locationId,
  locationTitle,
  mapProgress,
  openWorldMap,
  regionId,
  regionTitle,
  story,
}: MapScreenProps) {
  const locationMap = getLocationMap(locationId)
  const availableTargetIds = getAvailableTargetIds(mapProgress, locationId, story)
  const hintedTargetIds = locationMap.edges
    .filter((edge) => edge.from === mapProgress.currentNodeId && !availableTargetIds.includes(edge.to))
    .map((edge) => edge.to)
  const [preferredNodeId, setPreferredNodeId] = useState(() => mapProgress.activeTargetId ?? availableTargetIds[0] ?? mapProgress.currentNodeId)
  const [confirmTargetId, setConfirmTargetId] = useState<string | null>(null)
  const inspectableIds = mapProgress.activeTargetId ? [mapProgress.activeTargetId] : [...availableTargetIds, ...hintedTargetIds]
  const selectedNodeId = inspectableIds.includes(preferredNodeId)
    ? preferredNodeId
    : inspectableIds[0] ?? mapProgress.currentNodeId

  const selectedNode = availableTargetIds.includes(selectedNodeId) ? getMapNode(selectedNodeId, locationId) : undefined
  const inspectedNode = getMapNode(selectedNodeId, locationId)
  const activeNode = mapProgress.activeTargetId ? getMapNode(mapProgress.activeTargetId, locationId) : null
  const routeProgress = activeNode ? mapProgress.activeProgress : 0
  const routeTarget = activeNode ?? selectedNode
  const routePercent = routeTarget?.cost ? Math.min(100, Math.round((routeProgress / routeTarget.cost) * 100)) : 100
  const routeRemaining = routeTarget ? Math.max(0, routeTarget.cost - routeProgress) : 0
  const currentNode = getMapNode(mapProgress.currentNodeId, locationId)
  const heroProgress = activeNode?.cost ? Math.min(1, mapProgress.activeProgress / activeNode.cost) : 0
  const heroPosition = currentNode && activeNode
    ? {
        x: currentNode.x + (activeNode.x - currentNode.x) * heroProgress,
        y: currentNode.y + (activeNode.y - currentNode.y) * heroProgress,
      }
    : currentNode

  const getEdgeState = (from: string, to: string) => {
    return getLocalRouteVisualState(from, to, mapProgress, locationMap, availableTargetIds, selectedNodeId)
  }

  const mapAreaRef = useRef<HTMLElement>(null)
  useEffect(() => {
    const area = mapAreaRef.current
    const scroller = area?.closest('.mapContent') as HTMLElement | null
    const focus = activeNode ?? currentNode
    if (!area || !scroller || !focus) return

    const frame = requestAnimationFrame(() => {
      const targetTop = area.offsetTop + area.offsetHeight * (focus.y / 100) - scroller.clientHeight * 0.42
      const maxTop = Math.max(0, scroller.scrollHeight - scroller.clientHeight)
      scroller.scrollTo({ top: Math.min(Math.max(0, targetTop), maxTop), behavior: 'smooth' })
    })

    return () => cancelAnimationFrame(frame)
  }, [activeNode, currentNode, locationId, mapProgress.activeTargetId, mapProgress.currentNodeId])

  const inspectedRole = inspectedNode ? getLocalNodeVisualRole(inspectedNode, locationMap) : undefined
  const inspectedState = inspectedNode
    ? getLocalNodeVisualState(inspectedNode, mapProgress, locationMap, availableTargetIds, selectedNodeId)
    : undefined
  const inspectedEdge = inspectedNode ? locationMap.edges.find((edge) => edge.from === mapProgress.currentNodeId && edge.to === inspectedNode.id) : undefined
  const routePanelTitle = routeTarget?.title ?? inspectedNode?.title ?? 'Путь завершён'
  const routePanelDescription = routeTarget
    ? `${getLocalNodePresentation(getLocalNodeVisualRole(routeTarget, locationMap)).label} · ${routeTarget.description}`
    : inspectedNode && inspectedRole && inspectedState === 'hinted'
      ? `${getLocalNodePresentation(inspectedRole).label} · ${getLocalLockedHint(inspectedNode, inspectedRole, Boolean(inspectedEdge?.requiredStoryChoice))}`
      : null

  return (
    <div className={`mapScreen region-${regionId} location-${locationMap.theme}`}>
      <div className="mapHud">
        <div className="mapTitle">
          <span>{regionTitle}</span>
          <strong>{locationTitle}</strong>
        </div>

        <button className="worldMapButton" onClick={openWorldMap} type="button">
          <span aria-hidden>⌖</span> Мир
        </button>
      </div>

      <section className="mapArea" aria-label="Карта руин" ref={mapAreaRef}>
        <img className="mapLayer mapRegionLayer" src="/generated-assets/maps/region-01-distant-silent-spire.png" alt="" />
        <img className="mapLayer mapLocationLayer" src="/generated-assets/maps/location-ruins-01.png" alt="" />
        <div className="mapShade" aria-hidden />

        <svg className="routeGraph" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
          {locationMap.edges.map((edge) => {
            const from = getMapNode(edge.from, locationId)
            const to = getMapNode(edge.to, locationId)
            if (!from || !to) return null
            return (
              <line
                className={`routeEdge ${getEdgeState(edge.from, edge.to)}`}
                key={`${edge.from}-${edge.to}`}
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                vectorEffect="non-scaling-stroke"
              />
            )
          })}
        </svg>

        {locationMap.nodes.map((node) => {
          const role = getLocalNodeVisualRole(node, locationMap)
          const state = getLocalNodeVisualState(node, mapProgress, locationMap, availableTargetIds, selectedNodeId)
          const canSelect = state === 'available' || state === 'selected' || state === 'active' || state === 'hinted'
          const { icon, label } = getLocalNodePresentation(role)
          return (
            <button
              aria-label={`${label}: ${node.title}. ${state === 'locked' || state === 'hinted' ? 'Путь пока закрыт' : node.description}`}
              className={`mapNode ${state} role-${role} ${node.kind} ${selectedNodeId === node.id ? 'selected' : ''}`}
              disabled={!canSelect}
              key={node.id}
              onClick={() => setPreferredNodeId(node.id)}
              style={{ left: `${node.x}%`, top: `${node.y}%` }}
              type="button"
            >
              <span aria-hidden>{icon}</span>
              <small>{state === 'current' ? 'Вы здесь' : label}</small>
            </button>
          )
        })}

        {heroPosition ? (
          <img
            className={`mapHero ${activeNode ? 'travelling' : ''}`}
            src="/generated-assets/character.png"
            alt={activeNode ? `Герой движется к точке ${activeNode.title}` : 'Текущее положение героя'}
            style={{ left: `${heroPosition.x}%`, top: `${heroPosition.y}%` }}
          />
        ) : null}

        <section className="routePanel">
          <div className="routeHeading">
            <div>
              <span className="eyebrow">{activeNode ? 'Текущий путь' : 'Выбранный путь'}</span>
              <h1>{routePanelTitle}</h1>
              {routePanelDescription ? <p className="routeDescription">{routePanelDescription}</p> : null}
              {currentNode?.tutorial ? <small className="routeHint">{currentNode.tutorial}</small> : null}
            </div>
            {routeTarget ? <strong>{activeNode ? `Ещё ${fmt(routeRemaining)}` : `${fmt(routeTarget.cost)} шагов`}</strong> : null}
          </div>

          {routeTarget ? (
            <div className="routeActions">
              {activeNode ? (
                <div className="stepBar routeBar" aria-label="Прогресс выбранного пути">
                  <span style={{ width: `${routePercent}%` }} />
                </div>
              ) : null}
              {activeNode ? (
                <button className="primaryBtn compact" disabled type="button">Путь выбран</button>
              ) : confirmTargetId === routeTarget.id ? (
                <div className="routeConfirm">
                  <p>
                    {(() => {
                      const remainingAfterBank = Math.max(0, routeTarget.cost - mapProgress.stepBank)
                      const estimateDays = remainingAfterBank === 0 ? 0 : Math.max(1, Math.ceil(remainingAfterBank / dailyAverageSteps))
                      return estimateDays === 0
                        ? `Переход возьмёт ${fmt(routeTarget.cost)} шагов — запаса хватит уже сейчас. Вложенные шаги нельзя вернуть.`
                        : `Переход возьмёт ${fmt(routeTarget.cost)} шагов — примерно ${estimateDays} ${pluralDays(estimateDays)} пути при твоём темпе. Вложенные шаги нельзя вернуть.`
                    })()}
                  </p>
                  <div className="routeConfirmButtons">
                    <button
                      className="primaryBtn compact"
                      onClick={() => {
                        setConfirmTargetId(null)
                        beginRoute(routeTarget.id)
                      }}
                      type="button"
                    >
                      Подтвердить путь
                    </button>
                    <button className="secondaryBtn compact" onClick={() => setConfirmTargetId(null)} type="button">Отмена</button>
                  </div>
                </div>
              ) : (
                <button
                  className="primaryBtn compact"
                  onClick={() => setConfirmTargetId(routeTarget.id)}
                  type="button"
                >
                  {mapProgress.stepBank >= routeTarget.cost ? 'Отправиться' : 'Выбрать путь'}
                </button>
              )}
            </div>
          ) : inspectedNode && inspectedState === 'hinted' ? (
            <div className="routeActions">
              <button className="secondaryBtn compact" disabled type="button">Закрыто</button>
            </div>
          ) : (
            <p className="successNote">Локация исследована.</p>
          )}
        </section>
      </section>
    </div>
  )
}

function TeamScreen({
  evolution,
  level,
  levelProgress,
  openEvolutionTreeSignal,
  onAdvanceEvolution,
  ownedAbilities,
}: {
  evolution: HeroEvolutionState
  level: number
  levelProgress: { current: number; target: number; percent: number }
  openEvolutionTreeSignal: number
  onAdvanceEvolution: () => void
  ownedAbilities: string[]
}) {
  const [isEvolutionTreeOpen, setIsEvolutionTreeOpen] = useState(false)
  useEffect(() => {
    if (openEvolutionTreeSignal <= 0) return undefined
    const timer = window.setTimeout(() => setIsEvolutionTreeOpen(true), 0)
    return () => window.clearTimeout(timer)
  }, [openEvolutionTreeSignal])
  const unlockedAbilities = ownedAbilities.map((id) => abilityInfo[id]).filter(Boolean)
  const shardLedger = evolution.shards
  const nextEvolution = getNextEvolutionRequirement(evolution)
  const stageTitle = EVOLUTION_STAGE_TITLES[evolution.stage]

  return (
    <section className="screenStack">
      <div className="sectionHeader">
        <div>
          <span className="eyebrow">Герой</span>
          <h1>Странник тени</h1>
        </div>
        <strong>Lv {level}</strong>
      </div>

      <div className="characterPanel">
        <div className="portrait heroPortrait" aria-hidden>
          <img alt="" src="/generated-assets/character.png" />
        </div>
        <div>
          <h2>{stageTitle}</h2>
          <p className="muted">{EVOLUTION_STAGE_DESCRIPTIONS[evolution.stage]}</p>
        </div>
      </div>

      <section className="heroLevelPanel" aria-label="Прогресс героя">
        <div>
          <span className="eyebrow">Уровень {level}</span>
          <strong>{levelProgress.percent}% до следующего уровня</strong>
        </div>
        <div className="heroXpTrack" aria-label={`XP уровня: ${levelProgress.current} из ${levelProgress.target}`}>
          <span style={{ width: `${levelProgress.percent}%` }} />
        </div>
        <small>{fmt(levelProgress.current)} / {fmt(levelProgress.target)} XP этого уровня · следующий уровень требует больше: {fmt(getLevelXpTarget(level + 1))} XP</small>
      </section>

      <div className="heroInfoGrid">
        <div>
          <span>Стадия</span>
          <strong>{stageTitle}</strong>
          <small>{EVOLUTION_STAGE_DESCRIPTIONS[evolution.stage]}</small>
        </div>
        <div>
          <span>Порог</span>
          <strong>Эволюция</strong>
          <small>{getEvolutionGateCopy(evolution)}</small>
        </div>
      </div>

      <section className="evolutionPanel" aria-label="Эволюция героя">
        <div className="panelTitleRow">
          <div>
            <span className="eyebrow">Эволюция</span>
            <strong>{nextEvolution ? `${nextEvolution.title} требует ${nextEvolution.shardCost} ${pluralShard(nextEvolution.shardCost)}.` : 'Следующие ветви будут открываться условиями пути.'}</strong>
          </div>
          <div className="panelActionGroup">
            <button className="primaryBtn compact" onClick={() => setIsEvolutionTreeOpen(true)} type="button">
              Открыть древо
            </button>
          </div>
        </div>
        <div className="shardLedger" aria-label="Осколки героя">
          <span><strong>{shardLedger.found}</strong> найдено</span>
          <span><strong>{shardLedger.free}</strong> свободно</span>
          <span><strong>{shardLedger.invested}</strong> вложено</span>
        </div>
        <p>Сейчас герой видит общий ствол: Нечто → Shadowborn → Гуль. Дальние формы мерцают как возможные судьбы, а не как покупка силы.</p>
      </section>

      {isEvolutionTreeOpen ? (
        <EvolutionTreeModal
          level={level}
          onAdvanceEvolution={onAdvanceEvolution}
          onClose={() => setIsEvolutionTreeOpen(false)}
          ownedAbilities={ownedAbilities}
          shardLedger={shardLedger}
          stage={evolution.stage}
        />
      ) : null}

      <section className="abilitiesPanel" aria-label="Способности героя">
        <span className="eyebrow">Способности</span>
        {unlockedAbilities.length ? (
          <div className="abilityList">
            {unlockedAbilities.map((ability) => (
              <article key={ability.title}>
                <strong>{ability.title}</strong>
                <p>{ability.text}</p>
              </article>
            ))}
          </div>
        ) : (
          <p>Способности откроются через воспоминания и испытания. Пока герой только учится держать форму.</p>
        )}
      </section>
    </section>
  )
}

type EvolutionNode = {
  id: string
  title: string
  subtitle: string
  tone: string
  status: 'current' | 'near' | 'closed' | 'distant'
  family: 'trunk' | 'dark' | 'light'
  pull: string
  fulfilled: string[]
  missing: string[]
}

const evolutionNodes: EvolutionNode[] = [
  {
    id: 'nothing',
    title: 'Нечто',
    subtitle: 'сейчас',
    tone: 'форма держится только резонансом',
    status: 'current',
    family: 'trunk',
    pull: 'Не исчезнуть. Держать путь, пока шаги снаружи дают тепло и направление.',
    fulfilled: ['резонанс с живой душой', 'первые маршруты', 'зачаток собственной воли'],
    missing: ['первый редкий осколок', 'сцена становления'],
  },
  {
    id: 'shadowborn',
    title: 'Shadowborn',
    subtitle: 'первый порог',
    tone: 'появляются тело, конечности и устойчивая осознанность',
    status: 'near',
    family: 'trunk',
    pull: 'Собрать себя достаточно, чтобы идти не только как тень, но как существо.',
    fulfilled: ['ранний путь почти пройден', 'уровень покажет готовность тела'],
    missing: ['1 свободный осколок', 'событие становления'],
  },
  {
    id: 'ghoul',
    title: 'Гуль',
    subtitle: 'второй порог',
    tone: 'гуманоидная форма перед выбором большой ветви',
    status: 'closed',
    family: 'trunk',
    pull: 'Получить тело, которое уже может спорить с миром, но ещё не выбрало, кем стать.',
    fulfilled: ['виден как общий ствол'],
    missing: ['Shadowborn', 'ещё 2 свободных осколка', 'более высокий уровень'],
  },
]

type FateBranch = {
  id: string
  title: string
  family: 'dark' | 'light'
  sub: string
  tone: string
  pull: string
  seed: string
  missing: string[]
}

const FATE_BRANCHES: FateBranch[] = [
  {
    id: 'consumed-blood',
    title: 'Поглощённая Кровь',
    family: 'dark',
    sub: 'Вурдалак',
    tone: 'удержать прошлое, даже если оно начнёт удерживать тебя',
    pull: 'Память, запретные места и страх исчезновения зовут туда, где чужая жизнь кажется якорем.',
    seed: 'выборы удержания будут оставлять след',
    missing: ['Гуль', 'осколки', 'кровь, память, запретные места', 'финальный сюжетный выбор'],
  },
  {
    id: 'cursed-flesh',
    title: 'Проклятая Плоть',
    family: 'dark',
    sub: 'Гарг',
    tone: 'стать стеной, защитой и тяжёлой клятвой',
    pull: 'Камень, печати и решения защиты отвечают той части героя, которая хочет удержать проход любой ценой.',
    seed: 'защитные решения будут учитываться',
    missing: ['Гуль', 'вложенные осколки', 'территории камня и печатей', 'финальный сюжетный выбор'],
  },
  {
    id: 'lost-light',
    title: 'Потерянный Свет',
    family: 'dark',
    sub: 'Дампир',
    tone: 'остаться на границе, рядом с людьми',
    pull: 'Жизнь на грани света и тени: путь разума или путь инстинкта, но всегда — рядом с чужим теплом.',
    seed: 'пограничные решения будут иметь вес',
    missing: ['Гуль', 'осколки', 'жизнь среди людей', 'финальный сюжетный выбор'],
  },
  {
    id: 'faceless-entity',
    title: 'Безликая Сущность',
    family: 'dark',
    sub: 'Призрак',
    tone: 'не принадлежать никому, где имя уже не держит форму',
    pull: 'Сны, тени и решения ухода открывают путь существу, которое не хочет принадлежать никому.',
    seed: 'решения ухода будут открывать дорогу',
    missing: ['Гуль', 'вложенные осколки', 'границы, сны, тени', 'финальный сюжетный выбор'],
  },
  {
    id: 'living-flesh',
    title: 'Живая Плоть',
    family: 'light',
    sub: 'Путь Корня',
    tone: 'укорениться в мире и принять новый дом',
    pull: 'Забота, живые территории и ритуалы роста отвечают части героя, которая ищет не владение, а дом.',
    seed: 'решения заботы будут открывать дорогу',
    missing: ['Гуль', 'осколки', 'живые территории', 'ритуал роста', 'финальный сюжетный выбор'],
  },
  {
    id: 'pure-source',
    title: 'Чистый Исток',
    family: 'light',
    sub: 'Путь Дара',
    tone: 'существовать через дар, память и возвращение имён',
    pull: 'Источники, имена и решения отдачи ведут к форме, которая не забирает целостность, а возвращает её.',
    seed: 'решения отдачи будут оставлять след',
    missing: ['Гуль', 'осколки', 'источники, имена, память', 'финальный сюжетный выбор'],
  },
]

const CEREMONY_TEXTS: Record<string, string> = {
  shadowborn: 'Тень стягивается к центру. Впервые появляются руки, шаг и ясная точка воли. Резонанс больше не единственное, что держит форму.',
  ghoul: 'Тело становится настоящим. Мир теперь видит существо — и ждёт ответа, кем оно решит стать.',
}

const getEvolutionNodeStatus = (node: EvolutionNode, evolution: HeroEvolutionState): EvolutionNode['status'] => {
  if (node.family !== 'trunk') return node.status
  if (node.id === evolution.stage) return 'current'
  if (node.id === 'nothing') return isEvolutionStageReached(evolution.stage, 'nothing') ? 'near' : 'current'
  if (node.id === 'shadowborn') {
    if (isEvolutionStageReached(evolution.stage, 'shadowborn')) return 'near'
    return canAdvanceEvolution(evolution, EVOLUTION_REQUIREMENTS.shadowborn) ? 'near' : 'closed'
  }
  if (node.id === 'ghoul') {
    if (isEvolutionStageReached(evolution.stage, 'ghoul')) return 'current'
    return canAdvanceEvolution(evolution, EVOLUTION_REQUIREMENTS.ghoul) ? 'near' : 'closed'
  }
  return node.status
}

const getEvolutionNodeDetails = (node: EvolutionNode, evolution: HeroEvolutionState) => {
  if (node.id === 'nothing') {
    return {
      fulfilled: isEvolutionStageReached(evolution.stage, 'nothing')
        ? ['резонанс с живой душой', 'первые маршруты', 'зачаток собственной воли']
        : node.fulfilled,
      missing: isEvolutionStageReached(evolution.stage, 'shadowborn') ? ['эта стадия уже пройдена'] : node.missing,
    }
  }

  if (node.id === 'shadowborn') {
    if (isEvolutionStageReached(evolution.stage, 'shadowborn')) {
      return {
        fulfilled: ['1 осколок найден', '1 осколок вложен в форму', 'первый порог пройден'],
        missing: evolution.stage === 'shadowborn' ? ['ещё 2 свободных осколка для Гуля'] : ['эта стадия уже стала частью ствола'],
      }
    }
    const missing = getMissingEvolutionShards(evolution, EVOLUTION_REQUIREMENTS.shadowborn)
    return {
      fulfilled: evolution.shards.free >= 1 ? ['1 свободный осколок готов'] : ['ранний путь уже зовёт к телу'],
      missing: missing > 0 ? [`не хватает ${missing} ${pluralShard(missing)}`, 'пройти порог становления'] : ['пройти порог становления'],
    }
  }

  if (node.id === 'ghoul') {
    if (isEvolutionStageReached(evolution.stage, 'ghoul')) {
      return {
        fulfilled: ['Shadowborn открыт', 'ещё 2 осколка вложены после Shadowborn', 'второй порог пройден'],
        missing: ['дальше нужны навыки, территории и сюжетный выбор ветви'],
      }
    }
    const missing = getMissingEvolutionShards(evolution, EVOLUTION_REQUIREMENTS.ghoul)
    return {
      fulfilled: [
        ...(isEvolutionStageReached(evolution.stage, 'shadowborn') ? ['Shadowborn открыт'] : []),
        ...(evolution.stage === 'shadowborn' && evolution.shards.free >= 2 ? ['2 свободных осколка готовы'] : []),
      ],
      missing: [
        ...(!isEvolutionStageReached(evolution.stage, 'shadowborn') ? ['сначала стать Shadowborn'] : []),
        ...(missing > 0 ? [`после Shadowborn не хватает ${missing} ${pluralShard(missing)}`] : []),
        'пройти второй порог становления',
      ],
    }
  }

  return { fulfilled: node.fulfilled, missing: node.missing }
}

function EvolutionTreeModal({
  level,
  onAdvanceEvolution,
  onClose,
  ownedAbilities,
  shardLedger,
  stage,
}: {
  level: number
  onAdvanceEvolution: () => void
  onClose: () => void
  ownedAbilities: string[]
  shardLedger: HeroEvolutionState['shards']
  stage: HeroEvolutionState['stage']
}) {
  const [selectedId, setSelectedId] = useState<string>(stage)
  const [ceremonyStage, setCeremonyStage] = useState<HeroEvolutionStage | null>(null)
  const evolution: HeroEvolutionState = { stage, shards: shardLedger, claimedSourceIds: [] }
  const trunkNodes = evolutionNodes
  const selectedTrunk = trunkNodes.find((node) => node.id === selectedId)
  const selectedBranch = FATE_BRANCHES.find((branch) => branch.id === selectedId)
  const nextRequirement = getNextEvolutionRequirement(evolution)
  const selectedIsNextThreshold = Boolean(selectedTrunk && nextRequirement && nextRequirement.stage === selectedTrunk.id)
  const canEvolveSelected = selectedIsNextThreshold && canAdvanceEvolution(evolution, nextRequirement ?? undefined)
  const missingForSelected = selectedIsNextThreshold && nextRequirement ? getMissingEvolutionShards(evolution, nextRequirement) : 0
  const details = selectedTrunk
    ? getEvolutionNodeDetails(selectedTrunk, evolution)
    : selectedBranch
      ? { fulfilled: [selectedBranch.seed], missing: selectedBranch.missing }
      : { fulfilled: [], missing: [] }
  const heading = selectedTrunk?.title ?? selectedBranch?.title ?? ''
  const tone = selectedTrunk?.tone ?? selectedBranch?.tone ?? ''
  const pull = selectedTrunk?.pull ?? selectedBranch?.pull ?? ''
  const unlockedAbilities = ownedAbilities.map((id) => abilityInfo[id]).filter(Boolean)
  const laneX = (index: number) => (index + 0.5) * (100 / FATE_BRANCHES.length)

  return (
    <div className="storyOverlay evolutionOverlay" role="presentation" onClick={onClose}>
      <section aria-labelledby="evolution-tree-title" aria-modal="true" className="storyEncounter evolutionTreeModal fateTreeModal" onClick={(event) => event.stopPropagation()} role="dialog">
        <span className="eyebrow">Карта становления</span>
        <h2 id="evolution-tree-title">Древо эволюции</h2>

        <div className="evolutionShardStatus" aria-label="Состояние осколков">
          <span><strong>{shardLedger.found}</strong> найдено</span>
          <span><strong>{shardLedger.free}</strong> свободно</span>
          <span><strong>{shardLedger.invested}</strong> вложено</span>
          <span><strong>Lv {level}</strong> резонанс</span>
        </div>

        <div className="fateTrunk" aria-label="Общий ствол">
          {trunkNodes.map((node, index) => {
            const status = getEvolutionNodeStatus(node, evolution)
            const reached = isEvolutionStageReached(stage, node.id as HeroEvolutionStage)
            return (
              <div className="fateTrunkStep" key={node.id}>
                {index > 0 ? <span aria-hidden className={`fateTrunkLink ${reached ? 'done' : status === 'near' ? 'next' : ''}`} /> : null}
                <button
                  className={`fateNode trunk ${status} ${node.id === stage ? 'current' : ''} ${selectedId === node.id ? 'selected' : ''}`}
                  onClick={() => setSelectedId(node.id)}
                  type="button"
                >
                  <span aria-hidden className="fateOrb">{node.id === stage ? '●' : reached ? '◆' : '◇'}</span>
                  <strong>{node.title}</strong>
                  <small>{node.id === stage ? 'сейчас' : reached ? 'пройдено' : status === 'near' ? 'порог готов' : 'закрыто'}</small>
                </button>
              </div>
            )
          })}
        </div>

        <svg aria-hidden className="fateFan" preserveAspectRatio="none" viewBox="0 0 100 30">
          {FATE_BRANCHES.map((branch, index) => (
            <path
              className={`fateFanEdge ${branch.family} ${selectedId === branch.id ? 'hl' : ''}`}
              d={`M50,0 Q${(50 + laneX(index)) / 2},18 ${laneX(index)},30`}
              key={branch.id}
            />
          ))}
        </svg>

        <div aria-hidden className="fateZones">
          <span className="dark">Тьма · растворение</span>
          <span className="light">Свет · обретение</span>
        </div>

        <div className="fateBranches" aria-label="Ветви эволюции">
          {FATE_BRANCHES.map((branch) => (
            <div className="fateLane" key={branch.id}>
              <button
                className={`fateNode branch ${branch.family} ${selectedId === branch.id ? 'selected' : ''}`}
                onClick={() => setSelectedId(branch.id)}
                type="button"
              >
                <span aria-hidden className="fateOrb">✧</span>
                <strong>{branch.title}</strong>
              </button>
              <small>{branch.sub}</small>
              <span aria-hidden className="fateFog"><i /><i /></span>
            </div>
          ))}
        </div>

        <div className="evolutionBranchDetails">
          <span className="eyebrow">{tone}</span>
          <strong>{heading}</strong>
          <p>{pull}</p>
          <div className="evolutionConditionGrid">
            <div>
              <span>Уже отозвалось</span>
              <ul>{details.fulfilled.map((item) => <li key={item}>{item}</li>)}</ul>
            </div>
            <div>
              <span>Ещё закрыто</span>
              <ul>{details.missing.map((item) => <li key={item}>{item}</li>)}</ul>
            </div>
          </div>
          {selectedIsNextThreshold && nextRequirement ? (
            <button
              className="primaryBtn"
              disabled={!canEvolveSelected}
              onClick={() => {
                if (!canEvolveSelected) return
                setCeremonyStage(nextRequirement.stage)
                onAdvanceEvolution()
              }}
              type="button"
            >
              {canEvolveSelected
                ? `Стать ${nextRequirement.title} — вложить ${nextRequirement.shardCost} ${pluralShard(nextRequirement.shardCost)}`
                : `Нужно ещё ${missingForSelected} ${pluralShard(missingForSelected)}`}
            </button>
          ) : null}
          {selectedBranch ? <p className="fateDistantNote">Дальняя судьба. Условия проявятся, когда герой подойдёт к выбору ветви.</p> : null}
        </div>

        <div className="evolutionSkillThreads" aria-label="Следы навыков">
          <span className="eyebrow">Навыки как следы пути</span>
          {unlockedAbilities.length ? (
            <div className="skillThreadList">
              {unlockedAbilities.map((ability) => (
                <span key={ability.title}>{ability.title}</span>
              ))}
            </div>
          ) : (
            <p>Пока нет вложенных навыков. Первые способности появятся через воспоминания и испытания, а позже смогут стать условиями ветвей.</p>
          )}
        </div>

        <button className="secondaryBtn" onClick={onClose} type="button">Закрыть древо</button>

        {ceremonyStage ? (
          <div className="fateCeremony" onClick={() => setCeremonyStage(null)} role="presentation">
            <span className="eyebrow">Становление</span>
            <h3>{EVOLUTION_STAGE_TITLES[ceremonyStage]}</h3>
            <p>{CEREMONY_TEXTS[ceremonyStage]}</p>
            <small>коснись, чтобы продолжить</small>
          </div>
        ) : null}
      </section>
    </div>
  )
}

function CampScreen({ save, onUpgrade }: { save: GameSave; onUpgrade: (id: CampUpgradeId, coins: number) => void }) {
  const recentNights = save.night.history.slice(-3).reverse()
  return (
    <section className="screenStack">
      <div className="sectionHeader">
        <div>
          <span className="eyebrow">Лагерь</span>
          <h1>Тихое укрытие</h1>
        </div>
        <img alt="Костёр лагеря" className="campArt" src="/generated-assets/campfire.png" />
      </div>

      <div className="campWallet" aria-label="Ресурсы лагеря">
        <span><i><img alt="" src="/generated-assets/coin.png" /></i><small>Монеты</small><strong>{fmt(save.coins)}</strong></span>
      </div>

      <section className="nightJournal" aria-labelledby="night-journal-title">
        <div><span className="eyebrow">Последние ночи</span><strong id="night-journal-title">Дневник костра</strong></div>
        {recentNights.length ? recentNights.map((entry) => (
          <article key={`${entry.date}:${entry.eventId}`}>
            <time>{entry.date}</time>
            <strong>{entry.title}</strong>
            <p>{entry.result}</p>
          </article>
        )) : <p className="muted">Первая запись появится после следующей ночи.</p>}
      </section>

      <div className="upgradeList">
        {CAMP_UPGRADES.map((upgrade) => {
          const level = save.camp[upgrade.id]
          const coinCost = getCampUpgradeCost(upgrade.id, level)
          return (
            <Upgrade
              coinCost={coinCost}
              key={upgrade.id}
              level={level}
              onUpgrade={() => coinCost !== null && onUpgrade(upgrade.id, coinCost)}
              ready={coinCost !== null && save.coins >= coinCost}
              upgrade={upgrade}
            />
          )
        })}
      </div>
    </section>
  )
}

function Upgrade({
  upgrade,
  level,
  coinCost,
  ready,
  onUpgrade,
}: {
  upgrade: CampUpgradeDefinition
  level: number
  coinCost: number | null
  ready: boolean
  onUpgrade: () => void
}) {
  const isMaxed = level >= 3
  const currentStage = level > 0 ? upgrade.stages[level - 1] : null
  const nextStage = upgrade.stages[level]
  return (
    <div className="upgrade">
      <div className="upgradeCopy">
        <div className="upgradeTitle"><strong><i aria-hidden>{upgrade.icon}</i>{upgrade.title}</strong><span>Ур. {level}/3</span></div>
        <div className="upgradeTrack" aria-label={`Карта улучшений: завершено ${level} из 3`}>
          {upgrade.stages.map((stage, index) => (
            <span className={index < level ? 'complete' : index === level ? 'next' : 'locked'} key={stage.name} title={`${stage.name}: ${stage.effect}`}>
              <i>{index + 1}</i><small>{stage.name}</small>
            </span>
          ))}
        </div>
        <p>{isMaxed ? currentStage?.effect : nextStage ? `${nextStage.name}: ${nextStage.effect}` : upgrade.purpose}</p>
        {!isMaxed ? (
          <div className="upgradeCost" aria-label="Стоимость улучшения">
            <small>Следующий уровень</small>
            <span className={ready ? '' : 'missing'}>◉ {coinCost} монет</span>
          </div>
        ) : null}
      </div>
      <button className={ready && !isMaxed ? 'primaryBtn compact' : 'secondaryBtn compact'} disabled={!ready || isMaxed} onClick={onUpgrade} type="button">
        {isMaxed ? 'Максимум' : ready ? 'Улучшить' : 'Не хватает'}
      </button>
    </div>
  )
}

function PointEventNotice({
  nodeId,
  locationId,
  camp,
  onResolve,
  onClose,
}: {
  nodeId: string
  locationId: string
  camp: GameSave['camp']
  onResolve: (result: PointEventResult) => PointEventResult
  onClose: () => void
}) {
  const definition = getPointEventDefinition(locationId, nodeId)
  const node = getMapNode(nodeId, locationId)
  const [choiceResult, setChoiceResult] = useState<PointEventResult | null>(null)
  const [crossingRatings, setCrossingRatings] = useState<PointEventRewardTier[]>([])
  const [crossingResult, setCrossingResult] = useState<PointEventResult | null>(null)
  const [searchSpotIds, setSearchSpotIds] = useState<string[]>([])
  const [searchResult, setSearchResult] = useState<PointEventResult | null>(null)
  const [elapsedMs, setElapsedMs] = useState(0)
  const crossingStartRef = useRef<number | null>(null)

  useEffect(() => {
    if (definition?.type !== 'crossing' || crossingResult) return undefined
    let frame = 0
    const tick = (time: number) => {
      if (crossingStartRef.current === null) crossingStartRef.current = time
      setElapsedMs(time - crossingStartRef.current)
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [definition?.type, crossingResult])

  if (!node || !definition) return null
  const locationMap = getLocationMap(locationId)
  const reward = calculateCampNodeReward(node, camp)
  const role = getLocalNodeVisualRole(node, locationMap)
  const presentation = getLocalNodePresentation(role)
  const lockpickingConfig = getLockpickingConfig(node.id)
  const battleConfig = getConnectBattleConfig(node.id)
  const shardSource = getEvolutionShardSourceForNode(locationId, node.id)
  const completedLocation = node.id === locationMap.finalNodeId
  const isPrologueFinal = locationId === 'silent-ruins' && node.id === locationMap.finalNodeId
  const eventResult = choiceResult ?? crossingResult ?? searchResult
  const nextAction = completedLocation
    ? 'Глобальная карта покажет, куда можно идти дальше.'
    : node.encounterId
      ? 'Сейчас откроется сюжетная сцена.'
      : lockpickingConfig
        ? 'Сейчас можно попробовать открыть тайник аккуратнее.'
        : battleConfig
          ? 'Сейчас начнётся короткий бой за дополнительный трофей.'
          : 'Следующая доступная точка подсветится на карте.'
  const crossingConfig = definition.crossing
  const searchConfig = definition.search
  const crossingPosition = crossingConfig ? getCarefulCrossingMarkerPosition(elapsedMs, crossingConfig) : 50

  const finishQuickEvent = () => {
    onResolve({
      nodeId: definition.nodeId,
      type: 'quick',
      coins: 0,
      xp: 0,
      note: 'Место отмечено, базовая награда уже получена.',
    })
    onClose()
  }

  const choosePointEvent = (choiceId: string) => {
    if (choiceResult) return
    setChoiceResult(onResolve(resolvePointEventChoice(definition, choiceId)))
  }

  const catchCrossingStep = () => {
    if (!crossingConfig || crossingResult) return
    const rating = rateCarefulCrossingTap(crossingPosition, crossingConfig)
    const nextRatings = [...crossingRatings, rating]
    setCrossingRatings(nextRatings)
    if (nextRatings.length >= crossingConfig.steps) {
      setCrossingResult(onResolve(resolveCarefulCrossing(definition, nextRatings)))
    }
  }

  const chooseSearchSpot = (spotId: string) => {
    if (!searchConfig || searchResult || searchSpotIds.includes(spotId)) return
    const nextSpotIds = [...searchSpotIds, spotId]
    setSearchSpotIds(nextSpotIds)
    if (nextSpotIds.length >= searchConfig.picks) {
      setSearchResult(onResolve(resolveAreaSearch(definition, nextSpotIds)))
    }
  }

  return (
    <div
      className="arrivalOverlay"
      role="presentation"
      onClick={() => {
        if (definition.type === 'quick') finishQuickEvent()
        else if (eventResult) onClose()
      }}
    >
      <section aria-labelledby="arrival-title" aria-modal="true" className={`arrivalNotice pointEventNotice ${definition.type}`} onClick={(event) => event.stopPropagation()} role="dialog">
        <img alt="" className="pointEventArt" src={definition.art} />
        <span className={`arrivalIcon role-${role}`} aria-hidden>{presentation.icon}</span>
        <span className="eyebrow">{definition.eyebrow} · {presentation.label}</span>
        <h2 id="arrival-title">{node.title}</h2>
        <p>{definition.body}</p>
        <div className="arrivalMeaning">
          <strong>{eventResult ? 'Итог момента' : 'Что это дало'}</strong>
          <span>{eventResult?.note ?? definition.rewardHint}</span>
          <small>{eventResult ? (eventResult.coins || eventResult.xp ? 'Бонус добавлен к базовой награде.' : 'Путь открыт без штрафа.') : nextAction}</small>
        </div>
        {isPrologueFinal ? (
          <p>Один зов идёт по Тихому тракту, другой — из Мшистых врат. Немой шпиль остаётся ориентиром, но дальнейший путь теперь выбираешь ты.</p>
        ) : null}

        {definition.type === 'choice' && definition.choices && !choiceResult ? (
          <div className="pointChoiceGrid" aria-label="Выбор события точки">
            {definition.choices.map((choice) => (
              <button key={choice.id} onClick={() => choosePointEvent(choice.id)} type="button">
                <strong>{choice.title}</strong>
                <span>{choice.text}</span>
              </button>
            ))}
          </div>
        ) : null}

        {definition.type === 'crossing' && crossingConfig && !crossingResult ? (
          <div className="crossingMiniGame">
            <div className="crossingTrack" aria-label="Осторожный переход">
              <span
                className="crossingSafeZone"
                style={{
                  left: `${crossingConfig.safeCenter - crossingConfig.safeWidth / 2}%`,
                  width: `${crossingConfig.safeWidth}%`,
                }}
              />
              <i className="crossingMarker" style={{ left: `${crossingPosition}%` }} />
            </div>
            <div className="crossingSteps" aria-label="Сделанные шаги">
              {Array.from({ length: crossingConfig.steps }, (_, index) => (
                <span className={crossingRatings[index] ?? ''} key={index}>{index + 1}</span>
              ))}
            </div>
            <button className="primaryBtn" onClick={catchCrossingStep} type="button">
              {crossingRatings.length + 1 >= crossingConfig.steps ? 'Последний шаг' : definition.actionLabel}
            </button>
          </div>
        ) : null}

        {definition.type === 'search' && searchConfig && !searchResult ? (
          <div className="areaSearchMiniGame">
            <div className="areaSearchScene" aria-label="Осмотр места">
              {searchConfig.spots.map((spot) => {
                const selected = searchSpotIds.includes(spot.id)
                return (
                  <button
                    aria-pressed={selected}
                    className={selected ? 'found' : ''}
                    disabled={selected}
                    key={spot.id}
                    onClick={() => chooseSearchSpot(spot.id)}
                    style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
                    type="button"
                  >
                    <strong>{spot.title}</strong>
                    <span>{spot.hint}</span>
                  </button>
                )
              })}
            </div>
            <div className="areaSearchProgress" aria-label="Найденные детали">
              {Array.from({ length: searchConfig.picks }, (_, index) => (
                <span className={searchSpotIds[index] ? 'found' : ''} key={index}>{index + 1}</span>
              ))}
            </div>
          </div>
        ) : null}

        <div className="arrivalRewards" aria-label="Полученные награды">
          <span><img alt="" src="/generated-assets/xp-rune.png" />+{reward.xp} XP</span>
          {reward.coins > 0 ? <span><img alt="" src="/generated-assets/coin.png" />+{reward.coins}</span> : <span>Без монет</span>}
          {shardSource ? <span>+{shardSource.amount} {pluralShard(shardSource.amount)}</span> : null}
          {completedLocation ? <span>Локация пройдена</span> : null}
          {eventResult?.xp ? <span>Момент +{eventResult.xp} XP</span> : null}
          {eventResult?.coins ? <span>Момент +{eventResult.coins} монет</span> : null}
        </div>
        {definition.type === 'quick' ? (
          <button className="primaryBtn" onClick={finishQuickEvent} type="button">
            {completedLocation ? 'Открыть карту мира' : node.encounterId ? 'Увидеть событие' : lockpickingConfig ? 'Открыть тайник' : battleConfig ? 'Начать бой' : 'Продолжить'}
          </button>
        ) : eventResult ? (
          <button className="primaryBtn" onClick={onClose} type="button">
            {completedLocation ? 'Открыть карту мира' : node.encounterId ? 'Увидеть событие' : lockpickingConfig ? 'Открыть тайник' : battleConfig ? 'Начать бой' : 'Продолжить'}
          </button>
        ) : null}
      </section>
    </div>
  )
}

function BecomingNotice({
  evolution,
  onAdvanceEvolution,
  onClose,
  onOpenTree,
  source,
}: {
  evolution: HeroEvolutionState
  onAdvanceEvolution: () => void
  onClose: () => void
  onOpenTree: () => void
  source: EvolutionShardSource
}) {
  const canBecomeShadowborn = canAdvanceEvolution(evolution, EVOLUTION_REQUIREMENTS.shadowborn)
  const isShadowborn = isEvolutionStageReached(evolution.stage, 'shadowborn')

  return (
    <div className="storyOverlay becomingOverlay" role="presentation">
      <section aria-labelledby="becoming-title" aria-modal="true" className="storyEncounter becomingEncounter" role="dialog">
        <span className="storySigil" aria-hidden>✦</span>
        <span className="eyebrow">{source.title}</span>
        <h2 id="becoming-title">{isShadowborn ? 'Shadowborn' : 'Первый осколок целостности'}</h2>
        {isShadowborn ? (
          <p className="storyScene">Тень больше не расползается от каждого шага. У неё появляются контуры рук, тяжесть тела и первый ясный центр воли.</p>
        ) : (
          <p className="storyScene">На пределе руин в герое откликается не чужая память и не добыча, а редкая часть собственной цельности. Карта становления зажигает первый порог: Shadowborn.</p>
        )}
        <div className="becomingShardCard" role="status">
          <small>Осколки</small>
          <strong>{evolution.shards.free} свободно / {evolution.shards.found} найдено</strong>
          <span>{isShadowborn ? 'Первый осколок вложен в общий ствол.' : 'Одного свободного осколка достаточно, чтобы пройти первый порог.'}</span>
        </div>
        <div className="becomingActions">
          {!isShadowborn ? (
            <button className="primaryBtn" disabled={!canBecomeShadowborn} onClick={onAdvanceEvolution} type="button">
              Стать Shadowborn
            </button>
          ) : null}
          <button className={isShadowborn ? 'primaryBtn' : 'secondaryBtn'} onClick={onOpenTree} type="button">
            Карта становления
          </button>
          <button className="ghostBtn" onClick={onClose} type="button">Позже</button>
        </div>
      </section>
    </div>
  )
}

function BattleResultNotice({
  camp,
  locationId,
  nodeId,
  onClose,
  result,
}: {
  camp: GameSave['camp']
  locationId: string
  nodeId: string
  onClose: () => void
  result: ConnectBattleResult
}) {
  const node = getMapNode(nodeId, locationId)
  if (!node) return null
  const baseReward = calculateCampNodeReward(node, camp)
  const battleConfig = getConnectBattleConfig(nodeId)
  const fallbackOutcomeCopy: Record<ConnectBattleResult['tier'], { title: string; text: string }> = {
    weak: {
      title: 'Победа с потерями',
      text: 'Угроза отступила, но бой вышел тяжёлым. Главная награда точки уже получена, путь дальше открыт.',
    },
    good: {
      title: 'Победа',
      text: 'Ты удержал ритм боя и снял с дороги лишнее давление. К награде точки добавлен боевой трофей.',
    },
    perfect: {
      title: 'Чистая победа',
      text: 'Угроза рассыпалась до того, как успела закрепиться. Герой забрал лучший трофей и спокойно идёт дальше.',
    },
  }
  const outcomeCopy = battleConfig?.resultCopy ?? fallbackOutcomeCopy
  const focusSymbol = battleConfig?.intent.focusSymbol
  const focusScore = focusSymbol ? result.score[focusSymbol] : 0
  const bonusText = result.coins || result.xp
    ? `${result.coins ? `+${result.coins} монет` : ''}${result.coins && result.xp ? ' · ' : ''}${result.xp ? `+${result.xp} XP` : ''}`
    : 'Бонус не выпал'

  return (
    <div className="arrivalOverlay battleReportOverlay" role="presentation" onClick={onClose}>
      <section aria-labelledby="battle-report-title" aria-modal="true" className="arrivalNotice battleReportNotice" onClick={(event) => event.stopPropagation()} role="dialog">
        <span className={`battleOutcome ${result.tier}`}>{outcomeCopy[result.tier].title}</span>
        <h2 id="battle-report-title">{node.title}</h2>
        <p>{outcomeCopy[result.tier].text}</p>
        <div className="arrivalMeaning">
          <strong>Итог боя</strong>
          <span>{result.score.total} силы собрано цепями. Путь дальше открыт.</span>
          {battleConfig ? <span>{battleConfig.intent.focusLabel} Собрано по сцене: {focusScore}.</span> : null}
          <small>{bonusText}</small>
        </div>
        <div className="arrivalRewards" aria-label="Итоговые награды боя">
          <span><img alt="" src="/generated-assets/xp-rune.png" />База +{baseReward.xp} XP</span>
          {baseReward.coins > 0 ? <span><img alt="" src="/generated-assets/coin.png" />База +{baseReward.coins}</span> : null}
          {result.xp > 0 ? <span>Бой +{result.xp} XP</span> : null}
          {result.coins > 0 ? <span>Бой +{result.coins} монет</span> : null}
        </div>
        <button className="primaryBtn" onClick={onClose} type="button">Понятно</button>
      </section>
    </div>
  )
}

function StoryEncounterModal({
  encounter,
  ownedAbilities,
  storyIdentity,
  onResolve,
  onClose,
}: {
  encounter: StoryEncounter | undefined
  ownedAbilities: string[]
  storyIdentity: ReturnType<typeof getDominantIdentityPath>
  onResolve: (choiceId: string) => void
  onClose: () => void
}) {
  const [resolvedChoiceId, setResolvedChoiceId] = useState<string | null>(null)
  if (!encounter) return null
  const resolvedChoice = encounter.choices.find((choice) => choice.id === resolvedChoiceId)
  const abilityBonus = Boolean(resolvedChoice?.abilityAffinity && ownedAbilities.includes(resolvedChoice.abilityAffinity))
  const identityBonus = Boolean(resolvedChoice?.identityAffinity && storyIdentity === resolvedChoice.identityAffinity)

  const choose = (choiceId: string) => {
    if (resolvedChoiceId) return
    onResolve(choiceId)
    setResolvedChoiceId(choiceId)
  }

  return (
    <div className="storyOverlay" role="presentation">
      <section aria-labelledby="story-title" aria-modal="true" className={`storyEncounter ${encounter.type}`} role="dialog">
        {encounter.art ? <img alt="" className="storyArt" src={encounter.art} /> : null}
        <span className="storySigil" aria-hidden>{encounter.type === 'memory' ? '◈' : '×'}</span>
        <span className="eyebrow">{encounter.eyebrow}</span>
        <h2 id="story-title">{encounter.title}</h2>
        <p className="storyScene">{encounter.scene}</p>

        {resolvedChoice ? (
          <div className="storyResult">
            <strong>{resolvedChoice.title}</strong>
            <p>{resolvedChoice.result}</p>
            {abilityBonus ? <span>Способность сработала: усиленная награда +15 монет и +20 XP.</span> : null}
            {identityBonus ? <span>Трактовка памяти откликнулась: усиленная награда +10 монет и +15 XP.</span> : null}
            <button className="primaryBtn" onClick={onClose} type="button">Продолжить путь</button>
          </div>
        ) : (
          <div className="storyChoices" aria-label="Выбор трактовки">
            {encounter.choices.map((choice) => {
              const empowered = Boolean(choice.abilityAffinity && ownedAbilities.includes(choice.abilityAffinity))
              const remembered = Boolean(choice.identityAffinity && storyIdentity === choice.identityAffinity)
              return (
                <button key={choice.id} onClick={() => choose(choice.id)} type="button">
                  <strong>{choice.title}</strong>
                  <span>{choice.text}</span>
                  {empowered ? <small>Доступно усиление способности</small> : null}
                  {remembered ? <small>Резонирует с трактовкой памяти</small> : null}
                </button>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}

function LockpickingModal({
  nodeId,
  onResolve,
  onClose,
}: {
  nodeId: string
  onResolve: (nodeId: string, ratings: LockpickingPinRating[]) => LockpickingResult
  onClose: () => void
}) {
  const config = getLockpickingConfig(nodeId)
  const [activePin, setActivePin] = useState(0)
  const [ratings, setRatings] = useState<LockpickingPinRating[]>([])
  const [caughtPositions, setCaughtPositions] = useState<number[]>([])
  const [pinPosition, setPinPosition] = useState(config?.successCenter ?? 50)
  const [lastFeedback, setLastFeedback] = useState<LockpickingPinRating | null>(null)
  const [result, setResult] = useState<LockpickingResult | null>(null)
  const startTimeRef = useRef(0)
  const frameRef = useRef<number | null>(null)
  const feedbackTimerRef = useRef<number | null>(null)

  useEffect(() => {
    if (!config || result) return undefined
    startTimeRef.current = performance.now()

    const tick = (now: number) => {
      setPinPosition(getLockpickingPinPosition(now - startTimeRef.current, activePin, config.speed))
      frameRef.current = window.requestAnimationFrame(tick)
    }

    frameRef.current = window.requestAnimationFrame(tick)
    return () => {
      if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current)
      frameRef.current = null
    }
  }, [activePin, config, result])

  useEffect(() => () => {
    if (feedbackTimerRef.current !== null) window.clearTimeout(feedbackTimerRef.current)
  }, [])

  if (!config) return null

  const ratingLabels: Record<LockpickingPinRating, string> = {
    perfect: 'Точно',
    good: 'Есть',
    miss: 'Мимо',
  }
  const tierCopy: Record<LockpickingResult['tier'], { title: string; text: string }> = {
    weak: { title: 'Замок поддался грубо', text: 'Тайник открыт, но часть запаса осталась недоступной.' },
    good: { title: 'Штифты легли ровно', text: 'Застёжка раскрылась без шума и отдала небольшой дорожный запас.' },
    perfect: { title: 'Тихое открытие', text: 'Замок почти сам вспомнил правильное положение. Внутри нашёлся лучший узелок.' },
  }

  const catchPin = () => {
    if (result) return
    const rating = rateLockpickingPin(pinPosition, config)
    void playLockpickFeedback(rating)
    setLastFeedback(rating)
    if (feedbackTimerRef.current !== null) window.clearTimeout(feedbackTimerRef.current)
    feedbackTimerRef.current = window.setTimeout(() => setLastFeedback(null), 520)
    const nextRatings = [...ratings, rating]
    setRatings(nextRatings)
    setCaughtPositions([...caughtPositions, pinPosition])

    if (nextRatings.length >= config.pinCount) {
      setResult(onResolve(nodeId, nextRatings))
      return
    }

    setActivePin((pin) => pin + 1)
  }

  return (
    <div className="storyOverlay lockpickOverlay" role="presentation">
      <section aria-labelledby="lockpick-title" aria-modal="true" className="storyEncounter lockpickEncounter" role="dialog">
        <span className="storySigil" aria-hidden>□</span>
        <span className="eyebrow">Мини-игра: тайник</span>
        <h2 id="lockpick-title">{config.title}</h2>
        <p className="storyScene">{config.scene}</p>

        <button
          aria-label="Поймать активный штифт"
          className={`lockpickBoard ${lastFeedback ? `feedback-${lastFeedback}` : ''}`}
          disabled={Boolean(result)}
          onClick={catchPin}
          type="button"
        >
          <span aria-hidden className="lockpickFace">
            <i />
          </span>
          <span
            aria-hidden
            className="lockpickSuccess"
            style={{
              height: `${config.successWidth}%`,
              top: `${config.successCenter}%`,
            }}
          />
          {Array.from({ length: config.pinCount }).map((_, index) => {
            const rating = ratings[index]
            const markerPosition = index === activePin && !result ? pinPosition : caughtPositions[index] ?? 88
            return (
              <span className={`lockpickPin ${index === activePin && !result ? 'active' : ''} ${rating ?? ''}`} key={index}>
                <i style={{ top: `${markerPosition}%` }} />
                <small>{rating ? ratingLabels[rating] : index === activePin && !result ? 'Лови' : `${index + 1}`}</small>
              </span>
            )
          })}
        </button>

        {result ? (
          <div className="storyResult">
            <strong>{tierCopy[result.tier].title}</strong>
            <p>{tierCopy[result.tier].text}</p>
            {result.coins || result.xp ? (
              <span>Бонус: {result.coins ? `+${result.coins} монет` : ''}{result.coins && result.xp ? ' · ' : ''}{result.xp ? `+${result.xp} XP` : ''}</span>
            ) : <span>Базовая награда уже получена. Бонус не выпал.</span>}
            <button className="primaryBtn" onClick={onClose} type="button">Забрать найденное</button>
          </div>
        ) : (
          <button className="primaryBtn" onClick={catchPin} type="button">Поймать штифт</button>
        )}
      </section>
    </div>
  )
}

function ConnectBattleModal({
  nodeId,
  onResolve,
  onClose,
  ownedAbilities,
}: {
  nodeId: string
  onResolve: (nodeId: string, chains: ConnectBattleChain[]) => ConnectBattleResult
  onClose: (result?: ConnectBattleResult) => void
  ownedAbilities: string[]
}) {
  const config = getConnectBattleConfig(nodeId)
  const [board, setBoard] = useState<ConnectBattleSymbol[]>(() => config ? createConnectBattleBoard(config) : [])
  const [selectedTileIds, setSelectedTileIds] = useState<number[]>([])
  const [chains, setChains] = useState<ConnectBattleChain[]>([])
  const [turn, setTurn] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [result, setResult] = useState<ConnectBattleResult | null>(null)
  const selectedTileIdsRef = useRef<number[]>([])

  if (!config) return null

  const symbolLabels: Record<ConnectBattleSymbol, string> = {
    attack: 'Удар',
    guard: 'Щит',
    flame: 'Пламя',
    break: 'Разрыв',
  }
  const symbolGlyphs: Record<ConnectBattleSymbol, string> = {
    attack: '⚔',
    guard: '🛡',
    flame: '🔥',
    break: '⛓',
  }
  const intentGlyph = symbolGlyphs[config.intent.focusSymbol]
  const intentLabel = symbolLabels[config.intent.focusSymbol]
  const tierCopy = config.resultCopy

  const updateSelectedTileIds = (nextSelection: number[] | ((current: number[]) => number[])) => {
    const next = typeof nextSelection === 'function' ? nextSelection(selectedTileIdsRef.current) : nextSelection
    selectedTileIdsRef.current = next
    setSelectedTileIds(next)
  }

  const selectTile = (tileId: number, canStartNew: boolean) => {
    if (result) return
    const tileSymbol = board[tileId]
    updateSelectedTileIds((current) => {
      const existingIndex = current.indexOf(tileId)
      if (existingIndex >= 0) return current.slice(0, existingIndex + 1)
      if (!current.length) return [tileId]

      const firstSymbol = board[current[0]]
      const lastTileId = current[current.length - 1]
      const canExtend = tileSymbol === firstSymbol && areConnectBattleTilesAdjacent(lastTileId, tileId, config.boardSize)
      if (canExtend) return [...current, tileId]
      return canStartNew ? [tileId] : current
    })
  }

  const beginTile = (tileId: number, event: PointerEvent<HTMLButtonElement>) => {
    event.preventDefault()
    setIsDragging(true)
    selectTile(tileId, true)
  }

  const getTileIdAtPoint = (clientX: number, clientY: number) => {
    const target = document.elementFromPoint(clientX, clientY)
    const tile = target?.closest<HTMLButtonElement>('[data-battle-tile-id]')
    const tileId = Number(tile?.dataset.battleTileId)
    return Number.isInteger(tileId) ? tileId : null
  }

  const continueDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (!isDragging || result) return
    const tileId = getTileIdAtPoint(event.clientX, event.clientY)
    if (tileId !== null) selectTile(tileId, false)
  }

  const commitChain = (tileIds = selectedTileIdsRef.current) => {
    if (result || tileIds.length < 3) return
    const chain: ConnectBattleChain = {
      symbol: board[tileIds[0]],
      length: tileIds.length,
    }
    const nextChains = [...chains, chain]
    const nextTurn = turn + 1
    setChains(nextChains)
    setBoard(refillConnectBattleBoard(board, tileIds, config, nextTurn))
    updateSelectedTileIds([])
    setTurn(nextTurn)

    if (nextTurn >= config.turns) {
      setResult(onResolve(nodeId, nextChains))
    }
  }

  const finishDrag = () => {
    setIsDragging(false)
    if (selectedTileIdsRef.current.length >= 3) commitChain(selectedTileIdsRef.current)
  }

  const endEarly = () => {
    if (result || !chains.length) return
    setResult(onResolve(nodeId, chains))
  }

  const selectedSymbol = selectedTileIds.length ? board[selectedTileIds[0]] : null
  const chainReady = selectedTileIds.length >= 3
  const turnsLeft = Math.max(0, config.turns - turn)
  const currentScore = scoreConnectBattleChains(chains, ownedAbilities).total
  const targetLabel = currentScore >= config.perfectTarget ? 'лучший' : currentScore >= config.goodTarget ? 'хороший' : `${currentScore}/${config.goodTarget}`

  return (
    <div className="storyOverlay battleOverlay" role="presentation">
      <section aria-labelledby="battle-title" aria-modal="true" className="storyEncounter battleEncounter" role="dialog">
        <span className="storySigil" aria-hidden>×</span>
        <span className="eyebrow">Мини-игра: бой</span>
        <h2 id="battle-title">{config.title}</h2>
        <p className="storyScene">{config.scene}</p>

        <div className={`battleIntent ${config.intent.type}`} aria-label="Намерение врага">
          <span aria-hidden>{intentGlyph}</span>
          <div>
            <small>{config.intent.title}</small>
            <strong>{config.intent.focusLabel}</strong>
            <p>{config.intent.text}</p>
          </div>
        </div>

        <div className="battleStatus" aria-label="Состояние боя">
          <span><small>Ходы</small>{turnsLeft}</span>
          <span><small>Цепь</small>{selectedSymbol ? symbolLabels[selectedSymbol] : 'Нет'}</span>
          <span><small>Бонус</small>{targetLabel}</span>
        </div>

        <div
          className="battleBoard"
          onPointerCancel={finishDrag}
          onPointerLeave={() => setIsDragging(false)}
          onPointerMove={continueDrag}
          onPointerUp={finishDrag}
          style={{ gridTemplateColumns: `repeat(${config.boardSize}, 1fr)` }}
        >
          {board.map((symbol, index) => {
            const selectedIndex = selectedTileIds.indexOf(index)
            const selected = selectedIndex >= 0
            const empowered = (
              (symbol === 'attack' && ownedAbilities.includes('ash-lunge')) ||
              (symbol === 'guard' && ownedAbilities.includes('guard-stance')) ||
              (symbol === 'break' && ownedAbilities.includes('silent-break'))
            )
            const intentFocus = symbol === config.intent.focusSymbol
            return (
              <button
                aria-label={`${symbolLabels[symbol]} ${selected ? `в цепи ${selectedIndex + 1}` : ''}`}
                className={`battleTile ${symbol} ${selected ? 'selected' : ''} ${selectedIndex === 0 ? 'lead' : ''} ${empowered ? 'empowered' : ''} ${intentFocus ? 'intentFocus' : ''}`}
                data-battle-tile-id={index}
                disabled={Boolean(result)}
                key={`${symbol}-${index}-${turn}`}
                onPointerDown={(event) => beginTile(index, event)}
                onPointerEnter={() => {
                  if (isDragging) selectTile(index, false)
                }}
                type="button"
              >
                <i aria-hidden>{symbolGlyphs[symbol]}</i>
              </button>
            )
          })}
        </div>

        {chains.length ? (
          <div className="battleChains" aria-label="Проведённые цепи">
            {chains.map((chain, index) => (
              <span className={chain.symbol} key={`${chain.symbol}-${index}`}>{symbolGlyphs[chain.symbol]} {chain.length}</span>
            ))}
          </div>
        ) : null}

        {result ? (
          <div className="storyResult">
            <span className={`battleOutcome ${result.tier}`}>{tierCopy[result.tier].outcome}</span>
            <div className={`battleRewardNotice ${result.tier}`} role="status">
              <small>Бой завершён</small>
              <strong>{result.coins || result.xp ? 'Награда получена' : 'Путь открыт'}</strong>
              <span>{result.coins || result.xp ? `${result.coins ? `+${result.coins} монет` : ''}${result.coins && result.xp ? ' · ' : ''}${result.xp ? `+${result.xp} XP` : ''}` : 'Бонус не выпал, базовая награда уже засчитана.'}</span>
            </div>
            <strong>{tierCopy[result.tier].title}</strong>
            <p>{tierCopy[result.tier].text}</p>
            <span>Фокус сцены: {intentLabel.toLowerCase()} · собрано {result.score[config.intent.focusSymbol]} силы этим знаком.</span>
            <span>Итог боя: {result.score.total} силы · нужно {config.goodTarget} для бонуса, {config.perfectTarget} для лучшего трофея.</span>
            {result.coins || result.xp ? (
              <span>Получено сверху: {result.coins ? `+${result.coins} монет` : ''}{result.coins && result.xp ? ' · ' : ''}{result.xp ? `+${result.xp} XP` : ''}</span>
            ) : <span>Базовая награда за точку уже получена перед боем.</span>}
            <button className="primaryBtn" onClick={() => onClose(result)} type="button">Продолжить путь</button>
          </div>
        ) : (
          <div className="battleActions">
            <button className="primaryBtn" disabled={!chainReady} onClick={() => commitChain()} type="button">Провести цепь</button>
            <button className="ghostBtn" disabled={!chains.length} onClick={endEarly} type="button">Завершить обмен</button>
          </div>
        )}
      </section>
    </div>
  )
}

const EVENING_HERO_PHRASES = [
  'Сегодня тепло шло со мной весь день. Спасибо, что шёл рядом.',
  'Я запомнил эту дорогу. Кажется, я начинаю уметь помнить.',
  'Ветер в спину — это ведь ты. Я почти уверен.',
  'Когда шаги затихают, я слушаю костёр. Он говорит: завтра будет путь.',
  'Я не исчез сегодня. Значит, мы шли не зря.',
]

function CampfireEveningModal({
  dateKey,
  onClose,
  routeStatus,
  steps,
  streak,
  xp,
}: {
  dateKey: string
  onClose: () => void
  routeStatus: string
  steps: number
  streak: StreakState
  xp: number
}) {
  const phrase = EVENING_HERO_PHRASES[Array.from(dateKey).reduce((total, char) => total + char.charCodeAt(0), 0) % EVENING_HERO_PHRASES.length]
  return (
    <div className="storyOverlay nightOverlay" role="presentation">
      <section aria-labelledby="evening-title" aria-modal="true" className="storyEncounter nightEncounter" role="dialog">
        <img alt="" className="nightArt" src="/generated-assets/campfire.png" />
        <span className="storySigil" aria-hidden>✶</span>
        <span className="eyebrow">Вечер у костра</span>
        <h2 id="evening-title">День подходит к концу</h2>
        <p className="storyScene">{phrase}</p>
        <div className="eveningStats" aria-label="Итоги дня">
          <span><small>Шагов за день</small><strong>{fmt(steps)}</strong></span>
          <span><small>XP за день</small><strong>+{fmt(xp)}</strong></span>
          <span><small>Дней в пути</small><strong>{streak.count}</strong></span>
        </div>
        <p className="eveningRoute">{routeStatus}</p>
        {streak.stones > 0 ? <p className="eveningStones">Камни странника: {streak.stones}. Камень сохранит серию, если один день выпадет.</p> : null}
        <button className="primaryBtn" onClick={onClose} type="button">Доброй ночи</button>
      </section>
    </div>
  )
}

function NightEventModal({ event, morningNote, onResolve }: { event: NightEvent; morningNote?: string | null; onResolve: (choiceId: string) => void }) {
  const [resolvedChoiceId, setResolvedChoiceId] = useState<string | null>(null)
  const resolvedChoice = event.choices.find((choice) => choice.id === resolvedChoiceId)
  return (
    <div className="storyOverlay nightOverlay" role="presentation">
      <section aria-labelledby="night-title" aria-modal="true" className="storyEncounter nightEncounter" role="dialog">
        <img alt="" className="nightArt" src="/generated-assets/campfire.png" />
        <span className="storySigil" aria-hidden>☾</span>
        <span className="eyebrow">{event.eyebrow}</span>
        <h2 id="night-title">{event.title}</h2>
        <p className="storyScene">{event.scene}</p>
        {morningNote ? <p className="nightMorningNote">{morningNote}</p> : null}
        {resolvedChoice ? (
          <div className="storyResult">
            <strong>{resolvedChoice.title}</strong>
            <p>{resolvedChoice.result}</p>
            {resolvedChoice.coins || resolvedChoice.xp ? <span>Награда: {resolvedChoice.xp ? `+${resolvedChoice.xp} XP` : ''}{resolvedChoice.xp && resolvedChoice.coins ? ' · ' : ''}{resolvedChoice.coins ? `+${resolvedChoice.coins} монет` : ''}</span> : null}
            <button className="primaryBtn" onClick={() => onResolve(resolvedChoice.id)} type="button">Встретить новый день</button>
          </div>
        ) : (
          <div className="storyChoices" aria-label="Выбор ночного события">
            {event.choices.map((choice) => (
              <button key={choice.id} onClick={() => setResolvedChoiceId(choice.id)} type="button">
                <strong>{choice.title}</strong>
                <span>{choice.text}</span>
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function WorldMap({ progress, onTravel, onClose }: { progress: WorldProgress; onTravel: (id: string) => void; onClose: () => void }) {
  const currentCompleted = progress.completedLocationIds.includes(progress.currentLocationId)
  const availableIds = currentCompleted ? getWorldNeighbors(progress.currentLocationId).filter(isLocationPlayable) : []
  const [selectedId, setSelectedId] = useState(availableIds[0] ?? progress.currentLocationId)
  const selectedLocation = getWorldLocation(selectedId)
  const selectedRegion = selectedLocation ? getWorldRegion(selectedLocation.regionId) : undefined
  const selectedRole = selectedLocation ? getWorldLocationVisualRole(selectedLocation) : undefined
  const viewportRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const viewport = viewportRef.current
    const currentLocation = getWorldLocation(progress.currentLocationId)
    if (!viewport || !currentLocation) return

    const frame = requestAnimationFrame(() => {
      const canvas = viewport.firstElementChild as HTMLElement | null
      if (!canvas) return
      viewport.scrollTo({
        left: canvas.offsetWidth * (currentLocation.x / 100) - viewport.clientWidth / 2,
        top: canvas.offsetHeight * (currentLocation.y / 100) - viewport.clientHeight / 2,
        behavior: 'auto',
      })
    })

    return () => cancelAnimationFrame(frame)
  }, [progress.currentLocationId])

  const getLocationState = (id: string) => {
    const location = getWorldLocation(id)
    return location ? getWorldLocationVisualState(location, progress, availableIds) : 'future'
  }

  const getWorldEdgeState = (from: string, to: string) => {
    const fromLocation = getWorldLocation(from)
    const toLocation = getWorldLocation(to)
    if (!fromLocation || !toLocation) return 'future'
    return getWorldRouteVisualState(fromLocation, toLocation, getLocationState(from), getLocationState(to), progress.currentLocationId)
  }

  const selectedState = getLocationState(selectedId)
  const selectionCopy = getWorldSelectionCopy(selectedLocation, selectedRegion?.title, selectedRole, selectedState)

  return (
    <div className="worldMapOverlay" role="presentation">
      <section aria-labelledby="world-map-title" aria-modal="true" className="worldMap" role="dialog">
        <div className="worldMapHeader">
          <div><span className="eyebrow">Глобальная карта</span><h2 id="world-map-title">Мир пути</h2></div>
          <button aria-label="Закрыть карту мира" className="devClose" onClick={onClose} type="button">×</button>
        </div>

        <div className="worldMapViewport" ref={viewportRef}>
          <div className="worldMapCanvas" aria-label="Карта мира с тридцатью локациями">
            <img alt="Пять регионов мира" className="worldMapArt" src="/generated-assets/maps/world-map-01.png" />
            <svg className="worldRouteGraph" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
              {WORLD_EDGES.map((edge) => {
                const from = getWorldLocation(edge.from)
                const to = getWorldLocation(edge.to)
                if (!from || !to) return null
                return (
                  <line
                    className={`worldRoute ${getWorldEdgeState(edge.from, edge.to)}`}
                    key={`${edge.from}-${edge.to}`}
                    vectorEffect="non-scaling-stroke"
                    x1={from.x}
                    x2={to.x}
                    y1={from.y}
                    y2={to.y}
                  />
                )
              })}
            </svg>

            {WORLD_LOCATIONS.map((location) => {
              const state = getLocationState(location.id)
              const role = getWorldLocationVisualRole(location)
              const presentation = getWorldLocationPresentation(role, state)
              return (
                <button
                  aria-label={`${location.title}. ${presentation.label}`}
                  className={`worldNode ${state} role-${role} ${selectedId === location.id ? 'selected' : ''}`}
                  key={location.id}
                  onClick={() => setSelectedId(location.id)}
                  style={{ left: `${location.x}%`, top: `${location.y}%` }}
                  type="button"
                >
                  <i aria-hidden>{presentation.icon}</i>
                  <strong>{location.title}</strong>
                </button>
              )
            })}
          </div>
        </div>

        <div className="worldSelection">
          <div>
            <span className="eyebrow">{selectionCopy.eyebrow}</span>
            <strong>{selectedLocation?.title ?? 'Неизвестная земля'}</strong>
            <small>{selectionCopy.hint}</small>
          </div>
          {availableIds.includes(selectedId) ? (
            <button className="primaryBtn compact" onClick={() => onTravel(selectedId)} type="button">Отправиться</button>
          ) : (
            <button className="secondaryBtn compact" onClick={onClose} type="button">Вернуться</button>
          )}
        </div>
      </section>
    </div>
  )
}

function DevPanel({
  routeSteps,
  totalXp,
  coins,
  evolution,
  canCompleteRoute,
  onAddRouteSteps,
  onAddXp,
  onAddCoins,
  onAddShard,
  onAdvanceEvolution,
  onCompleteRoute,
  onShowNotification,
  onShowNight,
  onReset,
  onClose,
}: {
  routeSteps: number
  totalXp: number
  coins: number
  evolution: HeroEvolutionState
  canCompleteRoute: boolean
  onAddRouteSteps: (amount: number) => void
  onAddXp: (amount: number) => void
  onAddCoins: (amount: number) => void
  onAddShard: () => void
  onAdvanceEvolution: () => void
  onCompleteRoute: () => void
  onShowNotification: () => void
  onShowNight: () => void
  onReset: () => void
  onClose: () => void
}) {
  const [resetArmed, setResetArmed] = useState(false)
  const nextEvolution = getNextEvolutionRequirement(evolution)

  return (
    <div className="devOverlay" role="presentation">
      <section aria-labelledby="dev-title" aria-modal="true" className="devPanel" role="dialog">
        <div className="devHeader">
          <div><span className="eyebrow">Тестовый режим</span><h2 id="dev-title">Управление прогрессом</h2></div>
          <button aria-label="Закрыть тестовое меню" className="devClose" onClick={onClose} type="button">×</button>
        </div>

        <div className="devStats">
          <span>На путь <strong>{fmt(routeSteps)}</strong></span>
          <span>XP <strong>{fmt(totalXp)}</strong></span>
          <span>Монеты <strong>{fmt(coins)}</strong></span>
          <span>Форма <strong>{EVOLUTION_STAGE_TITLES[evolution.stage]}</strong></span>
          <span>Осколки <strong>{evolution.shards.free}/{evolution.shards.found}</strong></span>
        </div>

        <div className="devSection">
          <strong>Маршрут</strong>
          <div className="devActions">
            <button onClick={() => onAddRouteSteps(500)} type="button">+500 шагов</button>
            <button onClick={() => onAddRouteSteps(2000)} type="button">+2 000 шагов</button>
            <button disabled={!canCompleteRoute} onClick={onCompleteRoute} type="button">Завершить путь</button>
          </div>
        </div>

        <div className="devSection">
          <strong>Герой и лагерь</strong>
          <div className="devActions">
            <button onClick={() => onAddXp(300)} type="button">+300 XP</button>
            <button onClick={() => onAddCoins(100)} type="button">+100 монет</button>
            <button onClick={() => onAddCoins(500)} type="button">+500 монет</button>
            <button onClick={onAddShard} type="button">+1 осколок</button>
            <button disabled={!canAdvanceEvolution(evolution, nextEvolution)} onClick={onAdvanceEvolution} type="button">
              {nextEvolution ? `Стать ${nextEvolution.title}` : 'Ствол собран'}
            </button>
            <button onClick={onShowNight} type="button">Показать ночное событие</button>
            <button onClick={() => { void onShowNotification() }} type="button">Пробное уведомление</button>
          </div>
        </div>

        <div className="devFooter">
          {resetArmed ? (
            <>
              <button className="dangerBtn" onClick={() => { onReset(); setResetArmed(false) }} type="button">Да, сбросить всё</button>
              <button onClick={() => setResetArmed(false)} type="button">Отмена</button>
            </>
          ) : (
            <button className="dangerGhost" onClick={() => setResetArmed(true)} type="button">Сбросить весь прогресс</button>
          )}
        </div>
      </section>
    </div>
  )
}

const formatReminderTime = (hour: number, minute: number) => `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`

const parseReminderTime = (value: string) => {
  const [hour, minute] = value.split(':').map(Number)
  return {
    hour: Number.isFinite(hour) ? Math.min(23, Math.max(0, Math.floor(hour))) : 0,
    minute: Number.isFinite(minute) ? Math.min(59, Math.max(0, Math.floor(minute))) : 0,
  }
}

function ProfileScreen({
  journal,
  lastDays,
  notifications,
  onUpdateNotifications,
  streak,
  totalXp,
}: {
  journal: StoryJournalEntry[]
  lastDays: DayEntry[]
  notifications: NotificationSettings
  onUpdateNotifications: (settings: NotificationSettings) => void
  streak: StreakState
  totalXp: number
}) {
  const setFrequency = (frequency: NotificationSettings['frequency']) => {
    onUpdateNotifications({
      ...notifications,
      frequency,
      morning: { ...notifications.morning, enabled: frequency === 'twice' },
      evening: { ...notifications.evening, enabled: true },
    })
  }

  const setReminderTime = (kind: 'morning' | 'evening', value: string) => {
    const time = parseReminderTime(value)
    onUpdateNotifications({
      ...notifications,
      [kind]: { ...notifications[kind], ...time, enabled: kind === 'evening' || notifications.frequency === 'twice' },
    })
  }

  return (
    <section className="screenStack">
      <div className="sectionHeader">
        <div>
          <span className="eyebrow">Профиль</span>
          <h1>Журнал пути</h1>
        </div>
        <strong>{fmt(totalXp)} XP</strong>
      </div>

      <section className="streakPanel" aria-label="Серия активных дней">
        <div>
          <span className="eyebrow">Серия</span>
          <strong>{streak.count > 0 ? `Ты в пути уже ${streak.count} ${pluralStreakDays(streak.count)}` : 'Серия начнётся с первым активным днём'}</strong>
        </div>
        <span className="streakStones" title="Камень странника сохраняет серию при пропуске одного дня">✦ {streak.stones}</span>
      </section>

      <section className="notificationSettings" aria-labelledby="notification-settings-title">
        <div>
          <span className="eyebrow">Уведомления</span>
          <strong id="notification-settings-title">Ритм напоминаний</strong>
        </div>
        <div className="segmentedControl" role="group" aria-label="Частота уведомлений">
          <button className={notifications.frequency === 'once' ? 'active' : ''} onClick={() => setFrequency('once')} type="button">1 раз</button>
          <button className={notifications.frequency === 'twice' ? 'active' : ''} onClick={() => setFrequency('twice')} type="button">2 раза</button>
        </div>
        <div className="reminderGrid">
          <label className={notifications.frequency === 'twice' ? '' : 'disabled'}>
            <span>Утро</span>
            <input
              disabled={notifications.frequency !== 'twice'}
              onChange={(event) => setReminderTime('morning', event.target.value)}
              type="time"
              value={formatReminderTime(notifications.morning.hour, notifications.morning.minute)}
            />
          </label>
          <label>
            <span>Вечер</span>
            <input
              onChange={(event) => setReminderTime('evening', event.target.value)}
              type="time"
              value={formatReminderTime(notifications.evening.hour, notifications.evening.minute)}
            />
          </label>
        </div>
      </section>

      <div className="journalSection">
        <span className="eyebrow">Решения и воспоминания</span>
        {journal.length === 0 ? <p className="muted">Значимые решения появятся здесь после встречи с воспоминанием.</p> : null}
        {[...journal].reverse().map((entry) => (
          <article className="storyLog" key={entry.encounterId}>
            <small>{entry.title}</small>
            <strong>{entry.choice}</strong>
            <p>{entry.result}</p>
          </article>
        ))}
      </div>

      <div className="historyList">
        {lastDays.length === 0 ? (
          <div className="emptyState">
            <strong>История пока пустая</strong>
            <p>Первый вечерний отчёт появится здесь.</p>
          </div>
        ) : null}

        {lastDays.map((day) => (
          <div className="historyRow" key={day.date}>
            <span>{day.date}</span>
            <strong>{fmt(day.steps)} шагов</strong>
            <small>+{day.xp} XP</small>
          </div>
        ))}
      </div>
    </section>
  )
}

export default App

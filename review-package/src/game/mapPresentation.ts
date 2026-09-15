import { getLockpickingConfig } from './minigames.ts'
import type { LocationMapDefinition, MapNode, MapProgress } from './map.ts'
import { isLocationPlayable } from './map.ts'
import type { WorldLocation, WorldProgress } from './world.ts'

export type LocalNodeVisualRole = 'start' | 'rest' | 'path' | 'cache' | 'event' | 'threat' | 'memory' | 'trial' | 'finale'
export type LocalNodeVisualState = 'locked' | 'hinted' | 'available' | 'selected' | 'active' | 'current' | 'complete' | 'depleted'
export type LocalRouteVisualState = 'locked' | 'gated' | 'available' | 'selected' | 'active' | 'complete'

export type WorldLocationVisualRole = 'origin' | 'region-entry' | 'ordinary' | 'connector' | 'key-landmark' | 'future-horizon'
export type WorldLocationVisualState = 'future' | 'locked-known' | 'available' | 'current' | 'complete'
export type WorldRouteVisualState = 'future' | 'locked' | 'available' | 'complete'

const CACHE_WORDS = /(тайник|сундук|монет|кошел|ящик|оружейн|заплечник|жетон)/i
const REGION_ENTRY_IDS = new Set(['grey-ferry', 'old-crossroads', 'ember-border', 'lower-pass'])
const CONNECTOR_IDS = new Set(['drowned-ford', 'hollow-grove', 'watcher-hill', 'heart-observatory'])
const KEY_LANDMARK_IDS = new Set(['fog-market', 'nameless-citadel', 'red-horizon', 'crown-breach', 'north-silence'])

export const getLocalNodeVisualRole = (node: MapNode, location: LocationMapDefinition): LocalNodeVisualRole => {
  if (node.id === location.finalNodeId) return 'finale'
  if (node.kind === 'start') return 'start'
  if (node.kind === 'camp') return 'rest'
  if (node.kind === 'memory') return 'memory'
  if (node.encounterId?.startsWith('trial-')) return 'trial'
  if (node.kind === 'battle') return 'threat'
  if (node.kind === 'landmark') return 'path'
  if (node.kind === 'event' && (node.icon === '□' || getLockpickingConfig(node.id) || CACHE_WORDS.test(`${node.title} ${node.description}`))) return 'cache'
  return 'event'
}

export const getLocalNodeVisualState = (
  node: MapNode,
  progress: MapProgress,
  location: LocationMapDefinition,
  availableTargetIds: string[],
  selectedNodeId: string,
): LocalNodeVisualState => {
  const role = getLocalNodeVisualRole(node, location)
  if (node.id === progress.currentNodeId) return 'current'
  if (node.id === progress.activeTargetId) return 'active'
  if (role === 'cache' && progress.rewardedNodeIds.includes(node.id)) return 'depleted'
  if (progress.completedNodeIds.includes(node.id)) return 'complete'
  if (node.id === selectedNodeId && availableTargetIds.includes(node.id)) return 'selected'
  if (availableTargetIds.includes(node.id)) return 'available'
  if (location.edges.some((edge) => edge.from === progress.currentNodeId && edge.to === node.id)) return 'hinted'
  return 'locked'
}

export const getLocalRouteVisualState = (
  from: string,
  to: string,
  progress: MapProgress,
  location: LocationMapDefinition,
  availableTargetIds: string[],
  selectedNodeId: string,
): LocalRouteVisualState => {
  const edge = location.edges.find((candidate) => candidate.from === from && candidate.to === to)
  if (progress.activeTargetId === to && progress.currentNodeId === from) return 'active'
  if (progress.completedNodeIds.includes(from) && progress.completedNodeIds.includes(to)) return 'complete'
  if (!progress.activeTargetId && selectedNodeId === to && progress.currentNodeId === from && availableTargetIds.includes(to)) return 'selected'
  if (progress.currentNodeId === from && availableTargetIds.includes(to)) return 'available'
  if (progress.currentNodeId === from && edge?.requiredStoryChoice) return 'gated'
  return 'locked'
}

export const getLocalNodePresentation = (role: LocalNodeVisualRole) => {
  const presentations: Record<LocalNodeVisualRole, { icon: string; label: string }> = {
    start: { icon: '◆', label: 'Старт' },
    rest: { icon: '🔥', label: 'Отдых' },
    path: { icon: '⚑', label: 'Путь' },
    cache: { icon: '🧰', label: 'Тайник' },
    event: { icon: '✦', label: 'Событие' },
    threat: { icon: '⚔', label: 'Угроза' },
    memory: { icon: '✦', label: 'Память' },
    trial: { icon: '🜁', label: 'Испытание' },
    finale: { icon: '✧', label: 'Предел' },
  }
  return presentations[role]
}

export const getLocalLockedHint = (node: MapNode, role: LocalNodeVisualRole, gated: boolean) => {
  if (gated) return 'Путь отзывается, но печать решения пока держит его закрытым.'
  if (role === 'cache') return 'В стороне слышится тихий звон металла, но тропа ещё не раскрылась.'
  if (role === 'threat' || role === 'trial') return 'Впереди воздух становится тяжелее, будто кто-то ждёт движения.'
  if (role === 'memory') return 'В тумане мерцает трещина света, но смысл ещё слишком далеко.'
  return `${node.description} Нужно подойти ближе, чтобы понять путь.`
}

export const getWorldLocationVisualRole = (location: WorldLocation): WorldLocationVisualRole => {
  if (location.id === 'silent-ruins') return 'origin'
  if (!isLocationPlayable(location.id)) return KEY_LANDMARK_IDS.has(location.id) ? 'key-landmark' : 'future-horizon'
  if (REGION_ENTRY_IDS.has(location.id)) return 'region-entry'
  if (CONNECTOR_IDS.has(location.id)) return 'connector'
  if (KEY_LANDMARK_IDS.has(location.id)) return 'key-landmark'
  return 'ordinary'
}

export const getWorldLocationVisualState = (
  location: WorldLocation,
  progress: WorldProgress,
  availableIds: string[],
): WorldLocationVisualState => {
  if (location.id === progress.currentLocationId) {
    return progress.completedLocationIds.includes(location.id) ? 'complete' : 'current'
  }
  if (progress.completedLocationIds.includes(location.id)) return 'complete'
  if (availableIds.includes(location.id)) return 'available'
  if (!isLocationPlayable(location.id)) return 'future'
  return 'locked-known'
}

export const getWorldRouteVisualState = (
  from: WorldLocation,
  to: WorldLocation,
  fromState: WorldLocationVisualState,
  toState: WorldLocationVisualState,
  currentLocationId: string,
): WorldRouteVisualState => {
  if (fromState === 'future' || toState === 'future') return 'future'
  if (fromState === 'complete' && toState === 'complete') return 'complete'
  if ((from.id === currentLocationId && toState === 'available') || (to.id === currentLocationId && fromState === 'available')) return 'available'
  return 'locked'
}

export const getWorldLocationPresentation = (role: WorldLocationVisualRole, state: WorldLocationVisualState) => {
  if (state === 'complete') return { icon: '✓', label: 'Исследовано' }
  if (state === 'available') return { icon: '➜', label: 'Доступно' }
  if (state === 'current') return { icon: '◆', label: 'Здесь' }
  if (state === 'future') return { icon: '·', label: 'Горизонт' }

  const icons: Record<WorldLocationVisualRole, string> = {
    origin: '◆',
    'region-entry': '◇',
    ordinary: '?',
    connector: '≋',
    'key-landmark': '✦',
    'future-horizon': '·',
  }
  return { icon: icons[role], label: 'Закрыто' }
}

export const getWorldSelectionCopy = (
  location: WorldLocation | undefined,
  regionTitle: string | undefined,
  role: WorldLocationVisualRole | undefined,
  state: WorldLocationVisualState,
) => {
  const region = regionTitle ?? 'Неизвестный регион'
  if (!location || !role) {
    return { eyebrow: 'Неизвестная область', hint: 'Контур мира виден, но место ещё не назвало себя.' }
  }

  if (state === 'available') return { eyebrow: 'Доступное направление', hint: `${region} · можно отправиться из текущей точки.` }
  if (state === 'current') return { eyebrow: 'Текущее положение', hint: `${region} · герой находится здесь.` }
  if (state === 'complete') return { eyebrow: 'Исследовано', hint: `${region} · место уже пройдено, его след остался на карте.` }
  if (state === 'future') return { eyebrow: 'Будущий горизонт', hint: `${region} · это место откроется позже, когда путь дойдёт до этой земли.` }
  if (role === 'connector') return { eyebrow: 'Закрытый переход', hint: `${region} · сначала нужно завершить соседнюю локацию и открыть соединение.` }
  if (role === 'region-entry') return { eyebrow: 'Закрытый вход в регион', hint: `${region} · дорога видна, но прежний путь ещё не отпустил героя.` }
  return { eyebrow: 'Закрытая область', hint: `${region} · силуэт уже есть на карте, но путь к нему пока не сложился.` }
}

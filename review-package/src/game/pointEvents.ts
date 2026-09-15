import { getLocationMap, getMapNode, type MapNode } from './map.ts'
import { getConnectBattleConfig, getLockpickingConfig } from './minigames.ts'
import { getEvolutionShardSourceForNode } from './evolution.ts'

export type PointEventType = 'quick' | 'choice' | 'crossing' | 'search'
export type PointEventCategory = 'path' | 'cache' | 'threat' | 'camp' | 'memory' | 'seal' | 'find' | 'finale'
export type PointEventRewardTier = 'weak' | 'good' | 'perfect'

export type PointEventChoice = {
  id: string
  title: string
  text: string
  result: string
  coins: number
  xp: number
}

export type CarefulCrossingConfig = {
  safeCenter: number
  safeWidth: number
  perfectWidth: number
  speed: number
  steps: number
  goodBonus: { coins: number; xp: number }
  perfectBonus: { coins: number; xp: number }
}

export type AreaSearchSpot = {
  id: string
  title: string
  hint: string
  x: number
  y: number
  useful: boolean
}

export type AreaSearchConfig = {
  picks: number
  goodFound: number
  perfectFound: number
  spots: AreaSearchSpot[]
  goodBonus: { coins: number; xp: number }
  perfectBonus: { coins: number; xp: number }
  weakNote: string
  goodNote: string
  perfectNote: string
}

export type PointEventDefinition = {
  id: string
  nodeId: string
  locationId: string
  type: PointEventType
  category: PointEventCategory
  eyebrow: string
  title: string
  body: string
  art: string
  rewardHint: string
  actionLabel: string
  choices?: PointEventChoice[]
  crossing?: CarefulCrossingConfig
  search?: AreaSearchConfig
}

export type PointEventResult = {
  nodeId: string
  type: PointEventType
  choiceId?: string
  tier?: PointEventRewardTier
  coins: number
  xp: number
  note: string
}

export const getPointEventSaveKey = (locationId: string, nodeId: string) => `${locationId}:${nodeId}`

const POINT_EVENT_ART: Record<PointEventCategory, string> = {
  path: '/generated-assets/map-prologue-bg.png',
  cache: '/generated-assets/chest.png',
  threat: '/generated-assets/moss-sentinel.webp',
  camp: '/generated-assets/campfire.png',
  memory: '/generated-assets/memory-falling-world.webp',
  seal: '/generated-assets/silent-spire-distance.png',
  find: '/generated-assets/path-footprints.png',
  finale: '/generated-assets/silent-spire-distance.png',
}

const CHOICE_EVENTS: Record<string, PointEventChoice[]> = {
  'quiet-camp': [
    {
      id: 'bank-embers',
      title: 'Сберечь угли',
      text: 'Сложить пепел так, чтобы в нём осталось немного тепла.',
      result: 'Угли принимают форму маленького круга. Герой выходит спокойнее.',
      coins: 0,
      xp: 8,
    },
    {
      id: 'search-ashes',
      title: 'Разобрать пепел',
      text: 'Проверить, не осталось ли у костра чужих припасов.',
      result: 'Под серым слоем находится медная застёжка. Её можно унести без шума.',
      coins: 8,
      xp: 0,
    },
  ],
  'whispering-grove': [
    {
      id: 'listen',
      title: 'Слушать шаги',
      text: 'Замереть и дать роще повторить твой ритм.',
      result: 'Повтор становится тише. В нём проступает верная сторона тропы.',
      coins: 0,
      xp: 10,
    },
    {
      id: 'mark-bark',
      title: 'Оставить метку',
      text: 'Провести знаком по коре, пока лес не отвёл взгляд.',
      result: 'Знак держится дольше обычного и обещает не потерять обратный путь.',
      coins: 5,
      xp: 5,
    },
  ],
  'black-tracks': [
    {
      id: 'follow-human',
      title: 'Искать сапог',
      text: 'Выбрать след, который ещё похож на человеческий.',
      result: 'Чёрная грязь отдаёт старый шаг. В нём больше усталости, чем угрозы.',
      coins: 0,
      xp: 12,
    },
    {
      id: 'follow-claw',
      title: 'Проверить коготь',
      text: 'Не отворачиваться от той части следа, где дорога темнеет.',
      result: 'Тень дрожит, но отступает. В грязи остаётся маленькая монета.',
      coins: 10,
      xp: 4,
    },
  ],
  'name-stone': [
    {
      id: 'trace-lines',
      title: 'Обвести черты',
      text: 'Повторить две пересекающиеся линии без имени.',
      result: 'Камень не вспоминает имя, но принимает движение руки.',
      coins: 0,
      xp: 12,
    },
    {
      id: 'leave-scratch',
      title: 'Добавить знак',
      text: 'Оставить рядом короткую зарубку для следующего путника.',
      result: 'Новая зарубка не стирается. Мох возле неё отдаёт блеск.',
      coins: 8,
      xp: 4,
    },
  ],
  'last-cairn': [
    {
      id: 'raise-stone',
      title: 'Поднять камень',
      text: 'Вернуть один плоский камень на вершину гурия.',
      result: 'Гурий становится выше на ладонь. Дорога впереди будто выдыхает.',
      coins: 0,
      xp: 12,
    },
    {
      id: 'read-gap',
      title: 'Прочесть пустоту',
      text: 'Посмотреть, какой знак оставил отсутствующий камень.',
      result: 'В пустом месте проступает тонкая дорожная царапина.',
      coins: 8,
      xp: 4,
    },
  ],
}

const CROSSING_EVENTS: Record<string, CarefulCrossingConfig> = {
  'sunken-road': {
    safeCenter: 58,
    safeWidth: 32,
    perfectWidth: 12,
    speed: 0.55,
    steps: 3,
    goodBonus: { coins: 0, xp: 8 },
    perfectBonus: { coins: 8, xp: 16 },
  },
  'hushed-causeway': {
    safeCenter: 45,
    safeWidth: 26,
    perfectWidth: 10,
    speed: 0.62,
    steps: 3,
    goodBonus: { coins: 0, xp: 10 },
    perfectBonus: { coins: 10, xp: 18 },
  },
  'root-bridge': {
    safeCenter: 52,
    safeWidth: 30,
    perfectWidth: 10,
    speed: 0.58,
    steps: 3,
    goodBonus: { coins: 0, xp: 9 },
    perfectBonus: { coins: 8, xp: 16 },
  },
  'roofline-crossing': {
    safeCenter: 48,
    safeWidth: 26,
    perfectWidth: 9,
    speed: 0.66,
    steps: 3,
    goodBonus: { coins: 0, xp: 10 },
    perfectBonus: { coins: 10, xp: 18 },
  },
  'wind-cut-ledges': {
    safeCenter: 42,
    safeWidth: 24,
    perfectWidth: 8,
    speed: 0.7,
    steps: 3,
    goodBonus: { coins: 0, xp: 12 },
    perfectBonus: { coins: 12, xp: 20 },
  },
}

const AREA_SEARCH_EVENTS: Record<string, AreaSearchConfig> = {
  'lantern-stone': {
    picks: 3,
    goodFound: 2,
    perfectFound: 3,
    goodBonus: { coins: 5, xp: 6 },
    perfectBonus: { coins: 12, xp: 12 },
    weakNote: 'Осмотр вышел поверхностным: герой взял только то, что уже лежало на виду.',
    goodNote: 'Герой заметил верные детали и унёс малый световой знак.',
    perfectNote: 'Каждая важная деталь найдена: зелёный огонь отдал тихий дорожный запас.',
    spots: [
      { id: 'green-ember', title: 'Зелёный уголёк', hint: 'тепло без дыма', x: 31, y: 34, useful: true },
      { id: 'copper-hook', title: 'Медный крюк', hint: 'блеск в выемке', x: 63, y: 42, useful: true },
      { id: 'dry-rune', title: 'Сухая руна', hint: 'знак под пеплом', x: 47, y: 66, useful: true },
      { id: 'cold-leaf', title: 'Холодный лист', hint: 'шумит без ветра', x: 75, y: 70, useful: false },
    ],
  },
  'willow-echo-bank': {
    picks: 3,
    goodFound: 2,
    perfectFound: 3,
    goodBonus: { coins: 0, xp: 8 },
    perfectBonus: { coins: 8, xp: 14 },
    weakNote: 'Ивы повторили лишний шум, но путь остался понятен.',
    goodNote: 'Герой отделил настоящий плеск от позднего эха.',
    perfectNote: 'Все верные отклики собраны: берег на миг показал сухую тропу.',
    spots: [
      { id: 'late-ripple', title: 'Поздняя рябь', hint: 'отвечает после шага', x: 35, y: 38, useful: true },
      { id: 'willow-knot', title: 'Узел ивы', hint: 'держит направление', x: 62, y: 31, useful: true },
      { id: 'dry-stone', title: 'Сухой камень', hint: 'не принимает воду', x: 54, y: 68, useful: true },
      { id: 'blank-reflection', title: 'Пустое отражение', hint: 'смотрит мимо', x: 76, y: 57, useful: false },
    ],
  },
  'bell-window': {
    picks: 3,
    goodFound: 2,
    perfectFound: 3,
    goodBonus: { coins: 4, xp: 8 },
    perfectBonus: { coins: 10, xp: 15 },
    weakNote: 'Колокольчик звякнул глухо: найденное осталось обычной отметкой пути.',
    goodNote: 'Герой нашёл две тихие детали и понял, где вода не спорит с домом.',
    perfectNote: 'Окно отозвалось чисто: все малые знаки подняты из затонувшей комнаты.',
    spots: [
      { id: 'mute-bell', title: 'Немой колокольчик', hint: 'звенит под водой', x: 48, y: 28, useful: true },
      { id: 'blue-cloth', title: 'Синяя ткань', hint: 'держится на гвозде', x: 29, y: 55, useful: true },
      { id: 'chalk-mark', title: 'Меловой знак', hint: 'не размыло', x: 67, y: 63, useful: true },
      { id: 'dark-pane', title: 'Тёмное стекло', hint: 'только отражает', x: 75, y: 36, useful: false },
    ],
  },
}

const inferPointEventCategory = (node: MapNode, locationId: string): PointEventCategory => {
  const location = getLocationMap(locationId)
  if (node.id === location.finalNodeId) return 'finale'
  if (node.kind === 'camp') return 'camp'
  if (node.kind === 'memory') return 'memory'
  if (node.kind === 'battle' || getConnectBattleConfig(node.id)) return 'threat'
  if (getLockpickingConfig(node.id) || node.icon === '□') return 'cache'
  if (node.encounterId?.startsWith('trial-') || node.icon === '◇' || node.icon === '✦') return 'seal'
  if (node.icon === '△') return 'find'
  return 'path'
}

const getQuickBody = (node: MapNode, category: PointEventCategory) => {
  if (category === 'cache') return `${node.description} Базовая находка уже засчитана; если здесь есть замок, аккуратное действие даст только бонус.`
  if (category === 'threat') return `${node.description} Дорога не закрывается, но короткая схватка может принести трофей.`
  if (category === 'memory') return `${node.description} Это место держит смысл, который герой сможет истолковать.`
  if (category === 'camp') return `${node.description} Пауза на маршруте закрепляет путь и даёт выбрать, что взять с собой.`
  if (category === 'finale') return `${node.description} Локация отмечена как пройденная, а мир ответит новым направлением.`
  return `${node.description} Герой отмечает место, собирает малый след пути и видит, куда тропа ведёт дальше.`
}

const getRewardHint = (category: PointEventCategory) => {
  if (category === 'cache') return 'База получена. Точная попытка может добавить добычу.'
  if (category === 'threat') return 'База получена. Бой влияет только на дополнительный трофей.'
  if (category === 'memory') return 'Выбор трактовки запишется в журнал.'
  if (category === 'finale') return 'Финал открывает следующий уровень карты.'
  if (category === 'camp') return 'Небольшая подготовка перед следующей дорогой.'
  return 'Короткая отметка пути без риска для прогресса.'
}

export const getPointEventDefinition = (locationId: string, nodeId: string): PointEventDefinition | null => {
  const node = getMapNode(nodeId, locationId)
  if (!node) return null
  if (node.kind === 'start') return null
  const category = inferPointEventCategory(node, locationId)
  const choices = CHOICE_EVENTS[node.id]
  const crossing = CROSSING_EVENTS[node.id]
  const search = AREA_SEARCH_EVENTS[node.id]
  const shardSource = getEvolutionShardSourceForNode(locationId, node.id)
  const type: PointEventType = crossing ? 'crossing' : search ? 'search' : choices ? 'choice' : 'quick'

  return {
    id: getPointEventSaveKey(locationId, node.id),
    nodeId: node.id,
    locationId,
    type,
    category,
    eyebrow: type === 'crossing'
      ? 'Точка пути · осторожный переход'
      : type === 'search'
        ? 'Точка пути · осмотр'
        : type === 'choice'
          ? 'Точка пути · выбор'
          : 'Точка пути',
    title: node.title,
    body: getQuickBody(node, category),
    art: POINT_EVENT_ART[category],
    rewardHint: shardSource ? `${getRewardHint(category)} Здесь найден ${shardSource.title}.` : getRewardHint(category),
    actionLabel: type === 'crossing' ? 'Сделать шаг' : type === 'search' ? 'Осмотреть' : type === 'choice' ? 'Выбрать действие' : 'Продолжить',
    choices,
    crossing,
    search,
  }
}

export const getCarefulCrossingMarkerPosition = (elapsedMs: number, config: CarefulCrossingConfig) => {
  const phase = (elapsedMs / 1000) * config.speed
  return 50 + Math.sin(phase * Math.PI * 2) * 42
}

export const rateCarefulCrossingTap = (position: number, config: CarefulCrossingConfig): PointEventRewardTier => {
  const distance = Math.abs(position - config.safeCenter)
  if (distance <= config.perfectWidth / 2) return 'perfect'
  if (distance <= config.safeWidth / 2) return 'good'
  return 'weak'
}

export const resolvePointEventChoice = (definition: PointEventDefinition, choiceId: string): PointEventResult => {
  const choice = definition.choices?.find((item) => item.id === choiceId)
  if (!choice) {
    return { nodeId: definition.nodeId, type: definition.type, coins: 0, xp: 0, note: 'Герой отмечает место и идёт дальше.' }
  }
  return {
    nodeId: definition.nodeId,
    type: 'choice',
    choiceId: choice.id,
    coins: choice.coins,
    xp: choice.xp,
    note: choice.result,
  }
}

export const resolveCarefulCrossing = (
  definition: PointEventDefinition,
  ratings: PointEventRewardTier[],
): PointEventResult => {
  const config = definition.crossing
  const goodSteps = ratings.filter((rating) => rating !== 'weak').length
  const perfectSteps = ratings.filter((rating) => rating === 'perfect').length
  const tier: PointEventRewardTier = config && goodSteps === config.steps && perfectSteps >= 2
    ? 'perfect'
    : config && goodSteps >= Math.max(2, config.steps - 1)
      ? 'good'
      : 'weak'
  const bonus = tier === 'perfect' ? config?.perfectBonus : tier === 'good' ? config?.goodBonus : undefined
  const note = tier === 'perfect'
    ? 'Переход пройден чисто: герой не сбил ни одного опасного шага.'
    : tier === 'good'
      ? 'Герой прошёл осторожно и вынес из перехода верный ритм.'
      : 'Переход вышел неровным, но дорога всё равно осталась за спиной.'

  return {
    nodeId: definition.nodeId,
    type: 'crossing',
    tier,
    coins: bonus?.coins ?? 0,
    xp: bonus?.xp ?? 0,
    note,
  }
}

export const resolveAreaSearch = (
  definition: PointEventDefinition,
  spotIds: string[],
): PointEventResult => {
  const config = definition.search
  if (!config) {
    return { nodeId: definition.nodeId, type: definition.type, tier: 'weak', coins: 0, xp: 0, note: 'Герой осмотрел место и пошёл дальше.' }
  }
  const uniqueSpotIds = Array.from(new Set(spotIds)).slice(0, config.picks)
  const found = uniqueSpotIds.filter((id) => config.spots.find((spot) => spot.id === id)?.useful).length
  const tier: PointEventRewardTier = found >= config.perfectFound ? 'perfect' : found >= config.goodFound ? 'good' : 'weak'
  const bonus = tier === 'perfect' ? config.perfectBonus : tier === 'good' ? config.goodBonus : undefined
  const note = tier === 'perfect' ? config.perfectNote : tier === 'good' ? config.goodNote : config.weakNote

  return {
    nodeId: definition.nodeId,
    type: 'search',
    tier,
    coins: bonus?.coins ?? 0,
    xp: bonus?.xp ?? 0,
    note,
  }
}

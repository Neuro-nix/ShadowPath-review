import type { PointEventResult } from './pointEvents.ts'

export type LockpickingPinRating = 'perfect' | 'good' | 'miss'
export type LockpickingRewardTier = 'weak' | 'good' | 'perfect'
export type ConnectBattleSymbol = 'attack' | 'guard' | 'flame' | 'break'
export type ConnectBattleRewardTier = 'weak' | 'good' | 'perfect'
export type ConnectBattleIntentType = 'strike' | 'guard' | 'ritual' | 'pressure' | 'summon'

export type LockpickingConfig = {
  id: string
  nodeId: string
  title: string
  scene: string
  pinCount: number
  speed: number
  successCenter: number
  successWidth: number
  perfectWidth: number
  goodBonus: { coins: number; xp: number }
  perfectBonus: { coins: number; xp: number }
}

export type LockpickingResult = {
  nodeId: string
  tier: LockpickingRewardTier
  ratings: LockpickingPinRating[]
  coins: number
  xp: number
}

export type ConnectBattleConfig = {
  id: string
  nodeId: string
  title: string
  scene: string
  intent: {
    type: ConnectBattleIntentType
    title: string
    text: string
    focusSymbol: ConnectBattleSymbol
    focusLabel: string
  }
  resultCopy: Record<ConnectBattleRewardTier, { outcome: string; title: string; text: string }>
  boardSize: number
  symbols: ConnectBattleSymbol[]
  turns: number
  goodTarget: number
  perfectTarget: number
  goodBonus: { coins: number; xp: number }
  perfectBonus: { coins: number; xp: number }
}

export type ConnectBattleChain = {
  symbol: ConnectBattleSymbol
  length: number
}

export type ConnectBattleScore = Record<ConnectBattleSymbol, number> & {
  total: number
}

export type ConnectBattleResult = {
  nodeId: string
  tier: ConnectBattleRewardTier
  chains: ConnectBattleChain[]
  score: ConnectBattleScore
  coins: number
  xp: number
}

export type MinigameProgress = {
  lockpicking: Record<string, LockpickingResult>
  battles: Record<string, ConnectBattleResult>
  pointEvents: Record<string, PointEventResult>
}

export const createInitialMinigameProgress = (): MinigameProgress => ({
  lockpicking: {},
  battles: {},
  pointEvents: {},
})

export const LOCKPICKING_CACHES: Record<string, LockpickingConfig> = {
  'forgotten-cache': {
    id: 'forgotten-cache-lock',
    nodeId: 'forgotten-cache',
    title: 'Забытый тайник',
    scene: 'В щели разрушенной стены спрятана старая застёжка. Три штифта ходят медленно: поймай метку в светлой прорези, чтобы открыть тайник чище.',
    pinCount: 3,
    speed: 0.42,
    successCenter: 36,
    successWidth: 32,
    perfectWidth: 12,
    goodBonus: { coins: 8, xp: 5 },
    perfectBonus: { coins: 18, xp: 10 },
  },
  'abandoned-cart': {
    id: 'abandoned-cart-cache',
    nodeId: 'abandoned-cart',
    title: 'Брошенная телега',
    scene: 'Под прогнившим полотном спрятан дорожный ящик. Штифты ходят туго, но замок ещё помнит руку хозяина.',
    pinCount: 3,
    speed: 0.5,
    successCenter: 38,
    successWidth: 28,
    perfectWidth: 9,
    goodBonus: { coins: 10, xp: 5 },
    perfectBonus: { coins: 22, xp: 10 },
  },
  'buried-armory': {
    id: 'buried-armory-cache',
    nodeId: 'buried-armory',
    title: 'Погребённая оружейная',
    scene: 'Ржавое оружие окружает нетронутый дорожный сундук. Три штифта дрожат от старой печати.',
    pinCount: 3,
    speed: 0.56,
    successCenter: 34,
    successWidth: 24,
    perfectWidth: 8,
    goodBonus: { coins: 14, xp: 6 },
    perfectBonus: { coins: 28, xp: 12 },
  },
  'drowned-wheel-cache': {
    id: 'drowned-wheel-cache-lock',
    nodeId: 'drowned-wheel-cache',
    title: 'Тайник у колеса',
    scene: 'Мокрая лента стягивает кошель внутри колеса. Лови штифты, пока вода не сбила метки.',
    pinCount: 3,
    speed: 0.54,
    successCenter: 36,
    successWidth: 26,
    perfectWidth: 8,
    goodBonus: { coins: 12, xp: 5 },
    perfectBonus: { coins: 25, xp: 10 },
  },
  'silent-nest-cache': {
    id: 'silent-nest-cache-lock',
    nodeId: 'silent-nest-cache',
    title: 'Беззвучное гнездо',
    scene: 'Ветки держат листовой свёрток, будто маленький замок. Нужно поймать три тихих щелчка.',
    pinCount: 3,
    speed: 0.52,
    successCenter: 37,
    successWidth: 27,
    perfectWidth: 9,
    goodBonus: { coins: 12, xp: 5 },
    perfectBonus: { coins: 24, xp: 10 },
  },
  'watcher-lost-pack': {
    id: 'watcher-lost-pack-lock',
    nodeId: 'watcher-lost-pack',
    title: 'Брошенный заплечник',
    scene: 'Обугленные ремни спеклись вокруг пряжки. Если открыть аккуратно, внутри сохранится больше припасов.',
    pinCount: 3,
    speed: 0.58,
    successCenter: 35,
    successWidth: 24,
    perfectWidth: 8,
    goodBonus: { coins: 14, xp: 5 },
    perfectBonus: { coins: 28, xp: 12 },
  },
  'astronomer-lockbox': {
    id: 'astronomer-lockbox-lock',
    nodeId: 'astronomer-lockbox',
    title: 'Ящик звёздочёта',
    scene: 'Узкий ящик открывается не ключом, а точным счётом. Штифты движутся как маленькие орбиты.',
    pinCount: 3,
    speed: 0.6,
    successCenter: 33,
    successWidth: 24,
    perfectWidth: 8,
    goodBonus: { coins: 15, xp: 6 },
    perfectBonus: { coins: 30, xp: 12 },
  },
  'ferry-token-stone': {
    id: 'ferry-token-stone-lock',
    nodeId: 'ferry-token-stone',
    title: 'Камень жетонов',
    scene: 'Медные круги сидят в мокром камне как замочные язычки. Три точных нажатия отпустят переправный запас.',
    pinCount: 3,
    speed: 0.55,
    successCenter: 36,
    successWidth: 25,
    perfectWidth: 8,
    goodBonus: { coins: 12, xp: 5 },
    perfectBonus: { coins: 26, xp: 10 },
  },
  'reed-coin-braid': {
    id: 'reed-coin-braid-cache',
    nodeId: 'reed-coin-braid',
    title: 'Коса речных монет',
    scene: 'Три тонких штифта держат мокрую застёжку. Линия успеха неподвижна: поймай каждый штифт, когда метка проходит через светлую прорезь.',
    pinCount: 3,
    speed: 0.62,
    successCenter: 31,
    successWidth: 24,
    perfectWidth: 8,
    goodBonus: { coins: 15, xp: 5 },
    perfectBonus: { coins: 30, xp: 15 },
  },
  'drowned-hearth-cache': {
    id: 'drowned-hearth-cache-lock',
    nodeId: 'drowned-hearth-cache',
    title: 'Тайник у затонувшего очага',
    scene: 'Сухой мешочек держится под камнем очага. Замок мягкий, но вода делает каждый щелчок тяжёлым.',
    pinCount: 3,
    speed: 0.6,
    successCenter: 32,
    successWidth: 24,
    perfectWidth: 8,
    goodBonus: { coins: 15, xp: 5 },
    perfectBonus: { coins: 30, xp: 15 },
  },
  'fallen-signpost': {
    id: 'fallen-signpost-cache',
    nodeId: 'fallen-signpost',
    title: 'Упавший указатель',
    scene: 'Под стрелками указателя скрыта старая дорожная касса. Замок открывается, если поймать ритм трёх штифтов.',
    pinCount: 3,
    speed: 0.58,
    successCenter: 35,
    successWidth: 24,
    perfectWidth: 8,
    goodBonus: { coins: 13, xp: 5 },
    perfectBonus: { coins: 27, xp: 12 },
  },
  'melted-coin-line': {
    id: 'melted-coin-line-cache',
    nodeId: 'melted-coin-line',
    title: 'Линия оплавленных монет',
    scene: 'Монеты впаяны в горячую землю. Нужно освободить их осторожно, пока металл не сорвался в пепел.',
    pinCount: 3,
    speed: 0.64,
    successCenter: 32,
    successWidth: 22,
    perfectWidth: 7,
    goodBonus: { coins: 16, xp: 6 },
    perfectBonus: { coins: 32, xp: 14 },
  },
  'frozen-seal-cache': {
    id: 'frozen-seal-cache-lock',
    nodeId: 'frozen-seal-cache',
    title: 'Тайник замёрзшей печати',
    scene: 'Наледь держит расколотый знак. Каждый штифт срывается вниз, если нажать слишком поздно.',
    pinCount: 3,
    speed: 0.62,
    successCenter: 30,
    successWidth: 22,
    perfectWidth: 7,
    goodBonus: { coins: 16, xp: 6 },
    perfectBonus: { coins: 32, xp: 14 },
  },
}

export const getLockpickingConfig = (nodeId: string) => LOCKPICKING_CACHES[nodeId]

export const CONNECT_BATTLES: Record<string, ConnectBattleConfig> = {
  'ash-guard': {
    id: 'ash-guard-battle',
    nodeId: 'ash-guard',
    title: 'Пепельный страж',
    scene: 'Страж уже признал выбранное действие, но пепел всё ещё держит форму удара. Соединяй соседние одинаковые знаки по 3 и больше: удар давит вперёд, щит держит стойку, пламя собирает волю, разрыв сбивает чужой ритм.',
    intent: {
      type: 'strike',
      title: 'Намерение: тяжёлый удар',
      text: 'Пепельная рука заносится прямо в проход. Щиты принимают удар, а удары помогают не дать форме собраться снова.',
      focusSymbol: 'guard',
      focusLabel: 'Щит важен: он держит первый натиск.',
    },
    resultCopy: {
      weak: {
        outcome: 'Победа с потерями',
        title: 'Удар пережит',
        text: 'Страж отступил, но удар прошёл близко. Путь открыт, базовая награда сохранена, боевой бонус не выпал.',
      },
      good: {
        outcome: 'Победа',
        title: 'Стойка выдержала',
        text: 'Щиты и точные цепи приняли натиск. Страж потерял форму, а герой забрал боевой трофей.',
      },
      perfect: {
        outcome: 'Чистая победа',
        title: 'Пепел не дошёл',
        text: 'Намерение удара рассыпалось до касания. Путь открыт спокойно, лучший трофей остался у героя.',
      },
    },
    boardSize: 5,
    symbols: ['attack', 'guard', 'flame', 'break'],
    turns: 6,
    goodTarget: 12,
    perfectTarget: 22,
    goodBonus: { coins: 10, xp: 8 },
    perfectBonus: { coins: 22, xp: 15 },
  },
  'road-warden': {
    id: 'road-warden-battle',
    nodeId: 'road-warden',
    title: 'Страж тракта',
    scene: 'Пустые доспехи требуют не слово, а выдержанный ритм. Соединяй знаки, чтобы разобрать приказ, который всё ещё держит дорогу.',
    intent: {
      type: 'guard',
      title: 'Намерение: закрыть тракт',
      text: 'Доспехи смыкают старый приказ в броню. Разрыв важнее грубой силы: он раскрывает щель в запрете.',
      focusSymbol: 'break',
      focusLabel: 'Разрыв важен: он открывает приказ перед ударом.',
    },
    resultCopy: {
      weak: {
        outcome: 'Проход добыт',
        title: 'Приказ треснул',
        text: 'Доспехи уступили, но дорога ещё долго звенит запретом. Путь открыт, боевой бонус не выпал.',
      },
      good: {
        outcome: 'Победа',
        title: 'Тракт отвечает',
        text: 'Цепи разрыва раскрыли приказ, и удар нашёл место. К базовой награде добавлен трофей.',
      },
      perfect: {
        outcome: 'Чистая победа',
        title: 'Приказ снят',
        text: 'Запрет распался без остатка. Страж тракта больше не держит этот участок дороги.',
      },
    },
    boardSize: 5,
    symbols: ['attack', 'guard', 'flame', 'break'],
    turns: 6,
    goodTarget: 16,
    perfectTarget: 25,
    goodBonus: { coins: 16, xp: 10 },
    perfectBonus: { coins: 32, xp: 18 },
  },
  'moss-sentinel': {
    id: 'moss-sentinel-battle',
    nodeId: 'moss-sentinel',
    title: 'Мшистый часовой',
    scene: 'Страж уже услышал твой выбор, но древний приказ ещё сопротивляется. Собери цепи знаков и удержи проход.',
    intent: {
      type: 'pressure',
      title: 'Намерение: задавить проход',
      text: 'Мох тянется к ногам, приказ давит весом. Щиты сохраняют место, сильные цепи отталкивают стража назад.',
      focusSymbol: 'guard',
      focusLabel: 'Щит важен: он сохраняет проход под давлением.',
    },
    resultCopy: {
      weak: {
        outcome: 'Проход удержан',
        title: 'Мох отступил',
        text: 'Часовой отпустил тропу, но давление осталось в земле. Путь открыт, боевой бонус не выпал.',
      },
      good: {
        outcome: 'Победа',
        title: 'Проход дышит',
        text: 'Герой удержал место и сбил древний приказ. К награде точки добавлен трофей.',
      },
      perfect: {
        outcome: 'Чистая победа',
        title: 'Приказ уснул',
        text: 'Мшистый часовой расступился без нового удара. Лучший трофей остался на открытой тропе.',
      },
    },
    boardSize: 5,
    symbols: ['attack', 'guard', 'flame', 'break'],
    turns: 6,
    goodTarget: 17,
    perfectTarget: 26,
    goodBonus: { coins: 18, xp: 12 },
    perfectBonus: { coins: 35, xp: 22 },
  },
  'fog-choir-pool': {
    id: 'fog-choir-pool-battle',
    nodeId: 'fog-choir-pool',
    title: 'Пруд туманного хора',
    scene: 'Голоса под водой сбиваются в Морок. Соединяй соседние одинаковые знаки по 3 и больше: удар давит вперёд, щит держит берег, пламя собирает волю, разрыв сбивает чужой ритм.',
    intent: {
      type: 'ritual',
      title: 'Намерение: утянуть песню в Морок',
      text: 'Хор пытается закончить чужой припев под водой. Разрыв сбивает ритм, пламя собирает волю и не даёт голосам сомкнуться.',
      focusSymbol: 'break',
      focusLabel: 'Разрыв важен: он ломает припев Морока.',
    },
    resultCopy: {
      weak: {
        outcome: 'Хор отступил',
        title: 'Песня оборвалась поздно',
        text: 'Голоса ушли под воду, но Морок успел зацепить край берега. Путь открыт, боевой бонус не выпал.',
      },
      good: {
        outcome: 'Победа',
        title: 'Ритм разомкнут',
        text: 'Разрыв и пламя сбили припев до того, как он стал ловушкой. К награде точки добавлен трофей.',
      },
      perfect: {
        outcome: 'Чистая победа',
        title: 'Морок не понял песню',
        text: 'Припев рассыпался в чистую воду. Хор замолчал спокойно, а лучший трофей остался на берегу.',
      },
    },
    boardSize: 5,
    symbols: ['attack', 'guard', 'flame', 'break'],
    turns: 6,
    goodTarget: 18,
    perfectTarget: 26,
    goodBonus: { coins: 18, xp: 10 },
    perfectBonus: { coins: 35, xp: 20 },
  },
  'cinder-watch': {
    id: 'cinder-watch-battle',
    nodeId: 'cinder-watch',
    title: 'Пепельный дозор',
    scene: 'Тонкая тень на гребне сжимает жар в форму удара. Разомкни её знаками, пока пепел не стал телом.',
    intent: {
      type: 'summon',
      title: 'Намерение: собрать тело из жара',
      text: 'Дозор зовёт пепел в плотную форму. Удары быстро сбивают тело, разрыв ослабляет сам зов.',
      focusSymbol: 'attack',
      focusLabel: 'Удар важен: он разбивает тело до сборки.',
    },
    resultCopy: {
      weak: {
        outcome: 'Дозор рассеян',
        title: 'Жар погас поздно',
        text: 'Форма распалась, но успела оставить ожог на дороге. Путь открыт, боевой бонус не выпал.',
      },
      good: {
        outcome: 'Победа',
        title: 'Тело не собрано',
        text: 'Сильные цепи сбили дозор до полной сборки. К базовой награде добавлен трофей.',
      },
      perfect: {
        outcome: 'Чистая победа',
        title: 'Пепел не ответил',
        text: 'Зов рассыпался раньше, чем получил тело. Герой забрал лучший трофей без нового удара.',
      },
    },
    boardSize: 5,
    symbols: ['attack', 'guard', 'flame', 'break'],
    turns: 6,
    goodTarget: 17,
    perfectTarget: 27,
    goodBonus: { coins: 18, xp: 12 },
    perfectBonus: { coins: 36, xp: 22 },
  },
}

export const getConnectBattleConfig = (nodeId: string) => CONNECT_BATTLES[nodeId]

export const getLockpickingPinPosition = (elapsedMs: number, pinIndex: number, speed: number) => {
  const phase = (elapsedMs / 1000) * speed + pinIndex * 0.19
  return 50 + Math.sin(phase * Math.PI * 2) * 40
}

export const rateLockpickingPin = (position: number, config: LockpickingConfig): LockpickingPinRating => {
  const distance = Math.abs(position - config.successCenter)
  if (distance <= config.perfectWidth / 2) return 'perfect'
  if (distance <= config.successWidth / 2) return 'good'
  return 'miss'
}

export const resolveLockpicking = (nodeId: string, ratings: LockpickingPinRating[]): LockpickingResult => {
  const config = getLockpickingConfig(nodeId)
  const goodPins = ratings.filter((rating) => rating !== 'miss').length
  const perfectPins = ratings.filter((rating) => rating === 'perfect').length
  const tier: LockpickingRewardTier = goodPins === config?.pinCount && perfectPins >= 2
    ? 'perfect'
    : goodPins >= 2
      ? 'good'
      : 'weak'
  const bonus = tier === 'perfect' ? config?.perfectBonus : tier === 'good' ? config?.goodBonus : undefined

  return {
    nodeId,
    tier,
    ratings,
    coins: bonus?.coins ?? 0,
    xp: bonus?.xp ?? 0,
  }
}

const BATTLE_ABILITY_SYMBOL: Partial<Record<ConnectBattleSymbol, string>> = {
  attack: 'ash-lunge',
  guard: 'guard-stance',
  break: 'silent-break',
}

export const createConnectBattleBoard = (config: ConnectBattleConfig, turnSeed = 0): ConnectBattleSymbol[] => {
  const seed = config.nodeId.length + turnSeed
  return Array.from({ length: config.boardSize * config.boardSize }, (_, index) => {
    const x = index % config.boardSize
    const y = Math.floor(index / config.boardSize)
    return config.symbols[(Math.floor(x / 2) + Math.floor(y / 2) * 2 + seed) % config.symbols.length]
  })
}

export const areConnectBattleTilesAdjacent = (from: number, to: number, boardSize: number) => {
  const fromX = from % boardSize
  const fromY = Math.floor(from / boardSize)
  const toX = to % boardSize
  const toY = Math.floor(to / boardSize)
  const dx = Math.abs(fromX - toX)
  const dy = Math.abs(fromY - toY)
  return dx <= 1 && dy <= 1 && dx + dy > 0
}

export const refillConnectBattleBoard = (
  board: ConnectBattleSymbol[],
  selectedTileIds: number[],
  config: ConnectBattleConfig,
  turnSeed: number,
): ConnectBattleSymbol[] => {
  const selected = new Set(selectedTileIds)
  return board.map((symbol, index) => {
    if (!selected.has(index)) return symbol
    const x = index % config.boardSize
    const y = Math.floor(index / config.boardSize)
    return config.symbols[(x + y * 2 + turnSeed + selectedTileIds.length) % config.symbols.length]
  })
}

export const scoreConnectBattleChains = (
  chains: ConnectBattleChain[],
  ownedAbilities: string[] = [],
): ConnectBattleScore => {
  const score: ConnectBattleScore = { attack: 0, guard: 0, flame: 0, break: 0, total: 0 }
  for (const chain of chains) {
    const longChainBonus = chain.length >= 4 ? 1 : 0
    const abilityBonus = BATTLE_ABILITY_SYMBOL[chain.symbol] && ownedAbilities.includes(BATTLE_ABILITY_SYMBOL[chain.symbol]!) ? 2 : 0
    score[chain.symbol] += chain.length + longChainBonus + abilityBonus
  }
  score.total = score.attack + score.guard + score.flame + score.break
  return score
}

export const resolveConnectBattle = (
  nodeId: string,
  chains: ConnectBattleChain[],
  ownedAbilities: string[] = [],
): ConnectBattleResult => {
  const config = getConnectBattleConfig(nodeId)
  const score = scoreConnectBattleChains(chains, ownedAbilities)
  const tier: ConnectBattleRewardTier = score.total >= (config?.perfectTarget ?? Number.POSITIVE_INFINITY)
    ? 'perfect'
    : score.total >= (config?.goodTarget ?? Number.POSITIVE_INFINITY)
      ? 'good'
      : 'weak'
  const bonus = tier === 'perfect' ? config?.perfectBonus : tier === 'good' ? config?.goodBonus : undefined

  return {
    nodeId,
    tier,
    chains,
    score,
    coins: bonus?.coins ?? 0,
    xp: bonus?.xp ?? 0,
  }
}

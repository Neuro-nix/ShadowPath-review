export type HeroEvolutionStage = 'nothing' | 'shadowborn' | 'ghoul'

export type EvolutionShardLedger = {
  found: number
  free: number
  invested: number
}

export type HeroEvolutionState = {
  stage: HeroEvolutionStage
  shards: EvolutionShardLedger
  claimedSourceIds: string[]
}

export type EvolutionShardSource = {
  id: string
  locationId: string
  nodeId: string
  amount: number
  title: string
}

export type EvolutionRequirement = {
  stage: HeroEvolutionStage
  title: string
  requiredFrom: HeroEvolutionStage
  shardCost: number
}

export const EVOLUTION_REQUIREMENTS: Record<Exclude<HeroEvolutionStage, 'nothing'>, EvolutionRequirement> = {
  shadowborn: {
    stage: 'shadowborn',
    title: 'Shadowborn',
    requiredFrom: 'nothing',
    shardCost: 1,
  },
  ghoul: {
    stage: 'ghoul',
    title: 'Гуль',
    requiredFrom: 'shadowborn',
    shardCost: 2,
  },
}

export const EVOLUTION_STAGE_TITLES: Record<HeroEvolutionStage, string> = {
  nothing: 'Нечто',
  shadowborn: 'Shadowborn',
  ghoul: 'Гуль',
}

export const EVOLUTION_STAGE_DESCRIPTIONS: Record<HeroEvolutionStage, string> = {
  nothing: 'Бесформенный тёмный слайм: герой ещё не человек и не демон.',
  shadowborn: 'Тень обрела устойчивое тело, конечности и первый ясный центр воли.',
  ghoul: 'Гуманоидная промежуточная форма перед большим выбором ветви.',
}

export const EVOLUTION_SHARD_SOURCES: EvolutionShardSource[] = [
  {
    id: 'prologue-spire-overlook',
    locationId: 'silent-ruins',
    nodeId: 'spire-overlook',
    amount: 1,
    title: 'Осколок первого пути',
  },
]

const EVOLUTION_ORDER: HeroEvolutionStage[] = ['nothing', 'shadowborn', 'ghoul']

const clampWhole = (value: unknown) => Math.max(0, Math.floor(Number(value) || 0))

const normalizeStage = (stage: unknown): HeroEvolutionStage => {
  return EVOLUTION_ORDER.includes(stage as HeroEvolutionStage) ? stage as HeroEvolutionStage : 'nothing'
}

export const normalizeShardLedger = (ledger?: Partial<EvolutionShardLedger>): EvolutionShardLedger => {
  const found = clampWhole(ledger?.found)
  const invested = Math.min(found, clampWhole(ledger?.invested))
  const fallbackFree = Math.max(0, found - invested)
  const free = Math.min(found - invested, ledger?.free === undefined ? fallbackFree : clampWhole(ledger.free))
  return { found, free, invested }
}

export const createInitialHeroEvolution = (): HeroEvolutionState => ({
  stage: 'nothing',
  shards: { found: 0, free: 0, invested: 0 },
  claimedSourceIds: [],
})

export const normalizeHeroEvolution = (evolution?: Partial<HeroEvolutionState>): HeroEvolutionState => ({
  stage: normalizeStage(evolution?.stage),
  shards: normalizeShardLedger(evolution?.shards),
  claimedSourceIds: Array.from(new Set((evolution?.claimedSourceIds ?? []).filter((id): id is string => typeof id === 'string'))),
})

export const getEvolutionShardSourceForNode = (locationId: string, nodeId: string) =>
  EVOLUTION_SHARD_SOURCES.find((source) => source.locationId === locationId && source.nodeId === nodeId)

export const grantEvolutionShards = (evolution: HeroEvolutionState, amount: number, sourceId?: string): HeroEvolutionState => {
  const gained = clampWhole(amount)
  if (gained <= 0) return evolution
  if (sourceId && evolution.claimedSourceIds.includes(sourceId)) return evolution
  return {
    ...evolution,
    claimedSourceIds: sourceId ? [...evolution.claimedSourceIds, sourceId] : evolution.claimedSourceIds,
    shards: {
      found: evolution.shards.found + gained,
      free: evolution.shards.free + gained,
      invested: evolution.shards.invested,
    },
  }
}

export const grantEvolutionShardSource = (evolution: HeroEvolutionState, source: EvolutionShardSource): HeroEvolutionState =>
  grantEvolutionShards(evolution, source.amount, source.id)

export const getNextEvolutionRequirement = (evolution: HeroEvolutionState): EvolutionRequirement | null => {
  if (evolution.stage === 'nothing') return EVOLUTION_REQUIREMENTS.shadowborn
  if (evolution.stage === 'shadowborn') return EVOLUTION_REQUIREMENTS.ghoul
  return null
}

export const getMissingEvolutionShards = (evolution: HeroEvolutionState, requirement = getNextEvolutionRequirement(evolution)) => {
  if (!requirement) return 0
  return Math.max(0, requirement.shardCost - evolution.shards.free)
}

export const canAdvanceEvolution = (evolution: HeroEvolutionState, requirement = getNextEvolutionRequirement(evolution)) => {
  return Boolean(requirement && evolution.stage === requirement.requiredFrom && getMissingEvolutionShards(evolution, requirement) === 0)
}

export const advanceHeroEvolution = (evolution: HeroEvolutionState): HeroEvolutionState => {
  const requirement = getNextEvolutionRequirement(evolution)
  if (!canAdvanceEvolution(evolution, requirement) || !requirement) return evolution

  return {
    stage: requirement.stage,
    claimedSourceIds: evolution.claimedSourceIds,
    shards: {
      found: evolution.shards.found,
      free: evolution.shards.free - requirement.shardCost,
      invested: evolution.shards.invested + requirement.shardCost,
    },
  }
}

export const isEvolutionStageReached = (current: HeroEvolutionStage, target: HeroEvolutionStage) => {
  return EVOLUTION_ORDER.indexOf(current) >= EVOLUTION_ORDER.indexOf(target)
}

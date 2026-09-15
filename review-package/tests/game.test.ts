import assert from 'node:assert/strict'
import { calculateCampNodeReward } from '../src/game/camp.ts'
import {
  LOCATION_MAPS,
  addDebugRouteSteps,
  carryStepCreditToMap,
  createInitialMapProgress,
  creditTodaySteps,
  getAvailableTargetIds,
  getMapNode,
  isLocationPlayable,
  startMapRoute,
} from '../src/game/map.ts'
import { createInitialStoryProgress, resolveStoryEncounter } from '../src/game/story.ts'
import { createInitialNightProgress, createNightEvent, resolveNightEvent } from '../src/game/night.ts'
import {
  areConnectBattleTilesAdjacent,
  createConnectBattleBoard,
  getConnectBattleConfig,
  getLockpickingConfig,
  rateLockpickingPin,
  resolveConnectBattle,
  resolveLockpicking,
} from '../src/game/minigames.ts'
import {
  getCarefulCrossingMarkerPosition,
  getPointEventDefinition,
  getPointEventSaveKey,
  rateCarefulCrossingTap,
  resolveAreaSearch,
  resolveCarefulCrossing,
  resolvePointEventChoice,
} from '../src/game/pointEvents.ts'
import {
  getLocalNodeVisualRole,
  getLocalNodeVisualState,
  getLocalRouteVisualState,
  getWorldLocationVisualRole,
  getWorldLocationVisualState,
} from '../src/game/mapPresentation.ts'
import { getWorldLocation, getWorldNeighbors } from '../src/game/world.ts'
import { createEmptySave, getLevel, getLevelProgress, getLevelXpTarget, normalizeNotificationSettings } from '../src/game/progression.ts'
import { getPendingPrologueSceneNodeId } from '../src/components/prologueShellState.ts'
import {
  advanceHeroEvolution,
  canAdvanceEvolution,
  createInitialHeroEvolution,
  getEvolutionShardSourceForNode,
  grantEvolutionShards,
  grantEvolutionShardSource,
  normalizeHeroEvolution,
} from '../src/game/evolution.ts'

const enumerateRoutes = (locationId: string) => {
  const location = LOCATION_MAPS[locationId]
  const routes: { ids: string[]; cost: number }[] = []

  const visit = (nodeId: string, ids: string[], cost: number) => {
    assert.ok(!ids.includes(nodeId), `${locationId}: route must not loop`)
    const node = getMapNode(nodeId, locationId)
    assert.ok(node, `${locationId}: route node exists`)
    const nextIds = [...ids, nodeId]
    const nextCost = cost + node.cost
    if (nodeId === location.finalNodeId) {
      routes.push({ ids: nextIds, cost: nextCost })
      return
    }
    const outgoing = location.edges.filter((edge) => edge.from === nodeId)
    assert.ok(outgoing.length > 0, `${locationId}: non-final node has an exit`)
    outgoing.forEach((edge) => visit(edge.to, nextIds, nextCost))
  }

  visit(location.nodes[0].id, [], 0)
  return routes
}

for (const location of Object.values(LOCATION_MAPS)) {
  assert.ok(location.nodes.length >= 8 && location.nodes.length <= 12, `${location.id}: node count`)
  assert.equal(new Set(location.nodes.map((node) => node.id)).size, location.nodes.length, `${location.id}: unique node ids`)
  assert.ok(location.nodes.some((node) => node.id === location.finalNodeId), `${location.id}: final node exists`)

  const nodeIds = new Set(location.nodes.map((node) => node.id))
  for (const edge of location.edges) {
    assert.ok(nodeIds.has(edge.from) && nodeIds.has(edge.to), `${location.id}: edge references known nodes`)
  }

  let progress = createInitialMapProgress(location.id)
  const guard = new Set<string>()
  while (progress.currentNodeId !== location.finalNodeId) {
    assert.ok(!guard.has(progress.currentNodeId), `${location.id}: route must not loop`)
    guard.add(progress.currentNodeId)
    const targetId = getAvailableTargetIds(progress, location.id)[0]
    assert.ok(targetId, `${location.id}: final node must be reachable`)
    progress = startMapRoute(progress, targetId, location.id)
    const target = getMapNode(targetId, location.id)
    assert.ok(target)
    progress = addDebugRouteSteps(progress, target.cost, location.id)
  }
  assert.equal(progress.currentNodeId, location.finalNodeId, `${location.id}: simulated completion`)

  for (const node of location.nodes.slice(1)) {
    assert.ok(getPointEventDefinition(location.id, node.id), `${location.id}/${node.id}: reached point has a point event`)
  }
  assert.equal(getPointEventDefinition(location.id, location.nodes[0].id), null, `${location.id}: start point does not create an arrival point event`)
}

const completedPrologue = {
  ...createInitialMapProgress('silent-ruins'),
  currentNodeId: LOCATION_MAPS['silent-ruins'].finalNodeId,
  completedNodeIds: [LOCATION_MAPS['silent-ruins'].finalNodeId],
  stepBank: 9800,
  creditedDate: '2026-07-03',
  creditedSteps: 10000,
  locationCompleted: true,
}
const nextLocationProgress = carryStepCreditToMap(completedPrologue, createInitialMapProgress('quiet-road'))
assert.equal(nextLocationProgress.stepBank, 9800, 'unspent route steps carry into the next location')
assert.equal(nextLocationProgress.creditedDate, '2026-07-03', 'travel keeps the date already credited from HealthKit')
assert.equal(nextLocationProgress.creditedSteps, 10000, 'travel keeps the daily step count already credited from HealthKit')
assert.equal(nextLocationProgress.activeTargetId, null, 'travel does not leak the previous local route target')
assert.equal(nextLocationProgress.activeProgress, 0, 'travel starts the next local map without route progress')

const routeWithDailyCredit = startMapRoute(createInitialMapProgress('silent-ruins'), 'quiet-camp', 'silent-ruins')
const firstCredit = creditTodaySteps(routeWithDailyCredit, '2026-07-04', 700, 'silent-ruins')
assert.equal(firstCredit.activeProgress, 700, 'first same-day HealthKit read credits route progress')
const correctedDownCredit = creditTodaySteps(firstCredit, '2026-07-04', 500, 'silent-ruins')
assert.equal(correctedDownCredit.activeProgress, 700, 'lower same-day HealthKit corrections do not remove or rebase route progress')
assert.equal(correctedDownCredit.creditedSteps, 700, 'same-day credited step baseline remains monotonic')
const recoveredCredit = creditTodaySteps(correctedDownCredit, '2026-07-04', 900, 'silent-ruins')
assert.equal(recoveredCredit.currentNodeId, 'quiet-camp', 'later same-day HealthKit growth only credits the new delta')
assert.equal(recoveredCredit.stepBank, 0, 'same-day HealthKit recovery does not double-credit corrected steps')
const newDayCredit = creditTodaySteps(recoveredCredit, '2026-07-05', 300, 'silent-ruins')
assert.equal(newDayCredit.creditedSteps, 300, 'new local day starts a fresh HealthKit credit baseline')

const bankedRouteStart = { ...createInitialMapProgress('silent-ruins'), stepBank: 400 }
const startedBankedRoute = startMapRoute(bankedRouteStart, 'quiet-camp', 'silent-ruins')
assert.equal(startedBankedRoute.activeProgress, 400, 'starting a route applies the banked steps once')
assert.equal(startedBankedRoute.stepBank, 0, 'starting a route consumes the applied step bank')
assert.deepEqual(
  startMapRoute(startedBankedRoute, 'quiet-camp', 'silent-ruins'),
  startedBankedRoute,
  'starting the already active route is idempotent',
)

const defaultNotifications = normalizeNotificationSettings(undefined)
assert.equal(defaultNotifications.frequency, 'twice', 'default reminders use morning and evening notifications')
assert.equal(defaultNotifications.morning.hour, 8, 'default morning reminder is 08:00')
assert.equal(defaultNotifications.evening.hour, 21, 'default evening reminder is 21:00')
const migratedNotifications = normalizeNotificationSettings({
  frequency: 'once',
  morning: { enabled: false, hour: 32, minute: 0 },
  evening: { enabled: true, hour: 20, minute: 45 },
})
assert.equal(migratedNotifications.morning.enabled, false, 'one-reminder mode disables the morning reminder by default')
assert.equal(migratedNotifications.morning.hour, 8, 'invalid reminder hours fall back to defaults')
assert.equal(migratedNotifications.evening.minute, 45, 'valid custom reminder minutes are preserved')
const contradictoryNotifications = normalizeNotificationSettings({
  frequency: 'once',
  morning: { enabled: true, hour: 7, minute: 15 },
  evening: { enabled: false, hour: 22, minute: 30 },
})
assert.equal(contradictoryNotifications.morning.enabled, false, 'one-reminder mode always suppresses morning even if old saves enabled it')
assert.equal(contradictoryNotifications.evening.enabled, true, 'one-reminder mode keeps exactly one active evening reminder')
assert.equal(contradictoryNotifications.evening.hour, 22, 'one-reminder mode still preserves the custom evening hour')

const prologueRoutes = enumerateRoutes('silent-ruins')
assert.ok(prologueRoutes.every((route) => route.ids.length === 7), 'prologue visits seven nodes')
assert.ok(prologueRoutes.every((route) => route.cost >= 8700 && route.cost <= 9600), 'prologue fits one or two active days')
for (const mandatoryId of ['ash-guard', 'silent-shrine', 'spire-overlook']) {
  assert.ok(prologueRoutes.every((route) => route.ids.includes(mandatoryId)), `prologue requires ${mandatoryId}`)
}

const pendingShellSave = createEmptySave()
pendingShellSave.map = {
  ...pendingShellSave.map,
  currentNodeId: 'quiet-camp',
  completedNodeIds: [...pendingShellSave.map.completedNodeIds, 'quiet-camp'],
}
assert.equal(getPendingPrologueSceneNodeId(pendingShellSave), 'quiet-camp', 'prologue shell restores an unresolved scene from the existing save')
const quietCampEvent = getPointEventDefinition('silent-ruins', 'quiet-camp')
assert.ok(quietCampEvent?.choices?.[0], 'quiet camp exposes a deterministic event choice for the shell resume test')
const quietCampResult = resolvePointEventChoice(quietCampEvent, quietCampEvent.choices[0].id)
const resolvedShellSave = {
  ...pendingShellSave,
  minigames: {
    ...pendingShellSave.minigames,
    pointEvents: {
      ...pendingShellSave.minigames.pointEvents,
      [getPointEventSaveKey('silent-ruins', 'quiet-camp')]: quietCampResult,
    },
  },
}
assert.equal(getPendingPrologueSceneNodeId(resolvedShellSave), null, 'prologue shell uses existing completion fields without adding save state')

const quietRoadRoutes = enumerateRoutes('quiet-road')
assert.ok(quietRoadRoutes.every((route) => route.ids.length === 8), 'quiet road visits eight nodes')
assert.ok(quietRoadRoutes.every((route) => route.cost >= 20000 && route.cost <= 21200), 'quiet road targets three active days')
assert.ok(quietRoadRoutes.every((route) => route.ids.includes('echoing-mile')), 'quiet road requires its memory')
assert.ok(quietRoadRoutes.every((route) => route.ids.includes('hushed-causeway')), 'quiet road requires its memory-reactive route event')
assert.equal(getMapNode('hushed-causeway', 'quiet-road')?.encounterId, 'trial-hushed-causeway', 'quiet road event reacts to memory interpretation')

const causewayProgress = { ...createInitialMapProgress('quiet-road'), currentNodeId: 'hushed-causeway', completedNodeIds: ['road-shelter', 'echoing-mile', 'hushed-causeway'] }
const guardedCausewayStory = resolveStoryEncounter(createInitialStoryProgress(), 'trial-hushed-causeway', 'guard').progress
const movingCausewayStory = resolveStoryEncounter(createInitialStoryProgress(), 'trial-hushed-causeway', 'move').progress
const chosenCausewayStory = resolveStoryEncounter(createInitialStoryProgress(), 'trial-hushed-causeway', 'choose').progress
assert.deepEqual(getAvailableTargetIds(causewayProgress, 'quiet-road', guardedCausewayStory), ['last-cairn'], 'guarding the causeway opens the cairn route')
assert.deepEqual(getAvailableTargetIds(causewayProgress, 'quiet-road', movingCausewayStory), ['road-warden'], 'moving through the causeway opens the warden route')
assert.deepEqual(getAvailableTargetIds(causewayProgress, 'quiet-road', chosenCausewayStory), ['last-cairn', 'road-warden'], 'choosing a new path keeps both causeway routes open')
assert.equal(startMapRoute(causewayProgress, 'road-warden', 'quiet-road', guardedCausewayStory).activeTargetId, null, 'locked causeway route cannot be started')
assert.equal(startMapRoute(causewayProgress, 'last-cairn', 'quiet-road', guardedCausewayStory).activeTargetId, 'last-cairn', 'unlocked causeway route can be started')
const quietRoadMap = LOCATION_MAPS['quiet-road']
const blockedWarden = getMapNode('road-warden', 'quiet-road')
assert.ok(blockedWarden)
assert.equal(getLocalNodeVisualState(blockedWarden, causewayProgress, quietRoadMap, ['last-cairn'], 'road-warden'), 'hinted', 'story-gated neighboring route is inspectable as a hint')
assert.equal(getLocalRouteVisualState('hushed-causeway', 'road-warden', causewayProgress, quietRoadMap, ['last-cairn'], 'road-warden'), 'gated', 'story-gated route line gets a gated presentation state')

const mossGateRoutes = enumerateRoutes('moss-gate')
assert.ok(mossGateRoutes.every((route) => route.ids.length === 9), 'moss gate visits nine nodes')
assert.ok(mossGateRoutes.every((route) => route.cost >= 22500 && route.cost <= 22900), 'moss gate targets three active days')
assert.ok(mossGateRoutes.every((route) => route.ids.includes('moss-sentinel')), 'moss sentinel cannot be bypassed')
assert.ok(mossGateRoutes.every((route) => route.ids.includes('sealed-stair')), 'moss gate requires the post-sentinel ability echo')
assert.equal(getMapNode('sealed-stair', 'moss-gate')?.encounterId, 'trial-sealed-stair', 'sealed stair reuses the unlocked ability')

for (const [locationId, finalNodeId, minCost, maxCost] of [
  ['drowned-ford', 'grey-bank-call', 13000, 13300],
  ['hollow-grove', 'heartland-sign', 13400, 13700],
  ['watcher-hill', 'ashward-descent', 13900, 14200],
  ['heart-observatory', 'pass-signal-flame', 15000, 15000],
] as const) {
  const routes = enumerateRoutes(locationId)
  assert.equal(isLocationPlayable(locationId), true, `${locationId}: connector location is playable`)
  assert.ok(routes.every((route) => route.ids.length === 6), `${locationId}: connector map keeps the two-day bridge shape`)
  assert.ok(routes.every((route) => route.ids.at(-1) === finalNodeId), `${locationId}: reaches its connector finale`)
  assert.ok(routes.every((route) => route.cost >= minCost && route.cost <= maxCost), `${locationId}: connector route cost is tuned`)
}

assert.deepEqual(
  getWorldNeighbors('quiet-road').filter(isLocationPlayable).sort(),
  ['drowned-ford', 'hollow-grove', 'silent-ruins'].sort(),
  'quiet road exposes playable connector choices after completion',
)
assert.deepEqual(
  getWorldNeighbors('moss-gate').filter(isLocationPlayable).sort(),
  ['hollow-grove', 'silent-ruins', 'watcher-hill'].sort(),
  'moss gate exposes playable connector choices after completion',
)
assert.ok(getWorldNeighbors('heart-observatory').filter(isLocationPlayable).includes('lower-pass'), 'heart observatory can hand off to lower pass')
assert.deepEqual(
  getWorldNeighbors('grey-ferry').filter(isLocationPlayable).sort(),
  ['drowned-ford', 'reed-sanctuary', 'sunken-village'].sort(),
  'grey ferry exposes its playable Grey Valley follow-up branches',
)
const initialWorldProgress = { currentLocationId: 'silent-ruins', completedLocationIds: [], completedRegionIds: [], locationProgress: {} }
const oldCrossroads = getWorldLocation('old-crossroads')
const fogMarket = getWorldLocation('fog-market')
assert.ok(oldCrossroads && fogMarket)
assert.equal(getWorldLocationVisualRole(oldCrossroads), 'region-entry', 'regional entries have their own world-map role')
assert.equal(getWorldLocationVisualState(oldCrossroads, initialWorldProgress, []), 'locked-known', 'playable distant locations are locked known places')
assert.equal(getWorldLocationVisualState(fogMarket, initialWorldProgress, []), 'future', 'unplayable map nodes are future horizons')

for (const [locationId, finalNodeId, minCost, maxCost] of [
  ['grey-ferry', 'far-bank-lantern', 13600, 14000],
  ['old-crossroads', 'heartland-mile', 13900, 14000],
  ['ember-border', 'wasteward-horizon', 14300, 14600],
  ['lower-pass', 'crownward-ascent', 14700, 14800],
] as const) {
  const routes = enumerateRoutes(locationId)
  assert.equal(isLocationPlayable(locationId), true, `${locationId}: next-region entry is playable`)
  assert.ok(routes.every((route) => route.ids.length === 6), `${locationId}: entry location is a shorter first-pass map`)
  assert.ok(routes.every((route) => route.ids.at(-1) === finalNodeId), `${locationId}: reaches its regional entry finale`)
  assert.ok(routes.every((route) => route.cost >= minCost && route.cost <= maxCost), `${locationId}: entry location targets about two active days`)
}

for (const [locationId, finalNodeId, minCost, maxCost] of [
  ['reed-sanctuary', 'fog-market-lanterns', 17300, 17600],
  ['sunken-village', 'market-fog-bell', 17300, 17500],
] as const) {
  const routes = enumerateRoutes(locationId)
  assert.equal(isLocationPlayable(locationId), true, `${locationId}: regional follow-up is playable`)
  assert.ok(routes.every((route) => route.ids.length === 7), `${locationId}: follow-up location expands beyond the entry map`)
  assert.ok(routes.every((route) => route.ids.at(-1) === finalNodeId), `${locationId}: reaches its regional follow-up finale`)
  assert.ok(routes.every((route) => route.cost >= minCost && route.cost <= maxCost), `${locationId}: follow-up route cost is tuned`)
}

let story = createInitialStoryProgress()
const firstTrial = resolveStoryEncounter(story, 'trial-ash-guard', 'mirror')
assert.equal(firstTrial.coins, 15, 'first trial grants its selected reward')
assert.equal(firstTrial.xp, 15, 'first trial grants its selected XP')
story = firstTrial.progress
for (const [encounterId, choiceId] of [
  ['memory-falling-world', 'witness'],
  ['memory-word-home', 'build'],
  ['memory-two-hands', 'separate'],
] as const) {
  const resolved = resolveStoryEncounter(story, encounterId, choiceId)
  story = resolved.progress
  assert.ok(resolved.xp > 0, `${encounterId}: grants XP`)
}

assert.ok(story.abilities.includes('silent-break'), 'third memory unlocks an ability')
const trial = resolveStoryEncounter(story, 'trial-moss-sentinel', 'disrupt')
assert.equal(trial.abilityBonus, true, 'matching ability strengthens the trial choice')
assert.equal(trial.coins, 40, 'trial includes the ability coin bonus')
assert.equal(trial.xp, 65, 'trial includes the ability XP bonus')

for (const [memoryChoiceId, abilityId, stairChoiceId] of [
  ['hold', 'guard-stance', 'anchor'],
  ['pass', 'ash-lunge', 'drive'],
  ['separate', 'silent-break', 'unmake'],
] as const) {
  const abilityStory = resolveStoryEncounter(createInitialStoryProgress(), 'memory-two-hands', memoryChoiceId).progress
  assert.ok(abilityStory.abilities.includes(abilityId), `${abilityId}: third memory unlocks the expected ability`)
  const stairTrial = resolveStoryEncounter(abilityStory, 'trial-sealed-stair', stairChoiceId)
  assert.equal(stairTrial.abilityBonus, true, `${abilityId}: matching ability strengthens the sealed stair`)
  assert.equal(stairTrial.coins, 35, `${abilityId}: sealed stair includes the ability coin bonus`)
  assert.equal(stairTrial.xp, 60, `${abilityId}: sealed stair includes the ability XP bonus`)
}

const mismatchedAbilityStory = resolveStoryEncounter(createInitialStoryProgress(), 'memory-two-hands', 'hold').progress
const mismatchedStairTrial = resolveStoryEncounter(mismatchedAbilityStory, 'trial-sealed-stair', 'drive')
assert.equal(mismatchedStairTrial.abilityBonus, false, 'mismatched ability choice does not strengthen the sealed stair')
assert.equal(mismatchedStairTrial.coins, 20, 'mismatched sealed stair keeps its base coins')
assert.equal(mismatchedStairTrial.xp, 40, 'mismatched sealed stair keeps its base XP')

const guardianRouteStory = [
  ['memory-falling-world', 'hold'],
  ['memory-word-home', 'protect'],
].reduce((progress, [encounterId, choiceId]) => resolveStoryEncounter(progress, encounterId, choiceId).progress, createInitialStoryProgress())
const memoryRouteTrial = resolveStoryEncounter(guardianRouteStory, 'trial-hushed-causeway', 'guard')
assert.equal(memoryRouteTrial.identityBonus, true, 'matching memory interpretation strengthens a later route event')
assert.equal(memoryRouteTrial.coins, 30, 'memory route event includes the interpretation coin bonus')
assert.equal(memoryRouteTrial.xp, 50, 'memory route event includes the interpretation XP bonus')
const mismatchedRouteTrial = resolveStoryEncounter(guardianRouteStory, 'trial-hushed-causeway', 'move')
assert.equal(mismatchedRouteTrial.identityBonus, false, 'mismatched route event choice does not get the interpretation bonus')
assert.equal(mismatchedRouteTrial.coins, 20, 'mismatched route event keeps its base coins')
assert.equal(mismatchedRouteTrial.xp, 35, 'mismatched route event keeps its base XP')

const cache = getMapNode('forgotten-cache', 'silent-ruins')
assert.ok(cache)
assert.equal(getLocalNodeVisualRole(cache, LOCATION_MAPS['silent-ruins']), 'cache', 'cache presentation role is derived outside the UI')
assert.equal(getLocalNodeVisualRole(getMapNode('ash-guard', 'silent-ruins')!, LOCATION_MAPS['silent-ruins']), 'trial', 'story battle is presented as a trial')
assert.equal(getLocalNodeVisualRole(getMapNode('spire-overlook', 'silent-ruins')!, LOCATION_MAPS['silent-ruins']), 'finale', 'final node gets a finale presentation role')
const improvedReward = calculateCampNodeReward(cache, { fire: 2, storage: 3, altar: 0 })
assert.equal(improvedReward.coins, 52, 'storage level 3 adds 30% coins')
assert.equal(improvedReward.xp, 22, 'fire level 2 adds 10% XP')

const reedLock = getLockpickingConfig('reed-coin-braid')
assert.ok(reedLock, 'reed coin braid has the first lockpicking cache')
assert.ok(getLockpickingConfig('drowned-wheel-cache'), 'connector cache also has lockpicking now')
assert.ok(getLockpickingConfig('frozen-seal-cache'), 'later-region cache also has lockpicking now')
assert.equal(reedLock.pinCount, 3, 'first lockpicking MVP uses three pins')
assert.equal(rateLockpickingPin(reedLock.successCenter, reedLock), 'perfect', 'centered pin is perfect')
assert.equal(rateLockpickingPin(reedLock.successCenter + reedLock.successWidth / 2, reedLock), 'good', 'edge of success line is a good catch')
assert.equal(rateLockpickingPin(reedLock.successCenter + reedLock.successWidth, reedLock), 'miss', 'outside success line is a miss')
assert.equal(resolveLockpicking('reed-coin-braid', ['miss', 'good', 'perfect']).tier, 'good', 'two caught pins grant the good cache bonus')
const perfectLock = resolveLockpicking('reed-coin-braid', ['perfect', 'good', 'perfect'])
assert.equal(perfectLock.tier, 'perfect', 'three caught pins with two perfect catches grant the best bonus')
assert.equal(perfectLock.coins, 30, 'perfect lockpicking grants the stronger coin bonus')
const earlyLock = getLockpickingConfig('forgotten-cache')
assert.ok(earlyLock, 'forgotten cache introduces lockpicking in the first location')
assert.equal(getMapNode('forgotten-cache', 'silent-ruins')?.kind, 'event', 'forgotten cache stays an event node')
assert.equal(earlyLock.pinCount, 3, 'first-location lockpicking keeps the 3-pin MVP')
assert.ok(earlyLock.speed < reedLock.speed, 'starter lockpicking is slower than the second exposure')
assert.ok(earlyLock.successWidth > reedLock.successWidth, 'starter lockpicking uses a wider success line')
assert.equal(resolveLockpicking('forgotten-cache', ['perfect', 'good', 'perfect']).coins, 18, 'early perfect lockpicking grants a smaller starter bonus')

const fogBattle = getConnectBattleConfig('fog-choir-pool')
assert.ok(fogBattle, 'fog choir pool has the first connect-3 battle')
assert.equal(getMapNode('fog-choir-pool', 'reed-sanctuary')?.kind, 'battle', 'fog choir pool is marked as a battle node')
assert.equal(fogBattle.boardSize, 5, 'first connect-3 MVP uses a 5x5 board')
assert.equal(fogBattle.symbols.length, 4, 'first connect-3 MVP uses four symbols')
assert.equal(fogBattle.turns, 6, 'first connect-3 MVP uses six turns')
assert.equal(fogBattle.intent.type, 'ritual', 'fog choir battle presents an enemy scene objective')
assert.equal(fogBattle.intent.focusSymbol, 'break', 'fog choir highlights the relevant symbol role without changing scoring')
assert.ok(fogBattle.resultCopy.good.text.includes('награде точки'), 'battle result copy is scene-specific and still preserves base rewards')
assert.equal(createConnectBattleBoard(fogBattle).length, 25, 'battle board fills all 25 cells')
assert.equal(areConnectBattleTilesAdjacent(0, 1, fogBattle.boardSize), true, 'horizontal battle tiles are adjacent')
assert.equal(areConnectBattleTilesAdjacent(0, 6, fogBattle.boardSize), true, 'diagonal battle tiles are adjacent')
assert.equal(areConnectBattleTilesAdjacent(0, 12, fogBattle.boardSize), false, 'distant battle tiles are not adjacent')
const steadyBattle = resolveConnectBattle('fog-choir-pool', [
  { symbol: 'attack', length: 3 },
  { symbol: 'guard', length: 3 },
  { symbol: 'flame', length: 3 },
  { symbol: 'break', length: 3 },
  { symbol: 'attack', length: 3 },
  { symbol: 'guard', length: 3 },
])
assert.equal(steadyBattle.tier, 'good', 'six basic chains grant the good battle bonus')
const empoweredBattle = resolveConnectBattle('fog-choir-pool', [
  { symbol: 'attack', length: 5 },
  { symbol: 'attack', length: 5 },
  { symbol: 'break', length: 4 },
  { symbol: 'guard', length: 4 },
  { symbol: 'flame', length: 4 },
], ['ash-lunge', 'silent-break'])
assert.equal(empoweredBattle.tier, 'perfect', 'long chains and matching abilities can grant the best battle bonus')
assert.equal(empoweredBattle.coins, 35, 'perfect connect-3 battle grants the stronger coin bonus')
const earlyBattle = getConnectBattleConfig('ash-guard')
assert.ok(earlyBattle, 'ash guard introduces connect-3 combat in the first location')
assert.equal(getMapNode('ash-guard', 'silent-ruins')?.kind, 'battle', 'ash guard stays a battle node')
assert.equal(getMapNode('ash-guard', 'silent-ruins')?.encounterId, 'trial-ash-guard', 'ash guard keeps its story trial before the battle minigame')
assert.ok(getConnectBattleConfig('road-warden'), 'quiet road battle has a battle minigame')
assert.ok(getConnectBattleConfig('moss-sentinel'), 'moss sentinel has a battle minigame after its story trial')
assert.equal(earlyBattle.boardSize, 5, 'first-location battle uses the same 5x5 MVP board')
assert.equal(earlyBattle.intent.focusSymbol, 'guard', 'starter strike intent highlights guard as the presentation focus')
assert.ok(earlyBattle.goodTarget < fogBattle.goodTarget, 'starter battle has a lower good threshold than the second exposure')
assert.ok(earlyBattle.perfectTarget < fogBattle.perfectTarget, 'starter battle has a lower perfect threshold than the second exposure')
assert.equal(resolveConnectBattle('ash-guard', [
  { symbol: 'attack', length: 3 },
  { symbol: 'guard', length: 3 },
  { symbol: 'flame', length: 3 },
  { symbol: 'break', length: 3 },
  { symbol: 'attack', length: 3 },
]).tier, 'good', 'five basic starter chains grant the ash guard good bonus')

const quickPoint = getPointEventDefinition('silent-ruins', 'forgotten-cache')
assert.ok(quickPoint, 'cache point has a compact point event before lockpicking')
assert.equal(quickPoint.category, 'cache', 'cache point event uses cache art/category')
const choicePoint = getPointEventDefinition('silent-ruins', 'quiet-camp')
assert.ok(choicePoint?.choices?.length, 'camp point can present a compact choice')
assert.ok(choicePoint)
const campChoice = resolvePointEventChoice(choicePoint, 'search-ashes')
assert.equal(campChoice.coins, 8, 'choice event can add a small coin bonus')
assert.equal(campChoice.xp, 0, 'choice event bonuses are authored per option')
const crossingPoint = getPointEventDefinition('silent-ruins', 'sunken-road')
assert.equal(crossingPoint?.type, 'crossing', 'sunken road introduces careful crossing')
assert.ok(crossingPoint)
const crossingConfig = crossingPoint?.crossing
assert.ok(crossingConfig)
assert.equal(rateCarefulCrossingTap(crossingConfig.safeCenter, crossingConfig), 'perfect', 'crossing center is perfect')
assert.equal(
  rateCarefulCrossingTap(crossingConfig.safeCenter + crossingConfig.safeWidth / 2, crossingConfig),
  'good',
  'crossing safe-zone edge is good',
)
assert.equal(rateCarefulCrossingTap(0, crossingConfig), 'weak', 'outside crossing safe zone is weak')
assert.ok(getCarefulCrossingMarkerPosition(250, crossingConfig) >= 8, 'crossing marker stays in the track bounds')
assert.equal(resolveCarefulCrossing(crossingPoint, ['perfect', 'good', 'perfect']).tier, 'perfect', 'careful crossing rewards clean timing')
assert.equal(resolveCarefulCrossing(crossingPoint, ['weak', 'good', 'weak']).tier, 'weak', 'rough crossing keeps progress but removes bonus')
const searchPoint = getPointEventDefinition('quiet-road', 'lantern-stone')
assert.equal(searchPoint?.type, 'search', 'lantern stone introduces area search')
assert.ok(searchPoint)
assert.ok(searchPoint.search)
assert.equal(
  resolveAreaSearch(searchPoint, ['green-ember', 'copper-hook', 'dry-rune']).tier,
  'perfect',
  'area search grants the best result when all useful details are found',
)
assert.equal(
  resolveAreaSearch(searchPoint, ['green-ember', 'copper-hook', 'cold-leaf']).tier,
  'good',
  'area search grants a good result for two useful details',
)
assert.equal(
  resolveAreaSearch(searchPoint, ['green-ember', 'green-ember', 'cold-leaf']).tier,
  'weak',
  'area search ignores repeated taps and keeps weak results soft',
)

assert.equal(getLevel(0), 1, 'zero XP starts at level one')
assert.equal(getLevel(getLevelXpTarget(1)), 2, 'first level threshold advances to level two')
assert.ok(getLevelXpTarget(3) > getLevelXpTarget(2), 'later levels require more XP')
assert.equal(getLevelProgress(getLevelXpTarget(1)).current, 0, 'level progress resets after crossing a threshold')

let evolution = createInitialHeroEvolution()
assert.equal(evolution.stage, 'nothing', 'hero starts as Nothing')
assert.deepEqual(evolution.shards, { found: 0, free: 0, invested: 0 }, 'hero starts without collectible shards')
assert.equal(canAdvanceEvolution(evolution), false, 'Nothing cannot become Shadowborn without a free shard')
evolution = grantEvolutionShards(evolution, 1)
assert.deepEqual(evolution.shards, { found: 1, free: 1, invested: 0 }, 'found shard is also free before investment')
assert.equal(canAdvanceEvolution(evolution), true, 'one free shard unlocks Shadowborn')
evolution = advanceHeroEvolution(evolution)
assert.equal(evolution.stage, 'shadowborn', 'one shard advances the hero to Shadowborn')
assert.deepEqual(evolution.shards, { found: 1, free: 0, invested: 1 }, 'Shadowborn invests the first shard')
evolution = advanceHeroEvolution(grantEvolutionShards(evolution, 2))
assert.equal(evolution.stage, 'ghoul', 'two more shards after Shadowborn advance the hero to Ghoul')
assert.deepEqual(evolution.shards, { found: 3, free: 0, invested: 3 }, 'Ghoul invests two shards after Shadowborn')
assert.deepEqual(normalizeHeroEvolution(undefined).shards, { found: 0, free: 0, invested: 0 }, 'missing evolution save migrates cleanly')
assert.deepEqual(normalizeHeroEvolution({ stage: 'shadowborn', shards: { found: 2, invested: 4 } }).shards, { found: 2, free: 0, invested: 2 }, 'loaded shard ledger is clamped to a valid state')
const prologueShardSource = getEvolutionShardSourceForNode('silent-ruins', 'spire-overlook')
assert.ok(prologueShardSource, 'prologue finale is the first playable shard source')
const shardFromPrologue = grantEvolutionShardSource(createInitialHeroEvolution(), prologueShardSource)
assert.deepEqual(shardFromPrologue.shards, { found: 1, free: 1, invested: 0 }, 'prologue shard source grants one free shard')
assert.deepEqual(grantEvolutionShardSource(shardFromPrologue, prologueShardSource).shards, shardFromPrologue.shards, 'the same shard source cannot be claimed twice')
assert.ok(shardFromPrologue.claimedSourceIds.includes('prologue-spire-overlook'), 'claimed shard source is saved in evolution')

for (const [locationId, date, eventId] of [
  ['silent-ruins', '2026-06-22', 'silent-ruins-calm-ash-shelter'],
  ['silent-ruins', '2026-06-23', 'silent-ruins-find-buried-clasp'],
  ['silent-ruins', '2026-06-21', 'silent-ruins-threat-cold-step'],
  ['quiet-road', '2026-06-21', 'quiet-road-calm-distant-bells'],
  ['quiet-road', '2026-06-22', 'quiet-road-find-milestone-cache'],
  ['quiet-road', '2026-06-23', 'quiet-road-threat-unseen-cart'],
  ['moss-gate', '2026-06-23', 'moss-gate-calm-green-breath'],
  ['moss-gate', '2026-06-21', 'moss-gate-find-root-coins'],
  ['moss-gate', '2026-06-22', 'moss-gate-threat-root-snare'],
  ['drowned-ford', '2026-06-20', 'drowned-ford-calm-low-water'],
  ['drowned-ford', '2026-06-21', 'drowned-ford-find-river-clasp'],
  ['drowned-ford', '2026-06-22', 'drowned-ford-threat-understep'],
  ['hollow-grove', '2026-06-21', 'hollow-grove-calm-white-bark'],
  ['hollow-grove', '2026-06-22', 'hollow-grove-find-leaf-coins'],
  ['hollow-grove', '2026-06-20', 'hollow-grove-threat-empty-bell'],
  ['watcher-hill', '2026-06-21', 'watcher-hill-calm-high-grass'],
  ['watcher-hill', '2026-06-22', 'watcher-hill-find-charred-strap'],
  ['watcher-hill', '2026-06-20', 'watcher-hill-threat-red-wind'],
] as const) {
  const night = createNightEvent({
    date, locationId, daysAway: 1,
    camp: { fire: 1, storage: 0, altar: 0 }, story: createInitialStoryProgress(),
  })
  assert.equal(night.id, eventId, `${locationId}: location-specific night event ${eventId}`)
  assert.equal(night.locationId, locationId, `${locationId}: night event keeps the current location`)
  assert.equal(night.choices.length, 2, `${locationId}: location night event has two choices`)
}

for (const [locationId, date, eventId] of [
  ['grey-ferry', '2026-06-22', 'grey-valley-calm-fog-bank'],
  ['grey-ferry', '2026-06-20', 'grey-valley-find-river-token'],
  ['grey-ferry', '2026-06-21', 'grey-valley-threat-drowned-knock'],
  ['old-crossroads', '2026-06-20', 'old-heartland-calm-orchard-ash'],
  ['old-crossroads', '2026-06-21', 'old-heartland-find-pilgrim-pin'],
  ['old-crossroads', '2026-06-22', 'old-heartland-threat-empty-procession'],
  ['ember-border', '2026-06-20', 'ash-wastes-calm-red-hush'],
  ['ember-border', '2026-06-24', 'ash-wastes-find-glass-coin'],
  ['ember-border', '2026-06-22', 'ash-wastes-threat-coal-hunter'],
  ['lower-pass', '2026-06-21', 'broken-crown-calm-snow-veil'],
  ['lower-pass', '2026-06-25', 'broken-crown-find-frozen-seal'],
  ['lower-pass', '2026-06-20', 'broken-crown-threat-high-wind'],
] as const) {
  const night = createNightEvent({
    date, locationId, daysAway: 1,
    camp: { fire: 1, storage: 0, altar: 0 }, story: createInitialStoryProgress(),
  })
  assert.equal(night.id, eventId, `${locationId}: next-region pool event ${eventId}`)
  assert.equal(night.locationId, locationId, `${locationId}: next-region night keeps the current location`)
  assert.equal(night.choices.length, 2, `${locationId}: next-region night event has two choices`)
}

for (const [locationId, date, eventId] of [
  ['grey-ferry', '2026-06-23', 'grey-valley-chain-ferryman-lantern'],
  ['old-crossroads', '2026-06-23', 'old-heartland-chain-vow-stone'],
  ['ember-border', '2026-06-21', 'ash-wastes-chain-ember-name'],
  ['lower-pass', '2026-06-22', 'broken-crown-chain-cracked-horn'],
] as const) {
  const night = createNightEvent({
    date, locationId, daysAway: 1,
    camp: { fire: 1, storage: 0, altar: 0 }, story: createInitialStoryProgress(), history: [],
  })
  assert.equal(night.id, eventId, `${locationId}: regional chain can start with ${eventId}`)
}

const greyChainStart = createNightEvent({
  date: '2026-06-23', locationId: 'grey-ferry', daysAway: 1,
  camp: { fire: 1, storage: 0, altar: 0 }, story: createInitialStoryProgress(), history: [],
})
const resolvedGreyChainStart = resolveNightEvent({ ...createInitialNightProgress(), pending: greyChainStart }, 'raise-branch')
const greyChainFollowUp = createNightEvent({
  date: '2026-06-24', locationId: 'reed-sanctuary', daysAway: 1,
  camp: { fire: 1, storage: 0, altar: 0 }, story: createInitialStoryProgress(), history: resolvedGreyChainStart.progress.history,
})
assert.equal(greyChainFollowUp.id, 'grey-valley-chain-empty-ferry', 'regional night chain continues on the next night in the same region')
assert.equal(greyChainFollowUp.locationId, 'reed-sanctuary', 'regional chain uses the current location when it continues')
const resolvedGreyChain = resolveNightEvent({ ...resolvedGreyChainStart.progress, pending: greyChainFollowUp }, 'take-bundle')
const greyChainAfterDone = createNightEvent({
  date: '2026-06-27', locationId: 'grey-ferry', daysAway: 1,
  camp: { fire: 1, storage: 0, altar: 0 }, story: createInitialStoryProgress(), history: resolvedGreyChain.progress.history,
})
assert.equal(greyChainAfterDone.id, 'grey-valley-threat-drowned-knock', 'completed regional chain does not immediately restart on another trigger day')

const longAbsenceRegionalNight = createNightEvent({
  date: '2026-06-23', locationId: 'grey-ferry', daysAway: 3,
  camp: { fire: 1, storage: 0, altar: 0 }, story: createInitialStoryProgress(), history: [],
})
assert.equal(longAbsenceRegionalNight.id, 'quiet-return', 'long absence summary takes priority over regional chain starts')

const locationFindNight = createNightEvent({
  date: '2026-06-22', locationId: 'quiet-road', daysAway: 1,
  camp: { fire: 1, storage: 0, altar: 0 }, story: createInitialStoryProgress(),
})
const resolvedLocationNight = resolveNightEvent({ ...createInitialNightProgress(), pending: locationFindNight }, 'take-cache')
assert.equal(resolvedLocationNight.coins, 14, 'location-specific find night grants its coin reward')
assert.equal(resolvedLocationNight.xp, 2, 'location-specific night applies the camp fire XP bonus')
assert.equal(resolvedLocationNight.progress.history[0].eventId, 'quiet-road-find-milestone-cache', 'location night result is saved in camp history')

const guardianStory = resolveStoryEncounter(createInitialStoryProgress(), 'memory-falling-world', 'hold').progress
const identityNight = createNightEvent({
  date: '2026-06-21', locationId: 'silent-ruins', daysAway: 1,
  camp: { fire: 1, storage: 0, altar: 0 }, story: guardianStory,
}, true)
assert.equal(identityNight.id, 'echo-guardian', 'night event reacts to the dominant memory interpretation')
const resolvedNight = resolveNightEvent({ ...createInitialNightProgress(), pending: identityNight }, 'offer')
assert.equal(resolvedNight.coins, 10, 'night choice grants its coin reward')
assert.equal(resolvedNight.progress.pending, undefined, 'resolved night is no longer pending')
assert.equal(resolvedNight.progress.history.length, 1, 'night result is saved in camp history')

const returnNight = createNightEvent({
  date: '2026-06-21', locationId: 'silent-ruins', daysAway: 3,
  camp: { fire: 0, storage: 0, altar: 0 }, story: createInitialStoryProgress(),
})
assert.equal(returnNight.id, 'quiet-return', 'long absence produces one safe summary')

console.log(`Validated ${Object.keys(LOCATION_MAPS).length} locations, story choices, night events, trial abilities, and camp economy.`)

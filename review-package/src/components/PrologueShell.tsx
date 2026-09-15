import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { calculateCampNodeReward } from '../game/camp'
import { getEvolutionShardSourceForNode } from '../game/evolution'
import { getAvailableTargetIds, getMapNode, type MapNode, type MapProgress } from '../game/map'
import {
  areConnectBattleTilesAdjacent,
  createConnectBattleBoard,
  getConnectBattleConfig,
  getLockpickingConfig,
  getLockpickingPinPosition,
  rateLockpickingPin,
  refillConnectBattleBoard,
  scoreConnectBattleChains,
  type ConnectBattleChain,
  type ConnectBattleResult,
  type ConnectBattleSymbol,
  type LockpickingPinRating,
  type LockpickingResult,
} from '../game/minigames'
import {
  getCarefulCrossingMarkerPosition,
  getPointEventDefinition,
  getPointEventSaveKey,
  rateCarefulCrossingTap,
  resolveCarefulCrossing,
  resolvePointEventChoice,
  type PointEventResult,
  type PointEventRewardTier,
} from '../game/pointEvents'
import type { GameSave } from '../game/progression'
import { getStoryEncounter, type StoryProgress } from '../game/story'
import { playLockpickFeedback } from '../services/feedback'
import './PrologueShell.css'

const PROLOGUE_ID = 'silent-ruins'
const fmt = (value: number) => value.toLocaleString('ru-RU')

type DestinationMotif = 'campfire' | 'grove' | 'road' | 'arch' | 'cache' | 'guard' | 'shrine' | 'spire'

const getDestinationMotif = (node: MapNode): DestinationMotif => {
  switch (node.id) {
    case 'quiet-camp': return 'campfire'
    case 'whispering-grove': return 'grove'
    case 'sunken-road': return 'road'
    case 'broken-arch': return 'arch'
    case 'forgotten-cache': return 'cache'
    case 'ash-guard': return 'guard'
    case 'silent-shrine': return 'shrine'
    case 'spire-overlook': return 'spire'
    default: return 'road'
  }
}

function DestinationFigure({ node }: { node: MapNode }) {
  const motif = getDestinationMotif(node)

  return (
    <span aria-hidden className={`routeDestinationFigure motif-${motif}`}>
      <svg viewBox="0 0 64 64">
        {motif === 'campfire' ? (
          <>
            <path d="M19 51 45 57M45 51 19 57" />
            <path d="M32 49c-9 0-14-5-13-13 1-6 5-9 10-15 0 6 4 7 5 11 2-3 4-6 4-10 6 6 9 12 7 18-2 6-6 9-13 9Z" />
            <path d="M32 45c-4 0-7-3-6-7 0-3 3-5 5-8 0 4 3 5 4 8 1-1 2-3 2-5 3 4 3 7 2 9-1 2-4 3-7 3Z" />
          </>
        ) : null}
        {motif === 'grove' ? (
          <>
            <path d="M32 53V30M25 54h14" />
            <path d="M32 10 20 29h7L17 41h30L37 29h7L32 10Z" />
            <path d="M17 47h30" />
          </>
        ) : null}
        {motif === 'road' ? (
          <>
            <path d="M12 51c13-7 10-15 20-21 8-5 13-9 20-18" />
            <path d="M24 54c9-8 7-14 16-20 7-5 10-9 15-17" />
            <path d="M10 45h14M40 24h14" />
          </>
        ) : null}
        {motif === 'arch' ? (
          <>
            <path d="M13 53h38M17 52V27c0-12 7-18 15-18s15 6 15 18v25" />
            <path d="M25 52V29c0-6 3-10 7-10s7 4 7 10v23M13 22h7M44 22h7" />
            <path d="m47 10-5 8M17 12l5 7" />
          </>
        ) : null}
        {motif === 'cache' ? (
          <>
            <path d="M11 27h42v26H11zM9 22h46v8H9zM17 22c0-7 5-11 15-11s15 4 15 11" />
            <path d="M28 27h8v12h-8zM32 39v6M15 47h34" />
          </>
        ) : null}
        {motif === 'guard' ? (
          <>
            <path d="M32 10 47 17v12c0 11-6 19-15 25-9-6-15-14-15-25V17l15-7Z" />
            <path d="m20 45 27-29M17 16l30 31M16 12l7 1-6 6-1-7ZM48 44l1 7-7-1 6-6Z" />
          </>
        ) : null}
        {motif === 'shrine' ? (
          <>
            <path d="M12 53h40M16 48h32M19 44V24h26v20M15 24l17-13 17 13H15Z" />
            <path d="M25 44V29M32 44V29M39 44V29" />
            <path d="M32 5v8" />
          </>
        ) : null}
        {motif === 'spire' ? (
          <>
            <path d="M13 54h38M20 54V33l7-9v30M27 54V18l6-12 5 12v36M38 54V28l6 7v19" />
            <path d="M32 21v8M17 54V43l3-5M47 54V40l-3-5" />
          </>
        ) : null}
      </svg>
    </span>
  )
}

type PrologueJourneyProps = {
  mapProgress: MapProgress
  story: StoryProgress
  steps: number
  pendingNodeId: string | null
  sceneSuspended: boolean
  showEvening: boolean
  onBeginRoute: (targetId: string) => void
  onOpenCamp: () => void
  onOpenHero: () => void
  onOpenLocalMap: () => void
  onOpenScene: (nodeId: string) => void
  onOpenWorld: () => void
  onStayOnPath: () => void
  onHeroPointerCancel: () => void
  onHeroPointerDown: () => void
  onHeroPointerUp: () => void
  onOpenDevPanel: () => void
}

export function PrologueJourney({
  mapProgress,
  story,
  steps,
  pendingNodeId,
  sceneSuspended,
  showEvening,
  onBeginRoute,
  onOpenCamp,
  onOpenHero,
  onOpenLocalMap,
  onOpenScene,
  onOpenWorld,
  onStayOnPath,
  onHeroPointerCancel,
  onHeroPointerDown,
  onHeroPointerUp,
  onOpenDevPanel,
}: PrologueJourneyProps) {
  const availableTargetIds = getAvailableTargetIds(mapProgress, PROLOGUE_ID, story)
  const [routeChooserOpen, setRouteChooserOpen] = useState(false)
  const [selectedTargetId, setSelectedTargetId] = useState(() => availableTargetIds[0] ?? '')
  const effectiveSelectedTargetId = availableTargetIds.includes(selectedTargetId) ? selectedTargetId : availableTargetIds[0] ?? ''
  const activeNode = mapProgress.activeTargetId ? getMapNode(mapProgress.activeTargetId, PROLOGUE_ID) : null
  const pendingNode = pendingNodeId ? getMapNode(pendingNodeId, PROLOGUE_ID) : null
  const selectedTarget = getMapNode(effectiveSelectedTargetId, PROLOGUE_ID)
  const routeRemaining = activeNode ? Math.max(0, activeNode.cost - mapProgress.activeProgress) : 0
  const isEvening = showEvening && !pendingNode
  const isComplete = mapProgress.locationCompleted && !pendingNode
  const state = pendingNode ? 'arrival' : isEvening ? 'evening' : activeNode ? 'travelling' : isComplete ? 'complete' : 'fork'

  const openRouteChooser = () => {
    setSelectedTargetId(availableTargetIds[0] ?? '')
    setRouteChooserOpen(true)
  }

  const confirmRoute = () => {
    if (!selectedTarget || !availableTargetIds.includes(selectedTarget.id)) return
    onBeginRoute(selectedTarget.id)
    setRouteChooserOpen(false)
  }

  return (
    <section className={`prologueJourney state-${state}`} aria-label="Путь через Руины у Немого шпиля">
      <img alt="" className="journeyWorld" src="/generated-assets/maps/region-01-distant-silent-spire.png" />
      <div className="journeyAtmosphere" aria-hidden />

      <header className="journeyMetric">
        <span>Сегодня {fmt(steps)}</span>
        {state === 'fork' ? (
          <>
            <small>В запасе</small>
            <strong>{fmt(mapProgress.stepBank)} <i>шагов</i></strong>
          </>
        ) : null}
        {state === 'travelling' && activeNode ? (
          <>
            <small>До цели: «{activeNode.title}»</small>
            <em>Осталось</em>
            <strong>{fmt(routeRemaining)} <i>шагов</i></strong>
            <p>Вложено {fmt(mapProgress.activeProgress)} из {fmt(activeNode.cost)}</p>
          </>
        ) : null}
        {state === 'arrival' ? <small>Точка достигнута</small> : null}
        {state === 'evening' ? (
          <>
            <small>Вечер</small>
            <p>{activeNode ? `До «${activeNode.title}» ${fmt(routeRemaining)} шагов` : 'Нечто отдыхает между дорогами'}</p>
          </>
        ) : null}
        {state === 'complete' ? <small>Пролог завершён</small> : null}
      </header>

      {state === 'arrival' && pendingNode && ['ash-guard', 'silent-shrine'].includes(pendingNode.id) ? (
        <img
          alt=""
          className={`journeyArrivalArt ${pendingNode.id}`}
          src={pendingNode.id === 'silent-shrine' ? '/generated-assets/memory-falling-world.webp' : '/generated-assets/moss-sentinel.webp'}
        />
      ) : null}

      {state === 'evening' ? <img alt="" className="journeyCampfire" src="/generated-assets/campfire.png" /> : null}

      <button
        aria-label="Нечто. Удерживайте для тестового меню"
        className={`journeyHero ${state === 'travelling' ? 'travelling' : ''}`}
        onContextMenu={(event) => event.preventDefault()}
        onDoubleClick={onOpenDevPanel}
        onPointerCancel={onHeroPointerCancel}
        onPointerDown={onHeroPointerDown}
        onPointerLeave={onHeroPointerCancel}
        onPointerUp={onHeroPointerUp}
        type="button"
      >
        <img alt="" src="/generated-assets/character.png" />
      </button>

      <div className="journeyStory">
        {state === 'fork' ? (
          <>
            <h1>Тропа расходится</h1>
            <p>Нечто ждёт твоего решения.</p>
            <button className="journeyPrimary" disabled={!availableTargetIds.length} onClick={openRouteChooser} type="button">Выбрать путь</button>
            <button className="journeyMapAction" onClick={onOpenLocalMap} type="button">
              <svg aria-hidden viewBox="0 0 24 24">
                <path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Z" />
                <path d="M9 3v15M15 6v15" />
              </svg>
              Карта пути
            </button>
          </>
        ) : null}
        {state === 'travelling' ? (
          <>
            <p>Следы ещё тёплые. Нечто не сворачивает.</p>
            <button className="journeySecondary" onClick={onOpenLocalMap} type="button">Посмотреть путь</button>
          </>
        ) : null}
        {state === 'arrival' && pendingNode ? (
          <>
            <h1>{pendingNode.title}</h1>
            <p>{pendingNode.description}</p>
            <span>В запасе {fmt(mapProgress.stepBank)} шагов</span>
            <button className="journeyPrimary" onClick={() => onOpenScene(pendingNode.id)} type="button">
              {sceneSuspended ? 'Продолжить событие' : 'Открыть событие'}
            </button>
          </>
        ) : null}
        {state === 'evening' ? (
          <>
            <h1>Костёр зовёт</h1>
            <p>Огонь будет ждать до рассвета.</p>
            <button className="journeyPrimary" onClick={onOpenCamp} type="button">Вернуться в лагерь</button>
            <button className="journeyTextAction" onClick={onStayOnPath} type="button">Остаться в пути</button>
          </>
        ) : null}
        {state === 'complete' ? (
          <>
            <h1>Дороги ответили</h1>
            <p>Немой шпиль остаётся позади. Мир открыл новые направления.</p>
            <button className="journeyPrimary" onClick={onOpenWorld} type="button">Открыть мир</button>
          </>
        ) : null}
      </div>

      <nav className="journeyNav" aria-label="Основная навигация">
        <button aria-current="page" type="button">Путь</button>
        <button onClick={onOpenWorld} type="button">Мир</button>
        <button onClick={onOpenCamp} type="button">Лагерь</button>
        <button onClick={onOpenHero} type="button">Герой</button>
      </nav>

      {routeChooserOpen ? (
        <section aria-labelledby="route-chooser-title" aria-modal="true" className="routeChooser" role="dialog">
          <header>
            <button onClick={() => setRouteChooserOpen(false)} type="button">Назад</button>
            <span>В запасе {fmt(mapProgress.stepBank)}</span>
          </header>
          <h2 id="route-chooser-title">Куда дальше?</h2>
          <div className="routeDestinations">
            {availableTargetIds.map((targetId, index) => {
              const target = getMapNode(targetId, PROLOGUE_ID)
              if (!target) return null
              const selected = target.id === effectiveSelectedTargetId
              return (
                <button
                  aria-pressed={selected}
                  className={selected ? 'selected' : ''}
                  key={target.id}
                  onClick={() => setSelectedTargetId(target.id)}
                  type="button"
                >
                  <span className={`routeDestinationArt route-${index + 1}`} aria-hidden />
                  <DestinationFigure node={target} />
                  <strong>{target.title}</strong>
                  <b>{fmt(target.cost)} шагов</b>
                  <small>{target.description}</small>
                </button>
              )
            })}
          </div>
          <footer>
            <span>Останется {fmt(Math.max(0, mapProgress.stepBank - (selectedTarget?.cost ?? 0)))} шагов</span>
            <button className="journeyPrimary" disabled={!selectedTarget} onClick={confirmRoute} type="button">Выбрать этот путь</button>
            <button className="journeyTextAction" onClick={onOpenLocalMap} type="button">Показать на карте</button>
          </footer>
        </section>
      ) : null}
    </section>
  )
}

type EncounterPhase = 'point' | 'story' | 'lockpicking' | 'battle' | 'resolution'

type PrologueEncounterProps = {
  camp: GameSave['camp']
  nodeId: string
  open: boolean
  save: GameSave
  onClose: () => void
  onContinue: () => void
  onResolveBattle: (nodeId: string, chains: ConnectBattleChain[]) => ConnectBattleResult
  onResolveLockpicking: (nodeId: string, ratings: LockpickingPinRating[]) => LockpickingResult
  onResolvePointEvent: (result: PointEventResult) => PointEventResult
  onResolveStory: (encounterId: string, choiceId: string) => void
}

const getInitialEncounterPhase = (save: GameSave, nodeId: string): EncounterPhase => {
  const pointEvent = getPointEventDefinition(PROLOGUE_ID, nodeId)
  const pointKey = getPointEventSaveKey(PROLOGUE_ID, nodeId)
  if (pointEvent && !save.minigames.pointEvents[pointKey]) return 'point'
  const node = getMapNode(nodeId, PROLOGUE_ID)
  if (node?.encounterId && !save.story.completedEncounterIds.includes(node.encounterId)) return 'story'
  if (getLockpickingConfig(nodeId) && !save.minigames.lockpicking[nodeId]) return 'lockpicking'
  if (getConnectBattleConfig(nodeId) && !save.minigames.battles[nodeId]) return 'battle'
  return 'resolution'
}

function CombatMark({ symbol }: { symbol: ConnectBattleSymbol }) {
  if (symbol === 'attack') {
    return <svg aria-hidden viewBox="0 0 24 24"><path d="m6 18 12-12M13 5l6 0 0 6M5 15l4 4M4 20l3-3" /></svg>
  }
  if (symbol === 'guard') {
    return <svg aria-hidden viewBox="0 0 24 24"><path d="M12 3 19 6v5c0 5-3 8-7 10-4-2-7-5-7-10V6l7-3Z" /></svg>
  }
  if (symbol === 'flame') {
    return <svg aria-hidden viewBox="0 0 24 24"><path d="M13 3c1 4-3 5-1 9 1-2 3-3 4-5 3 4 3 9 0 12-3 3-8 2-10-1-3-5 1-9 7-15Z" /></svg>
  }
  return <svg aria-hidden viewBox="0 0 24 24"><path d="m5 7 4-2 3 4 3-4 4 2-3 5 3 5-4 2-3-4-3 4-4-2 3-5-3-5Z" /></svg>
}

export function PrologueEncounter({
  camp,
  nodeId,
  open,
  save,
  onClose,
  onContinue,
  onResolveBattle,
  onResolveLockpicking,
  onResolvePointEvent,
  onResolveStory,
}: PrologueEncounterProps) {
  const node = getMapNode(nodeId, PROLOGUE_ID)
  const definition = getPointEventDefinition(PROLOGUE_ID, nodeId)
  const pointKey = getPointEventSaveKey(PROLOGUE_ID, nodeId)
  const encounter = node?.encounterId ? getStoryEncounter(node.encounterId) : undefined
  const lockConfig = getLockpickingConfig(nodeId)
  const battleConfig = getConnectBattleConfig(nodeId)
  const [phase, setPhase] = useState<EncounterPhase>(() => getInitialEncounterPhase(save, nodeId))
  const [pointResult, setPointResult] = useState<PointEventResult | null>(() => save.minigames.pointEvents[pointKey] ?? null)
  const [storyChoiceId, setStoryChoiceId] = useState<string | null>(() => encounter ? save.story.choices[encounter.id] ?? null : null)

  const [crossingRatings, setCrossingRatings] = useState<PointEventRewardTier[]>([])
  const [crossingPosition, setCrossingPosition] = useState(definition?.crossing?.safeCenter ?? 50)
  const crossingElapsedRef = useRef(0)

  const [activePin, setActivePin] = useState(0)
  const [lockRatings, setLockRatings] = useState<LockpickingPinRating[]>([])
  const [caughtPositions, setCaughtPositions] = useState<number[]>([])
  const [pinPosition, setPinPosition] = useState(lockConfig?.successCenter ?? 50)
  const [lastLockFeedback, setLastLockFeedback] = useState<LockpickingPinRating | null>(null)
  const [lockResult, setLockResult] = useState<LockpickingResult | null>(() => save.minigames.lockpicking[nodeId] ?? null)
  const lockElapsedRef = useRef(0)
  const lockFeedbackTimerRef = useRef<number | null>(null)

  const [board, setBoard] = useState<ConnectBattleSymbol[]>(() => battleConfig ? createConnectBattleBoard(battleConfig) : [])
  const [selectedTileIds, setSelectedTileIds] = useState<number[]>([])
  const selectedTileIdsRef = useRef<number[]>([])
  const [chains, setChains] = useState<ConnectBattleChain[]>(() => save.minigames.battles[nodeId]?.chains ?? [])
  const [turn, setTurn] = useState(() => save.minigames.battles[nodeId]?.chains.length ?? 0)
  const [isDragging, setIsDragging] = useState(false)
  const [battleResult, setBattleResult] = useState<ConnectBattleResult | null>(() => save.minigames.battles[nodeId] ?? null)

  useEffect(() => {
    const crossing = definition?.crossing
    if (!open || phase !== 'point' || !crossing || pointResult) return undefined
    const startedAt = performance.now() - crossingElapsedRef.current
    let frame = 0
    const tick = (now: number) => {
      crossingElapsedRef.current = now - startedAt
      setCrossingPosition(getCarefulCrossingMarkerPosition(crossingElapsedRef.current, crossing))
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [definition?.crossing, open, phase, pointResult])

  useEffect(() => {
    if (!open || phase !== 'lockpicking' || !lockConfig || lockResult) return undefined
    const startedAt = performance.now() - lockElapsedRef.current
    let frame = 0
    const tick = (now: number) => {
      lockElapsedRef.current = now - startedAt
      setPinPosition(getLockpickingPinPosition(lockElapsedRef.current, activePin, lockConfig.speed))
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [activePin, lockConfig, lockResult, open, phase])

  useEffect(() => () => {
    if (lockFeedbackTimerRef.current !== null) window.clearTimeout(lockFeedbackTimerRef.current)
  }, [])

  if (!node || !definition) return null

  const baseReward = calculateCampNodeReward(node, camp)
  const shardSource = getEvolutionShardSourceForNode(PROLOGUE_ID, nodeId)
  const selectedStoryChoice = encounter?.choices.find((choice) => choice.id === storyChoiceId)
  const savedPointResult = pointResult ?? save.minigames.pointEvents[pointKey]
  const resolvedLock = lockResult ?? save.minigames.lockpicking[nodeId]
  const resolvedBattle = battleResult ?? save.minigames.battles[nodeId]
  const bonusCoins = (savedPointResult?.coins ?? 0) + (selectedStoryChoice?.coins ?? 0) + (resolvedLock?.coins ?? 0) + (resolvedBattle?.coins ?? 0)
  const bonusXp = (savedPointResult?.xp ?? 0) + (selectedStoryChoice?.xp ?? 0) + (resolvedLock?.xp ?? 0) + (resolvedBattle?.xp ?? 0)

  const nextAfterPoint = () => {
    if (encounter && !save.story.completedEncounterIds.includes(encounter.id) && !storyChoiceId) setPhase('story')
    else if (lockConfig && !resolvedLock) setPhase('lockpicking')
    else if (battleConfig && !resolvedBattle) setPhase('battle')
    else setPhase('resolution')
  }

  const finishQuickPoint = () => {
    if (savedPointResult) {
      nextAfterPoint()
      return
    }
    const result: PointEventResult = {
      nodeId,
      type: 'quick',
      coins: 0,
      xp: 0,
      note: 'Место отмечено, базовая награда уже получена.',
    }
    setPointResult(onResolvePointEvent(result))
    nextAfterPoint()
  }

  const choosePointEvent = (choiceId: string) => {
    if (savedPointResult) return
    setPointResult(onResolvePointEvent(resolvePointEventChoice(definition, choiceId)))
    setPhase('resolution')
  }

  const catchCrossingStep = () => {
    const crossing = definition.crossing
    if (!crossing || savedPointResult) return
    const rating = rateCarefulCrossingTap(crossingPosition, crossing)
    const nextRatings = [...crossingRatings, rating]
    setCrossingRatings(nextRatings)
    if (nextRatings.length >= crossing.steps) {
      setPointResult(onResolvePointEvent(resolveCarefulCrossing(definition, nextRatings)))
      setPhase('resolution')
    }
  }

  const chooseStory = (choiceId: string) => {
    if (!encounter || storyChoiceId) return
    setStoryChoiceId(choiceId)
    onResolveStory(encounter.id, choiceId)
    setPhase(battleConfig ? 'battle' : 'resolution')
  }

  const catchPin = () => {
    if (!lockConfig || resolvedLock) return
    const rating = rateLockpickingPin(pinPosition, lockConfig)
    void playLockpickFeedback(rating)
    setLastLockFeedback(rating)
    if (lockFeedbackTimerRef.current !== null) window.clearTimeout(lockFeedbackTimerRef.current)
    lockFeedbackTimerRef.current = window.setTimeout(() => setLastLockFeedback(null), 520)
    const nextRatings = [...lockRatings, rating]
    setLockRatings(nextRatings)
    setCaughtPositions([...caughtPositions, pinPosition])
    if (nextRatings.length >= lockConfig.pinCount) {
      setLockResult(onResolveLockpicking(nodeId, nextRatings))
      setPhase('resolution')
      return
    }
    lockElapsedRef.current = 0
    setActivePin((pin) => pin + 1)
  }

  const updateSelectedTileIds = (nextSelection: number[] | ((current: number[]) => number[])) => {
    const next = typeof nextSelection === 'function' ? nextSelection(selectedTileIdsRef.current) : nextSelection
    selectedTileIdsRef.current = next
    setSelectedTileIds(next)
  }

  const selectTile = (tileId: number, canStartNew: boolean) => {
    if (!battleConfig || resolvedBattle) return
    const tileSymbol = board[tileId]
    updateSelectedTileIds((current) => {
      const existingIndex = current.indexOf(tileId)
      if (existingIndex >= 0) return current.slice(0, existingIndex + 1)
      if (!current.length) return [tileId]
      const firstSymbol = board[current[0]]
      const lastTileId = current[current.length - 1]
      const canExtend = tileSymbol === firstSymbol && areConnectBattleTilesAdjacent(lastTileId, tileId, battleConfig.boardSize)
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
    const tile = target?.closest<HTMLButtonElement>('[data-prologue-battle-tile]')
    const tileId = Number(tile?.dataset.prologueBattleTile)
    return Number.isInteger(tileId) ? tileId : null
  }

  const continueDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (!isDragging || resolvedBattle) return
    const tileId = getTileIdAtPoint(event.clientX, event.clientY)
    if (tileId !== null) selectTile(tileId, false)
  }

  const commitChain = (tileIds = selectedTileIdsRef.current) => {
    if (!battleConfig || resolvedBattle || tileIds.length < 3) return
    const chain: ConnectBattleChain = { symbol: board[tileIds[0]], length: tileIds.length }
    const nextChains = [...chains, chain]
    const nextTurn = turn + 1
    setChains(nextChains)
    setBoard(refillConnectBattleBoard(board, tileIds, battleConfig, nextTurn))
    updateSelectedTileIds([])
    setTurn(nextTurn)
    if (nextTurn >= battleConfig.turns) {
      setBattleResult(onResolveBattle(nodeId, nextChains))
      setPhase('resolution')
    }
  }

  const finishDrag = () => {
    setIsDragging(false)
    if (selectedTileIdsRef.current.length >= 3) commitChain(selectedTileIdsRef.current)
  }

  const endBattleEarly = () => {
    if (!chains.length || resolvedBattle) return
    setBattleResult(onResolveBattle(nodeId, chains))
    setPhase('resolution')
  }

  const symbolLabels: Record<ConnectBattleSymbol, string> = {
    attack: 'Удар',
    guard: 'Щит',
    flame: 'Пламя',
    break: 'Разрыв',
  }
  const currentScore = battleConfig ? scoreConnectBattleChains(chains, save.story.abilities).total : 0
  const resolutionTitle = resolvedBattle && battleConfig
    ? battleConfig.resultCopy[resolvedBattle.tier].title
    : resolvedLock
      ? resolvedLock.tier === 'perfect' ? 'Тихое открытие' : resolvedLock.tier === 'good' ? 'Штифты легли ровно' : 'Замок поддался'
      : nodeId === 'spire-overlook'
        ? 'Дороги ответили'
        : selectedStoryChoice?.title ?? 'Путь открыт'
  const resolutionBody = resolvedBattle && battleConfig
    ? battleConfig.resultCopy[resolvedBattle.tier].text
    : resolvedLock
      ? resolvedLock.tier === 'perfect'
        ? 'Замок почти сам вспомнил правильное положение. Внутри нашёлся лучший узелок.'
        : resolvedLock.tier === 'good'
          ? 'Застёжка раскрылась без шума и отдала небольшой дорожный запас.'
          : 'Тайник открыт, но часть запаса осталась недоступной.'
      : nodeId === 'spire-overlook'
        ? 'Немой шпиль остаётся ориентиром, но дальнейший путь теперь выбираешь ты.'
        : selectedStoryChoice?.result ?? savedPointResult?.note ?? 'Нечто отмечает это место и продолжает путь.'

  const sceneArt = encounter?.art
    ?? (battleConfig ? '/generated-assets/moss-sentinel.webp' : lockConfig ? '/generated-assets/chest.png' : definition.art)
  const title = phase === 'story' && encounter ? encounter.title : phase === 'lockpicking' && lockConfig ? lockConfig.title : phase === 'battle' && battleConfig ? battleConfig.title : node.title
  const eyebrow = phase === 'story' && encounter
    ? encounter.eyebrow
    : phase === 'lockpicking'
      ? 'Действие · тайник'
      : phase === 'battle' && battleConfig
        ? `Бой · ход ${Math.min(turn + 1, battleConfig.turns)} из ${battleConfig.turns}`
        : definition.eyebrow

  return (
    <section
      aria-hidden={!open}
      aria-labelledby="prologue-encounter-title"
      aria-modal="true"
      className={`prologueEncounter phase-${phase} ${open ? 'open' : 'suspended'} ${encounter?.type ?? definition.category}`}
      role="dialog"
    >
      <div className="encounterVisual">
        <img alt="" className="encounterSceneArt" src={sceneArt} />
        {encounter?.type !== 'memory' ? <img alt="" className="encounterHero" src="/generated-assets/character.png" /> : null}
        <div className="encounterVisualShade" aria-hidden />
      </div>

      {phase !== 'resolution' ? <button className="encounterClose" onClick={onClose} type="button">Закрыть</button> : null}

      <div className="encounterContent">
        {phase !== 'resolution' ? <span className="encounterEyebrow">{eyebrow}</span> : <span className="encounterEyebrow">Сцена завершена</span>}
        <h2 id="prologue-encounter-title">{phase === 'resolution' ? resolutionTitle : title}</h2>

        {phase === 'point' ? (
          <>
            <p>{definition.body}</p>
            <div className="encounterBaseReward">Получено: +{baseReward.xp} XP{baseReward.coins ? ` · +${baseReward.coins} монет` : ''}</div>
            {definition.type === 'choice' && definition.choices ? (
              <div className="encounterChoices" aria-label="Выбор события">
                {definition.choices.map((choice) => (
                  <button key={choice.id} onClick={() => choosePointEvent(choice.id)} type="button">
                    <strong>{choice.title}</strong>
                    <span>{choice.text}</span>
                  </button>
                ))}
              </div>
            ) : null}
            {definition.type === 'crossing' && definition.crossing ? (
              <div className="encounterCrossing">
                <div className="crossingTrack" aria-label="Осторожный переход">
                  <span className="crossingSafeZone" style={{ left: `${definition.crossing.safeCenter - definition.crossing.safeWidth / 2}%`, width: `${definition.crossing.safeWidth}%` }} />
                  <i className="crossingMarker" style={{ left: `${crossingPosition}%` }} />
                </div>
                <div className="crossingSteps" aria-label="Сделанные шаги">
                  {Array.from({ length: definition.crossing.steps }, (_, index) => <span className={crossingRatings[index] ?? ''} key={index}>{index + 1}</span>)}
                </div>
                <button className="encounterPrimary" onClick={catchCrossingStep} type="button">{definition.actionLabel}</button>
              </div>
            ) : null}
            {definition.type === 'quick' ? <button className="encounterPrimary" onClick={finishQuickPoint} type="button">{encounter ? 'Продолжить к событию' : lockConfig ? 'Открыть тайник' : battleConfig ? 'Начать бой' : 'Продолжить'}</button> : null}
          </>
        ) : null}

        {phase === 'story' && encounter ? (
          <>
            <p>{encounter.scene}</p>
            {encounter.type === 'memory' ? <div className="memoryContract">Прошлое не изменить. Выбери, как Нечто его поймёт.</div> : null}
            <div className="encounterChoices" aria-label={encounter.type === 'memory' ? 'Выбор трактовки' : 'Выбор действия'}>
              {encounter.choices.map((choice) => (
                <button key={choice.id} onClick={() => chooseStory(choice.id)} type="button">
                  <strong>{choice.title}</strong>
                  <span>{choice.text}</span>
                </button>
              ))}
            </div>
            {encounter.type === 'memory' ? <small className="encounterFootnote">Выбор сохранится в хронике</small> : null}
          </>
        ) : null}

        {phase === 'lockpicking' && lockConfig ? (
          <>
            <p>{lockConfig.scene}</p>
            <div className="lockpickStatus">Штифт {Math.min(activePin + 1, lockConfig.pinCount)} из {lockConfig.pinCount}</div>
            <button
              aria-label="Поймать активный штифт"
              className={`lockpickBoard prologueLockpick ${lastLockFeedback ? `feedback-${lastLockFeedback}` : ''}`}
              onClick={catchPin}
              type="button"
            >
              <span aria-hidden className="lockpickSuccess" style={{ height: `${lockConfig.successWidth}%`, top: `${lockConfig.successCenter}%` }} />
              {Array.from({ length: lockConfig.pinCount }).map((_, index) => {
                const rating = lockRatings[index]
                const markerPosition = index === activePin ? pinPosition : caughtPositions[index] ?? 88
                return (
                  <span className={`lockpickPin ${index === activePin ? 'active' : ''} ${rating ?? ''}`} key={index}>
                    <i style={{ top: `${markerPosition}%` }} />
                    <small>{rating === 'perfect' ? 'Точно' : rating === 'good' ? 'Есть' : rating === 'miss' ? 'Мимо' : index === activePin ? 'Лови' : `${index + 1}`}</small>
                  </span>
                )
              })}
            </button>
            <p className="encounterInstruction">Поймай метку в светлой прорези.</p>
            <small className="encounterFootnote">Базовая находка уже получена. Точность влияет только на бонус.</small>
            <button className="encounterPrimary" onClick={catchPin} type="button">Поймать</button>
          </>
        ) : null}

        {phase === 'battle' && battleConfig ? (
          <>
            <div className="encounterIntent">
              <CombatMark symbol={battleConfig.intent.focusSymbol} />
              <div>
                <strong>{battleConfig.intent.title}</strong>
                <span>{battleConfig.intent.focusLabel}</span>
              </div>
            </div>
            <div className="encounterBattleStatus">
              <span>Ходов: {Math.max(0, battleConfig.turns - turn)}</span>
              <span>Сила: {currentScore}/{battleConfig.goodTarget}</span>
            </div>
            <div
              className="battleBoard prologueBattleBoard"
              onPointerCancel={finishDrag}
              onPointerLeave={() => setIsDragging(false)}
              onPointerMove={continueDrag}
              onPointerUp={finishDrag}
              style={{ gridTemplateColumns: `repeat(${battleConfig.boardSize}, 1fr)` }}
            >
              {board.map((symbol, index) => {
                const selectedIndex = selectedTileIds.indexOf(index)
                const selected = selectedIndex >= 0
                const intentFocus = symbol === battleConfig.intent.focusSymbol
                return (
                  <button
                    aria-label={`${symbolLabels[symbol]}${selected ? `, в цепи ${selectedIndex + 1}` : ''}`}
                    className={`battleTile ${symbol} ${selected ? 'selected' : ''} ${intentFocus ? 'intentFocus' : ''}`}
                    data-prologue-battle-tile={index}
                    key={`${symbol}-${index}-${turn}`}
                    onKeyDown={(event) => {
                      if (event.key !== 'Enter' && event.key !== ' ') return
                      event.preventDefault()
                      selectTile(index, true)
                    }}
                    onPointerDown={(event) => beginTile(index, event)}
                    onPointerEnter={() => { if (isDragging) selectTile(index, false) }}
                    type="button"
                  >
                    <CombatMark symbol={symbol} />
                  </button>
                )
              })}
            </div>
            <p className="encounterInstruction">Соединяй 3+ одинаковых знака</p>
            <div className="encounterBattleActions">
              <button className="encounterPrimary" disabled={selectedTileIds.length < 3} onClick={() => commitChain()} type="button">Провести цепь</button>
              <button className="encounterTextAction" disabled={!chains.length} onClick={endBattleEarly} type="button">Завершить обмен</button>
            </div>
          </>
        ) : null}

        {phase === 'resolution' ? (
          <>
            <p>{resolutionBody}</p>
            <div className="encounterRewards" aria-label="Итоговые награды">
              <div><span>Базовая награда</span><strong>+{baseReward.xp} XP{baseReward.coins ? ` · +${baseReward.coins} монет` : ''}</strong></div>
              <div><span>Бонус сцены</span><strong>{bonusXp || bonusCoins ? `${bonusXp ? `+${bonusXp} XP` : ''}${bonusXp && bonusCoins ? ' · ' : ''}${bonusCoins ? `+${bonusCoins} монет` : ''}` : 'Без дополнительной награды'}</strong></div>
              {shardSource ? <div><span>Редкая находка</span><strong>+{shardSource.amount} осколок</strong></div> : null}
            </div>
            <button className="encounterPrimary" onClick={onContinue} type="button">Продолжить путь</button>
          </>
        ) : null}
      </div>
    </section>
  )
}

import type { StoryProgress } from './story'

export type MapNodeKind = 'start' | 'camp' | 'event' | 'battle' | 'memory' | 'landmark'

export type MapNode = {
  id: string
  title: string
  description: string
  kind: MapNodeKind
  icon: string
  cost: number
  coinReward: number
  xpReward: number
  x: number
  y: number
  encounterId?: string
  tutorial?: string
}

export type MapEdge = {
  from: string
  to: string
  requiredStoryChoice?: {
    encounterId: string
    choiceIds: string[]
  }
}

export type MapProgress = {
  currentNodeId: string
  completedNodeIds: string[]
  activeTargetId: string | null
  activeProgress: number
  stepBank: number
  creditedDate: string
  creditedSteps: number
  rewardedNodeIds: string[]
  locationCompleted: boolean
}

export type LocationMapDefinition = {
  id: string
  finalNodeId: string
  nodes: MapNode[]
  edges: MapEdge[]
  theme: 'ruins' | 'road' | 'moss' | 'grey' | 'heartland' | 'ash' | 'crown'
}

export const MAP_NODES: MapNode[] = [
  {
    id: 'awakened-stone',
    title: 'Камень пробуждения',
    description: 'Здесь Странник впервые открыл глаза.',
    kind: 'start',
    icon: '◆',
    cost: 0,
    coinReward: 0,
    xpReward: 0,
    x: 50,
    y: 84,
    tutorial: 'Выбери одну из подсвеченных точек. Шаги начнут двигать героя по выбранной дороге.',
  },
  {
    id: 'quiet-camp',
    title: 'Тихий лагерь',
    description: 'Огонь ещё хранит чужое тепло.',
    kind: 'camp',
    icon: '△',
    cost: 900,
    coinReward: 10,
    xpReward: 20,
    x: 27,
    y: 69,
  },
  {
    id: 'whispering-grove',
    title: 'Шепчущая роща',
    description: 'Между деревьями кто-то повторяет твои шаги.',
    kind: 'event',
    icon: '✦',
    cost: 1100,
    coinReward: 0,
    xpReward: 30,
    x: 70,
    y: 70,
  },
  {
    id: 'broken-arch',
    title: 'Разбитая арка',
    description: 'На камне остались знаки исчезнувшего ордена.',
    kind: 'memory',
    icon: '◇',
    cost: 1500,
    coinReward: 15,
    xpReward: 35,
    x: 25,
    y: 52,
  },
  {
    id: 'sunken-road',
    title: 'Затопленная дорога',
    description: 'Вода скрывает старую развилку и следы путников.',
    kind: 'event',
    icon: '≈',
    cost: 1300,
    coinReward: 0,
    xpReward: 30,
    x: 51,
    y: 54,
    tutorial: 'Если шагов не хватит, вложенный прогресс сохранится и продолжится позже.',
  },
  {
    id: 'forgotten-cache',
    title: 'Забытый тайник',
    description: 'Небольшой крюк в сторону разрушенной стены.',
    kind: 'event',
    icon: '□',
    cost: 800,
    coinReward: 40,
    xpReward: 20,
    x: 79,
    y: 54,
  },
  {
    id: 'ash-guard',
    title: 'Пепельный страж',
    description: 'Неподвижная фигура преграждает подъём.',
    kind: 'battle',
    icon: '×',
    cost: 1800,
    coinReward: 35,
    xpReward: 50,
    x: 34,
    y: 35,
    encounterId: 'trial-ash-guard',
    tutorial: 'Испытание предлагает несколько действий. Сейчас выбор определяет исход сцены и награду.',
  },
  {
    id: 'silent-shrine',
    title: 'Безмолвное святилище',
    description: 'Здесь можно услышать первое воспоминание.',
    kind: 'memory',
    icon: '◈',
    cost: 1700,
    coinReward: 0,
    xpReward: 60,
    x: 64,
    y: 36,
    encounterId: 'memory-falling-world',
    tutorial: 'Воспоминание нельзя изменить, но можно выбрать, как герой его понимает.',
  },
  {
    id: 'spire-overlook',
    title: 'Предел руин',
    description: 'С высоты герой впервые слышит несколько дорог, отвечающих на его резонанс.',
    kind: 'landmark',
    icon: '✧',
    cost: 2200,
    coinReward: 75,
    xpReward: 100,
    x: 50,
    y: 18,
    tutorial: 'Пролог завершён. Глобальная карта откроет несколько следующих направлений.',
  },
]

export const MAP_EDGES: MapEdge[] = [
  { from: 'awakened-stone', to: 'quiet-camp' },
  { from: 'awakened-stone', to: 'whispering-grove' },
  { from: 'quiet-camp', to: 'sunken-road' },
  { from: 'whispering-grove', to: 'sunken-road' },
  { from: 'sunken-road', to: 'broken-arch' },
  { from: 'sunken-road', to: 'forgotten-cache' },
  { from: 'broken-arch', to: 'ash-guard' },
  { from: 'forgotten-cache', to: 'ash-guard' },
  { from: 'ash-guard', to: 'silent-shrine' },
  { from: 'silent-shrine', to: 'spire-overlook' },
]

const QUIET_ROAD_NODES: MapNode[] = [
  { id: 'road-shelter', title: 'Край руин', description: 'Камни шпиля остаются позади.', kind: 'start', icon: '◆', cost: 0, coinReward: 0, xpReward: 0, x: 50, y: 84 },
  { id: 'lantern-stone', title: 'Камень фонаря', description: 'В выемке ещё тлеет зелёный огонь.', kind: 'event', icon: '✦', cost: 1800, coinReward: 10, xpReward: 20, x: 28, y: 73 },
  { id: 'wind-fork', title: 'Развилка ветров', description: 'Обе дороги пахнут дождём, но только одна хранит следы.', kind: 'event', icon: '≈', cost: 2200, coinReward: 0, xpReward: 30, x: 71, y: 73 },
  { id: 'abandoned-cart', title: 'Брошенная телега', description: 'Под прогнившим полотном спрятан дорожный запас.', kind: 'event', icon: '□', cost: 2400, coinReward: 35, xpReward: 25, x: 24, y: 61 },
  { id: 'black-tracks', title: 'Чёрные следы', description: 'Следы похожи одновременно на сапоги и когти.', kind: 'event', icon: '◇', cost: 2600, coinReward: 20, xpReward: 35, x: 76, y: 61 },
  { id: 'rain-marker', title: 'Дождевой знак', description: 'Обе тропы сходятся у камня, на котором дождь идёт снизу вверх.', kind: 'event', icon: '◇', cost: 2800, coinReward: 15, xpReward: 35, x: 50, y: 51 },
  { id: 'echoing-mile', title: 'Миля эха', description: 'Чужой голос произносит слово «дом» двумя разными интонациями.', kind: 'memory', icon: '◈', cost: 3200, coinReward: 0, xpReward: 55, x: 50, y: 41, encounterId: 'memory-word-home' },
  { id: 'hushed-causeway', title: 'Притихшая гать', description: 'Доски глушат шаги, будто дорога не хочет выдавать путника.', kind: 'event', icon: '≈', cost: 2800, coinReward: 20, xpReward: 40, x: 50, y: 32, encounterId: 'trial-hushed-causeway' },
  { id: 'last-cairn', title: 'Последний гурий', description: 'Кто-то оставил знак для путников, идущих к шпилю.', kind: 'event', icon: '△', cost: 3000, coinReward: 25, xpReward: 45, x: 32, y: 23 },
  { id: 'road-warden', title: 'Страж тракта', description: 'Пустые доспехи требуют назвать цель пути.', kind: 'battle', icon: '×', cost: 3600, coinReward: 45, xpReward: 65, x: 68, y: 23 },
  { id: 'silent-crossing', title: 'Беззвучный переход', description: 'За каменным мостом открывается путь к Мшистым вратам.', kind: 'landmark', icon: '✧', cost: 4000, coinReward: 90, xpReward: 120, x: 50, y: 12 },
]

const QUIET_ROAD_EDGES: MapEdge[] = [
  { from: 'road-shelter', to: 'lantern-stone' },
  { from: 'road-shelter', to: 'wind-fork' },
  { from: 'lantern-stone', to: 'abandoned-cart' },
  { from: 'wind-fork', to: 'black-tracks' },
  { from: 'abandoned-cart', to: 'rain-marker' },
  { from: 'black-tracks', to: 'rain-marker' },
  { from: 'rain-marker', to: 'echoing-mile' },
  { from: 'echoing-mile', to: 'hushed-causeway' },
  { from: 'hushed-causeway', to: 'last-cairn', requiredStoryChoice: { encounterId: 'trial-hushed-causeway', choiceIds: ['guard', 'choose'] } },
  { from: 'hushed-causeway', to: 'road-warden', requiredStoryChoice: { encounterId: 'trial-hushed-causeway', choiceIds: ['move', 'choose'] } },
  { from: 'last-cairn', to: 'silent-crossing' },
  { from: 'road-warden', to: 'silent-crossing' },
]

const MOSS_GATE_NODES: MapNode[] = [
  { id: 'moss-threshold', title: 'Порог врат', description: 'Корни скрывают каменную дорогу.', kind: 'start', icon: '◆', cost: 0, coinReward: 0, xpReward: 0, x: 50, y: 84 },
  { id: 'root-bridge', title: 'Корневой мост', description: 'Живые корни выдерживают только спокойный шаг.', kind: 'event', icon: '≈', cost: 2000, coinReward: 10, xpReward: 25, x: 27, y: 74 },
  { id: 'green-well', title: 'Зелёный колодец', description: 'В воде отражается небо погибшего мира.', kind: 'memory', icon: '◈', cost: 2200, coinReward: 0, xpReward: 40, x: 71, y: 74 },
  { id: 'name-stone', title: 'Камень имён', description: 'Все имена стёрты, кроме двух пересекающихся черт.', kind: 'event', icon: '◇', cost: 2600, coinReward: 20, xpReward: 35, x: 25, y: 62 },
  { id: 'buried-armory', title: 'Погребённая оружейная', description: 'Ржавое оружие окружает нетронутый дорожный сундук.', kind: 'event', icon: '□', cost: 2800, coinReward: 45, xpReward: 25, x: 75, y: 62 },
  { id: 'moss-lantern', title: 'Моховой светоч', description: 'Зелёное пламя собирает обе тропы у входа в древний двор.', kind: 'event', icon: '✦', cost: 2500, coinReward: 20, xpReward: 40, x: 50, y: 52 },
  { id: 'hollow-choir', title: 'Хор пустых', description: 'Две руки удерживают один клинок, а боль принадлежит обеим.', kind: 'memory', icon: '◈', cost: 3200, coinReward: 0, xpReward: 70, x: 50, y: 42, encounterId: 'memory-two-hands' },
  { id: 'moss-sentinel', title: 'Мшистый часовой', description: 'Древний страж пробуждается и повторяет последний приказ.', kind: 'battle', icon: '×', cost: 3500, coinReward: 40, xpReward: 70, x: 37, y: 32, encounterId: 'trial-moss-sentinel' },
  { id: 'sealed-stair', title: 'Запечатанная лестница', description: 'Печать реагирует на способ, которым герой прошёл испытание.', kind: 'event', icon: '✦', cost: 2200, coinReward: 20, xpReward: 45, x: 63, y: 25, encounterId: 'trial-sealed-stair' },
  { id: 'gate-vestibule', title: 'Преддверие врат', description: 'За печатью слышно медленное биение каменного сердца.', kind: 'event', icon: '◇', cost: 2500, coinReward: 25, xpReward: 45, x: 50, y: 18 },
  { id: 'gate-heart', title: 'Сердце врат', description: 'Врата открывают следующий участок Пределов.', kind: 'landmark', icon: '✧', cost: 4000, coinReward: 105, xpReward: 140, x: 50, y: 9 },
]

const MOSS_GATE_EDGES: MapEdge[] = [
  { from: 'moss-threshold', to: 'root-bridge' },
  { from: 'moss-threshold', to: 'green-well' },
  { from: 'root-bridge', to: 'name-stone' },
  { from: 'green-well', to: 'buried-armory' },
  { from: 'name-stone', to: 'moss-lantern' },
  { from: 'buried-armory', to: 'moss-lantern' },
  { from: 'moss-lantern', to: 'hollow-choir' },
  { from: 'hollow-choir', to: 'moss-sentinel' },
  { from: 'moss-sentinel', to: 'sealed-stair' },
  { from: 'sealed-stair', to: 'gate-vestibule' },
  { from: 'gate-vestibule', to: 'gate-heart' },
]

const DROWNED_FORD_NODES: MapNode[] = [
  { id: 'ford-rain-marker', title: 'Дождевой знак брода', description: 'У края воды стоит камень, на котором дождь идёт против течения.', kind: 'start', icon: '◆', cost: 0, coinReward: 0, xpReward: 0, x: 50, y: 84 },
  { id: 'half-sunk-track', title: 'Полузатопленный след', description: 'Следы телеги уходят под воду и возвращаются уже без колёс.', kind: 'event', icon: '≈', cost: 1900, coinReward: 0, xpReward: 30, x: 28, y: 72 },
  { id: 'willow-echo-bank', title: 'Ивовый отклик', description: 'Ивы повторяют плеск так поздно, будто отвечают другому берегу.', kind: 'event', icon: '✦', cost: 2100, coinReward: 10, xpReward: 30, x: 72, y: 72 },
  { id: 'drowned-wheel-cache', title: 'Тайник у колеса', description: 'В застрявшем колесе спрятан дорожный кошель и мокрая лента.', kind: 'event', icon: '□', cost: 2400, coinReward: 40, xpReward: 25, x: 27, y: 58 },
  { id: 'black-reed-watch', title: 'Чёрный камыш', description: 'Камыш стоит неподвижно, хотя вода вокруг него дрожит.', kind: 'event', icon: '◇', cost: 2500, coinReward: 0, xpReward: 45, x: 73, y: 58 },
  { id: 'ford-middle-stone', title: 'Средний камень', description: 'На середине брода сухой камень держит место для короткого огня.', kind: 'camp', icon: '△', cost: 2600, coinReward: 20, xpReward: 45, x: 50, y: 44 },
  { id: 'last-shallow', title: 'Последняя мель', description: 'Вода мельчает, но каждый шаг звучит как чужое имя.', kind: 'event', icon: '≈', cost: 2800, coinReward: 20, xpReward: 55, x: 50, y: 30 },
  { id: 'grey-bank-call', title: 'Зов серого берега', description: 'За бродом открывается путь к переправе, где туман уже ждёт ответа.', kind: 'landmark', icon: '✧', cost: 3300, coinReward: 90, xpReward: 120, x: 50, y: 14 },
]

const DROWNED_FORD_EDGES: MapEdge[] = [
  { from: 'ford-rain-marker', to: 'half-sunk-track' },
  { from: 'ford-rain-marker', to: 'willow-echo-bank' },
  { from: 'half-sunk-track', to: 'drowned-wheel-cache' },
  { from: 'willow-echo-bank', to: 'black-reed-watch' },
  { from: 'drowned-wheel-cache', to: 'ford-middle-stone' },
  { from: 'black-reed-watch', to: 'ford-middle-stone' },
  { from: 'ford-middle-stone', to: 'last-shallow' },
  { from: 'last-shallow', to: 'grey-bank-call' },
]

const HOLLOW_GROVE_NODES: MapNode[] = [
  { id: 'hollow-grove-mouth', title: 'Вход в пустую рощу', description: 'Деревья растут кругом, но в середине нет ни тени, ни травы.', kind: 'start', icon: '◆', cost: 0, coinReward: 0, xpReward: 0, x: 50, y: 84 },
  { id: 'barkless-stand', title: 'Стволы без коры', description: 'Белые стволы стоят гладко, как кости старой дороги.', kind: 'event', icon: '✦', cost: 2000, coinReward: 0, xpReward: 35, x: 28, y: 72 },
  { id: 'root-hollow-path', title: 'Тропа корневых пустот', description: 'Под корнями тянутся тёмные норы, слишком ровные для зверя.', kind: 'event', icon: '≈', cost: 2200, coinReward: 10, xpReward: 30, x: 72, y: 72 },
  { id: 'silent-nest-cache', title: 'Беззвучное гнездо', description: 'В гнезде из сухих веток лежат монеты, завёрнутые в лист.', kind: 'event', icon: '□', cost: 2400, coinReward: 42, xpReward: 25, x: 27, y: 58 },
  { id: 'empty-bell-tree', title: 'Дерево пустого колокола', description: 'Внутри дупла висит колокол без языка и всё равно тихо звенит.', kind: 'event', icon: '◇', cost: 2500, coinReward: 0, xpReward: 45, x: 73, y: 58 },
  { id: 'grove-ash-ring', title: 'Кольцо белой золы', description: 'Роща расходится вокруг места, где можно поставить лагерь.', kind: 'camp', icon: '△', cost: 2700, coinReward: 20, xpReward: 45, x: 50, y: 44 },
  { id: 'old-road-scent', title: 'Запах старой дороги', description: 'За деревьями появляется пыльный запах яблонь и далёких клятв.', kind: 'landmark', icon: '✦', cost: 2900, coinReward: 20, xpReward: 55, x: 50, y: 30 },
  { id: 'heartland-sign', title: 'Знак срединья', description: 'Первый указатель Старого срединья смотрит в три стороны сразу.', kind: 'landmark', icon: '✧', cost: 3400, coinReward: 95, xpReward: 120, x: 50, y: 14 },
]

const HOLLOW_GROVE_EDGES: MapEdge[] = [
  { from: 'hollow-grove-mouth', to: 'barkless-stand' },
  { from: 'hollow-grove-mouth', to: 'root-hollow-path' },
  { from: 'barkless-stand', to: 'silent-nest-cache' },
  { from: 'root-hollow-path', to: 'empty-bell-tree' },
  { from: 'silent-nest-cache', to: 'grove-ash-ring' },
  { from: 'empty-bell-tree', to: 'grove-ash-ring' },
  { from: 'grove-ash-ring', to: 'old-road-scent' },
  { from: 'old-road-scent', to: 'heartland-sign' },
]

const WATCHER_HILL_NODES: MapNode[] = [
  { id: 'watcher-hill-foot', title: 'Подножие холма', description: 'Склон поднимается над последними влажными травами Пределов.', kind: 'start', icon: '◆', cost: 0, coinReward: 0, xpReward: 0, x: 50, y: 84 },
  { id: 'tilted-lookout-stone', title: 'Косой дозорный камень', description: 'Камень наклонён так, будто всё ещё всматривается в юг.', kind: 'event', icon: '◇', cost: 2100, coinReward: 10, xpReward: 35, x: 28, y: 72 },
  { id: 'dry-thunder-grass', title: 'Трава сухого грома', description: 'Под ногами хрустит трава, высушенная не солнцем, а далёким жаром.', kind: 'event', icon: '≈', cost: 2300, coinReward: 0, xpReward: 40, x: 72, y: 72 },
  { id: 'watcher-lost-pack', title: 'Брошенный заплечник', description: 'В заплечнике лежат обугленные ремни и несколько целых монет.', kind: 'event', icon: '□', cost: 2500, coinReward: 45, xpReward: 25, x: 27, y: 58 },
  { id: 'red-wind-gully', title: 'Овраг красного ветра', description: 'Из узкого оврага тянет теплом, хотя камни вокруг холодные.', kind: 'event', icon: '✦', cost: 2600, coinReward: 0, xpReward: 50, x: 73, y: 58 },
  { id: 'hilltop-cinder-line', title: 'Линия углей на вершине', description: 'На вершине холма угли лежат ровной чертой, указывая к Пепельным землям.', kind: 'landmark', icon: '△', cost: 2800, coinReward: 20, xpReward: 55, x: 50, y: 44 },
  { id: 'far-red-glow', title: 'Дальний красный отсвет', description: 'Горизонт светится не закатом, а старым жаром, который не умеет умирать.', kind: 'event', icon: '✦', cost: 3000, coinReward: 20, xpReward: 55, x: 50, y: 30 },
  { id: 'ashward-descent', title: 'Спуск к пеплу', description: 'Склон выпускает героя к границе, где земля уже тлеет под подошвой.', kind: 'landmark', icon: '✧', cost: 3500, coinReward: 100, xpReward: 125, x: 50, y: 14 },
]

const WATCHER_HILL_EDGES: MapEdge[] = [
  { from: 'watcher-hill-foot', to: 'tilted-lookout-stone' },
  { from: 'watcher-hill-foot', to: 'dry-thunder-grass' },
  { from: 'tilted-lookout-stone', to: 'watcher-lost-pack' },
  { from: 'dry-thunder-grass', to: 'red-wind-gully' },
  { from: 'watcher-lost-pack', to: 'hilltop-cinder-line' },
  { from: 'red-wind-gully', to: 'hilltop-cinder-line' },
  { from: 'hilltop-cinder-line', to: 'far-red-glow' },
  { from: 'far-red-glow', to: 'ashward-descent' },
]

const HEART_OBSERVATORY_NODES: MapNode[] = [
  { id: 'observatory-lower-step', title: 'Нижняя ступень обсерватории', description: 'Лестница поднимается к куполу, где когда-то слушали сердце земли.', kind: 'start', icon: '◆', cost: 0, coinReward: 0, xpReward: 0, x: 50, y: 84 },
  { id: 'vow-gear-arc', title: 'Дуга шестерён клятвы', description: 'Ржавые зубцы сложены полукругом и всё ещё ждут паломничий счёт.', kind: 'event', icon: '◇', cost: 2300, coinReward: 10, xpReward: 40, x: 28, y: 72 },
  { id: 'cold-lens-yard', title: 'Двор холодной линзы', description: 'Разбитая линза собирает не свет, а морозный воздух с северных высот.', kind: 'event', icon: '✦', cost: 2400, coinReward: 0, xpReward: 45, x: 72, y: 72 },
  { id: 'astronomer-lockbox', title: 'Ящик звёздочёта', description: 'Под плитой спрятан узкий ящик с печатью старой школы.', kind: 'event', icon: '□', cost: 2700, coinReward: 48, xpReward: 25, x: 27, y: 58 },
  { id: 'frosted-heart-dial', title: 'Замёрзший сердечный циферблат', description: 'Стрелка указывает не время, а направление боли в камне.', kind: 'event', icon: '≈', cost: 2600, coinReward: 0, xpReward: 55, x: 73, y: 58 },
  { id: 'north-window-camp', title: 'Лагерь у северного окна', description: 'В проломе стены можно поставить огонь, защищённый от старого ветра.', kind: 'camp', icon: '△', cost: 3000, coinReward: 20, xpReward: 50, x: 50, y: 44 },
  { id: 'crown-shadow-line', title: 'Линия тени короны', description: 'На полу ложится тень горы, расколотая надвое ещё до заката.', kind: 'landmark', icon: '◇', cost: 3200, coinReward: 25, xpReward: 60, x: 50, y: 30 },
  { id: 'pass-signal-flame', title: 'Сигнальный огонь перевала', description: 'Последний механизм зажигает холодный свет в сторону Нижнего перевала.', kind: 'landmark', icon: '✧', cost: 3800, coinReward: 110, xpReward: 135, x: 50, y: 14 },
]

const HEART_OBSERVATORY_EDGES: MapEdge[] = [
  { from: 'observatory-lower-step', to: 'vow-gear-arc' },
  { from: 'observatory-lower-step', to: 'cold-lens-yard' },
  { from: 'vow-gear-arc', to: 'astronomer-lockbox' },
  { from: 'cold-lens-yard', to: 'frosted-heart-dial' },
  { from: 'astronomer-lockbox', to: 'north-window-camp' },
  { from: 'frosted-heart-dial', to: 'north-window-camp' },
  { from: 'north-window-camp', to: 'crown-shadow-line' },
  { from: 'crown-shadow-line', to: 'pass-signal-flame' },
]

const GREY_FERRY_NODES: MapNode[] = [
  { id: 'grey-ferry-bank', title: 'Сырой берег', description: 'Тракт уходит в серый туман, где вода съедает названия.', kind: 'start', icon: '◆', cost: 0, coinReward: 0, xpReward: 0, x: 50, y: 84 },
  { id: 'nameless-pier', title: 'Причал без имени', description: 'На досках выскоблено место, где раньше было название переправы.', kind: 'event', icon: '≈', cost: 2100, coinReward: 10, xpReward: 25, x: 27, y: 72 },
  { id: 'reed-path', title: 'Тростниковая тропа', description: 'Стебли шепчут короткие слова и тут же забывают их.', kind: 'event', icon: '✦', cost: 2300, coinReward: 0, xpReward: 35, x: 72, y: 72 },
  { id: 'ferry-token-stone', title: 'Камень жетонов', description: 'В мокрый камень вдавлены медные круги речных домов.', kind: 'event', icon: '□', cost: 2400, coinReward: 35, xpReward: 25, x: 29, y: 58 },
  { id: 'fog-call', title: 'Зов в тумане', description: 'Из белой пелены кто-то зовёт не тебя, а имя, которого у тебя нет.', kind: 'event', icon: '◇', cost: 2600, coinReward: 0, xpReward: 45, x: 71, y: 58 },
  { id: 'still-water-marker', title: 'Метка стоячей воды', description: 'Течение здесь прекращается и отражает только костёр.', kind: 'landmark', icon: '△', cost: 2700, coinReward: 25, xpReward: 45, x: 50, y: 44 },
  { id: 'empty-ferryman-post', title: 'Столб перевозчика', description: 'К столбу привязана верёвка, уходящая в туман без лодки.', kind: 'event', icon: '≈', cost: 3000, coinReward: 20, xpReward: 55, x: 50, y: 30 },
  { id: 'far-bank-lantern', title: 'Фонарь дальнего берега', description: 'Жёлтый свет отмечает первый надёжный путь в Серой долине.', kind: 'landmark', icon: '✧', cost: 3400, coinReward: 95, xpReward: 125, x: 50, y: 14 },
]

const GREY_FERRY_EDGES: MapEdge[] = [
  { from: 'grey-ferry-bank', to: 'nameless-pier' },
  { from: 'grey-ferry-bank', to: 'reed-path' },
  { from: 'nameless-pier', to: 'ferry-token-stone' },
  { from: 'reed-path', to: 'fog-call' },
  { from: 'ferry-token-stone', to: 'still-water-marker' },
  { from: 'fog-call', to: 'still-water-marker' },
  { from: 'still-water-marker', to: 'empty-ferryman-post' },
  { from: 'empty-ferryman-post', to: 'far-bank-lantern' },
]

const REED_SANCTUARY_NODES: MapNode[] = [
  { id: 'reed-sanctuary-threshold', title: 'Порог святилища', description: 'Тростник расступается в тишину, где вода стоит выше земли.', kind: 'start', icon: '◆', cost: 0, coinReward: 0, xpReward: 0, x: 50, y: 84 },
  { id: 'listening-reeds', title: 'Слушающий тростник', description: 'Стебли наклоняются к шагам и повторяют только последние звуки.', kind: 'event', icon: '✦', cost: 2300, coinReward: 0, xpReward: 35, x: 28, y: 73 },
  { id: 'silted-prayer-planks', title: 'Заиленные молитвенные доски', description: 'Доски лежат в воде, и каждая хранит след ладони без имени.', kind: 'event', icon: '≈', cost: 2400, coinReward: 10, xpReward: 35, x: 72, y: 73 },
  { id: 'reed-coin-braid', title: 'Коса речных монет', description: 'В сплетённых стеблях звенят жетоны старых переправ.', kind: 'event', icon: '□', cost: 2600, coinReward: 45, xpReward: 25, x: 25, y: 60 },
  { id: 'name-eaten-idol', title: 'Идол со съеденным именем', description: 'На лице идола стерты черты, но вода всё ещё обходит его кругом.', kind: 'event', icon: '◇', cost: 2800, coinReward: 0, xpReward: 50, x: 75, y: 60 },
  { id: 'dry-mat-camp', title: 'Сухая циновка', description: 'Посреди сырости сохранился круг тростника, где можно поднять костёр.', kind: 'camp', icon: '△', cost: 2700, coinReward: 20, xpReward: 45, x: 50, y: 47 },
  { id: 'fog-choir-pool', title: 'Пруд туманного хора', description: 'Голоса под водой поют без слов, чтобы Морок не понял смысла.', kind: 'battle', icon: '×', cost: 3000, coinReward: 20, xpReward: 60, x: 38, y: 32 },
  { id: 'unmoored-shrine-raft', title: 'Отвязанный плот святилища', description: 'Плот медленно разворачивается к месту, где начинается рынок в тумане.', kind: 'landmark', icon: '≈', cost: 3100, coinReward: 25, xpReward: 65, x: 62, y: 24 },
  { id: 'fog-market-lanterns', title: 'Фонари туманного рынка', description: 'За тростником мерцают огни без вывесок, но дорога к ним уже держится.', kind: 'landmark', icon: '✧', cost: 3600, coinReward: 110, xpReward: 140, x: 50, y: 10 },
]

const REED_SANCTUARY_EDGES: MapEdge[] = [
  { from: 'reed-sanctuary-threshold', to: 'listening-reeds' },
  { from: 'reed-sanctuary-threshold', to: 'silted-prayer-planks' },
  { from: 'listening-reeds', to: 'reed-coin-braid' },
  { from: 'silted-prayer-planks', to: 'name-eaten-idol' },
  { from: 'reed-coin-braid', to: 'dry-mat-camp' },
  { from: 'name-eaten-idol', to: 'dry-mat-camp' },
  { from: 'dry-mat-camp', to: 'fog-choir-pool' },
  { from: 'fog-choir-pool', to: 'unmoored-shrine-raft' },
  { from: 'unmoored-shrine-raft', to: 'fog-market-lanterns' },
]

const SUNKEN_VILLAGE_NODES: MapNode[] = [
  { id: 'sunken-village-bank', title: 'Берег утонувшей деревни', description: 'Крыши старых домов торчат из воды, как камни забытых имён.', kind: 'start', icon: '◆', cost: 0, coinReward: 0, xpReward: 0, x: 50, y: 84 },
  { id: 'roofline-crossing', title: 'Переход по крышам', description: 'Дорога держится на черепице, скользкой от серого тумана.', kind: 'event', icon: '≈', cost: 2300, coinReward: 0, xpReward: 35, x: 27, y: 73 },
  { id: 'bell-window', title: 'Окно с колокольчиком', description: 'В пустой раме висит колокольчик, звенящий только под водой.', kind: 'event', icon: '✦', cost: 2400, coinReward: 10, xpReward: 35, x: 73, y: 73 },
  { id: 'drowned-hearth-cache', title: 'Тайник у затонувшего очага', description: 'Под камнем очага лежит сухой мешочек с речными монетами.', kind: 'event', icon: '□', cost: 2600, coinReward: 45, xpReward: 25, x: 25, y: 60 },
  { id: 'doorless-house', title: 'Дом без двери', description: 'Входа нет, но внутри слышны шаги, считающие каждого путника.', kind: 'event', icon: '◇', cost: 2700, coinReward: 0, xpReward: 50, x: 75, y: 60 },
  { id: 'attic-camp', title: 'Сухой чердак', description: 'Над водой сохранился тесный чердак, где можно поднять малый огонь.', kind: 'camp', icon: '△', cost: 2700, coinReward: 20, xpReward: 45, x: 50, y: 47 },
  { id: 'well-under-water', title: 'Колодец под водой', description: 'Круг колодца виден сквозь толщу воды и отражает чужое небо.', kind: 'event', icon: '≈', cost: 3000, coinReward: 20, xpReward: 60, x: 38, y: 32 },
  { id: 'lantern-bridge-remnant', title: 'Остаток фонарного моста', description: 'Несколько свай держат свет, направленный к торгу без вывесок.', kind: 'landmark', icon: '✦', cost: 3100, coinReward: 25, xpReward: 65, x: 62, y: 24 },
  { id: 'market-fog-bell', title: 'Колокол туманного рынка', description: 'За деревней отзывается рынок: глухо, близко и без единого имени.', kind: 'landmark', icon: '✧', cost: 3600, coinReward: 110, xpReward: 140, x: 50, y: 10 },
]

const SUNKEN_VILLAGE_EDGES: MapEdge[] = [
  { from: 'sunken-village-bank', to: 'roofline-crossing' },
  { from: 'sunken-village-bank', to: 'bell-window' },
  { from: 'roofline-crossing', to: 'drowned-hearth-cache' },
  { from: 'bell-window', to: 'doorless-house' },
  { from: 'drowned-hearth-cache', to: 'attic-camp' },
  { from: 'doorless-house', to: 'attic-camp' },
  { from: 'attic-camp', to: 'well-under-water' },
  { from: 'well-under-water', to: 'lantern-bridge-remnant' },
  { from: 'lantern-bridge-remnant', to: 'market-fog-bell' },
]

const OLD_CROSSROADS_NODES: MapNode[] = [
  { id: 'old-road-mouth', title: 'Устье старой дороги', description: 'Пыльный тракт делится на направления, которые давно не спорят.', kind: 'start', icon: '◆', cost: 0, coinReward: 0, xpReward: 0, x: 50, y: 84 },
  { id: 'pilgrim-rut', title: 'Колеи паломников', description: 'Колёса ушли в землю так глубоко, будто дорога помнит вес клятв.', kind: 'event', icon: '≈', cost: 2200, coinReward: 0, xpReward: 35, x: 30, y: 72 },
  { id: 'orchard-smoke', title: 'Дым старого сада', description: 'Запах яблонь держится над золой без единого живого дерева.', kind: 'event', icon: '✦', cost: 2300, coinReward: 10, xpReward: 30, x: 70, y: 72 },
  { id: 'vow-marker', title: 'Камень клятвы', description: 'На плите сохранилось одно слово: «дойду».', kind: 'landmark', icon: '△', cost: 2500, coinReward: 15, xpReward: 40, x: 25, y: 58 },
  { id: 'fallen-signpost', title: 'Упавший указатель', description: 'Стрелки показывают на места, которых нет на карте.', kind: 'event', icon: '□', cost: 2500, coinReward: 40, xpReward: 25, x: 75, y: 58 },
  { id: 'procession-dust', title: 'Пыль процессии', description: 'По дороге проходят следы посохов, но не ног.', kind: 'event', icon: '◇', cost: 2800, coinReward: 0, xpReward: 50, x: 50, y: 44 },
  { id: 'crossroads-hearth', title: 'Очаг распутья', description: 'В центре дорог лежит круг камней, готовый принять ночной лагерь.', kind: 'camp', icon: '△', cost: 2900, coinReward: 20, xpReward: 45, x: 50, y: 30 },
  { id: 'heartland-mile', title: 'Первая миля срединья', description: 'За распутьем открывается страна старых обетов и пустых садов.', kind: 'landmark', icon: '✧', cost: 3500, coinReward: 100, xpReward: 125, x: 50, y: 14 },
]

const OLD_CROSSROADS_EDGES: MapEdge[] = [
  { from: 'old-road-mouth', to: 'pilgrim-rut' },
  { from: 'old-road-mouth', to: 'orchard-smoke' },
  { from: 'pilgrim-rut', to: 'vow-marker' },
  { from: 'orchard-smoke', to: 'fallen-signpost' },
  { from: 'vow-marker', to: 'procession-dust' },
  { from: 'fallen-signpost', to: 'procession-dust' },
  { from: 'procession-dust', to: 'crossroads-hearth' },
  { from: 'crossroads-hearth', to: 'heartland-mile' },
]

const EMBER_BORDER_NODES: MapNode[] = [
  { id: 'ember-border-stones', title: 'Камни границы', description: 'Пыль становится горячее, хотя солнце уже скрыто.', kind: 'start', icon: '◆', cost: 0, coinReward: 0, xpReward: 0, x: 50, y: 84 },
  { id: 'red-ash-drift', title: 'Красный нанос', description: 'Пепел ложится волнами и шуршит, как сухая ткань.', kind: 'event', icon: '≈', cost: 2200, coinReward: 0, xpReward: 35, x: 29, y: 72 },
  { id: 'glass-splinter-field', title: 'Поле стеклянных осколков', description: 'Каждый шаг отражается в десятке оплавленных граней.', kind: 'event', icon: '◇', cost: 2400, coinReward: 15, xpReward: 40, x: 71, y: 72 },
  { id: 'coal-shelter', title: 'Угольное укрытие', description: 'Чёрные плиты держат тепло, но не выпускают дым.', kind: 'camp', icon: '△', cost: 2600, coinReward: 20, xpReward: 40, x: 26, y: 58 },
  { id: 'melted-coin-line', title: 'Линия оплавленных монет', description: 'Монеты впаяны в землю и указывают на красный горизонт.', kind: 'event', icon: '□', cost: 2700, coinReward: 45, xpReward: 25, x: 74, y: 58 },
  { id: 'cinder-watch', title: 'Пепельный дозор', description: 'На гребне стоит тень, слишком тонкая для живого тела.', kind: 'event', icon: '×', cost: 3100, coinReward: 25, xpReward: 60, x: 50, y: 43 },
  { id: 'cooling-brand-stone', title: 'Камень остывающего клейма', description: 'На камне проступает имя, которое жара не успела стереть.', kind: 'landmark', icon: '✦', cost: 2800, coinReward: 20, xpReward: 45, x: 50, y: 29 },
  { id: 'wasteward-horizon', title: 'Кромка Пепельных земель', description: 'Впереди начинается страна, где ночь всё ещё красная.', kind: 'landmark', icon: '✧', cost: 3600, coinReward: 105, xpReward: 130, x: 50, y: 13 },
]

const EMBER_BORDER_EDGES: MapEdge[] = [
  { from: 'ember-border-stones', to: 'red-ash-drift' },
  { from: 'ember-border-stones', to: 'glass-splinter-field' },
  { from: 'red-ash-drift', to: 'coal-shelter' },
  { from: 'glass-splinter-field', to: 'melted-coin-line' },
  { from: 'coal-shelter', to: 'cinder-watch' },
  { from: 'melted-coin-line', to: 'cinder-watch' },
  { from: 'cinder-watch', to: 'cooling-brand-stone' },
  { from: 'cooling-brand-stone', to: 'wasteward-horizon' },
]

const LOWER_PASS_NODES: MapNode[] = [
  { id: 'lower-pass-foot', title: 'Подножие перевала', description: 'Дорога поднимается к расколотым зубцам горы.', kind: 'start', icon: '◆', cost: 0, coinReward: 0, xpReward: 0, x: 50, y: 84 },
  { id: 'snow-veil-turn', title: 'Поворот снежной завесы', description: 'Снег падает без ветра и прячет края тропы.', kind: 'event', icon: '≈', cost: 2300, coinReward: 0, xpReward: 40, x: 29, y: 72 },
  { id: 'broken-milepost', title: 'Сломанный мильный столб', description: 'На столбе вырезана половина короны и ни одного числа.', kind: 'event', icon: '◇', cost: 2400, coinReward: 15, xpReward: 35, x: 71, y: 72 },
  { id: 'wind-cut-ledges', title: 'Полки верхового ветра', description: 'Ветер режет склон на узкие ступени.', kind: 'event', icon: '✦', cost: 2800, coinReward: 0, xpReward: 55, x: 25, y: 58 },
  { id: 'frozen-seal-cache', title: 'Тайник замёрзшей печати', description: 'Под наледью звенит металл с расколотым знаком.', kind: 'event', icon: '□', cost: 2600, coinReward: 45, xpReward: 25, x: 75, y: 58 },
  { id: 'cracked-horn-ridge', title: 'Гребень треснувшего рога', description: 'Здесь эхо звучит так, будто приказ оборвали на полуслове.', kind: 'landmark', icon: '△', cost: 3100, coinReward: 20, xpReward: 60, x: 50, y: 43 },
  { id: 'ice-camp-ring', title: 'Ледяное кольцо лагеря', description: 'Камни образуют круг, защищённый от снега, но не от голоса горы.', kind: 'camp', icon: '△', cost: 2900, coinReward: 20, xpReward: 45, x: 50, y: 29 },
  { id: 'crownward-ascent', title: 'Подъём к короне', description: 'Нижний перевал выпускает героя к сломанным высотам.', kind: 'landmark', icon: '✧', cost: 3700, coinReward: 110, xpReward: 135, x: 50, y: 13 },
]

const LOWER_PASS_EDGES: MapEdge[] = [
  { from: 'lower-pass-foot', to: 'snow-veil-turn' },
  { from: 'lower-pass-foot', to: 'broken-milepost' },
  { from: 'snow-veil-turn', to: 'wind-cut-ledges' },
  { from: 'broken-milepost', to: 'frozen-seal-cache' },
  { from: 'wind-cut-ledges', to: 'cracked-horn-ridge' },
  { from: 'frozen-seal-cache', to: 'cracked-horn-ridge' },
  { from: 'cracked-horn-ridge', to: 'ice-camp-ring' },
  { from: 'ice-camp-ring', to: 'crownward-ascent' },
]

export const LOCATION_MAPS: Record<string, LocationMapDefinition> = {
  'silent-ruins': { id: 'silent-ruins', finalNodeId: 'spire-overlook', nodes: MAP_NODES, edges: MAP_EDGES, theme: 'ruins' },
  'quiet-road': { id: 'quiet-road', finalNodeId: 'silent-crossing', nodes: QUIET_ROAD_NODES, edges: QUIET_ROAD_EDGES, theme: 'road' },
  'moss-gate': { id: 'moss-gate', finalNodeId: 'gate-heart', nodes: MOSS_GATE_NODES, edges: MOSS_GATE_EDGES, theme: 'moss' },
  'drowned-ford': { id: 'drowned-ford', finalNodeId: 'grey-bank-call', nodes: DROWNED_FORD_NODES, edges: DROWNED_FORD_EDGES, theme: 'grey' },
  'hollow-grove': { id: 'hollow-grove', finalNodeId: 'heartland-sign', nodes: HOLLOW_GROVE_NODES, edges: HOLLOW_GROVE_EDGES, theme: 'road' },
  'watcher-hill': { id: 'watcher-hill', finalNodeId: 'ashward-descent', nodes: WATCHER_HILL_NODES, edges: WATCHER_HILL_EDGES, theme: 'ash' },
  'grey-ferry': { id: 'grey-ferry', finalNodeId: 'far-bank-lantern', nodes: GREY_FERRY_NODES, edges: GREY_FERRY_EDGES, theme: 'grey' },
  'reed-sanctuary': { id: 'reed-sanctuary', finalNodeId: 'fog-market-lanterns', nodes: REED_SANCTUARY_NODES, edges: REED_SANCTUARY_EDGES, theme: 'grey' },
  'sunken-village': { id: 'sunken-village', finalNodeId: 'market-fog-bell', nodes: SUNKEN_VILLAGE_NODES, edges: SUNKEN_VILLAGE_EDGES, theme: 'grey' },
  'old-crossroads': { id: 'old-crossroads', finalNodeId: 'heartland-mile', nodes: OLD_CROSSROADS_NODES, edges: OLD_CROSSROADS_EDGES, theme: 'heartland' },
  'heart-observatory': { id: 'heart-observatory', finalNodeId: 'pass-signal-flame', nodes: HEART_OBSERVATORY_NODES, edges: HEART_OBSERVATORY_EDGES, theme: 'crown' },
  'ember-border': { id: 'ember-border', finalNodeId: 'wasteward-horizon', nodes: EMBER_BORDER_NODES, edges: EMBER_BORDER_EDGES, theme: 'ash' },
  'lower-pass': { id: 'lower-pass', finalNodeId: 'crownward-ascent', nodes: LOWER_PASS_NODES, edges: LOWER_PASS_EDGES, theme: 'crown' },
}

export const getLocationMap = (locationId: string) => LOCATION_MAPS[locationId] ?? LOCATION_MAPS['silent-ruins']

export const isLocationPlayable = (locationId: string) => Boolean(LOCATION_MAPS[locationId])

export const createInitialMapProgress = (locationId = 'silent-ruins'): MapProgress => {
  const firstNodeId = getLocationMap(locationId).nodes[0].id
  return {
  currentNodeId: firstNodeId,
  completedNodeIds: [firstNodeId],
  activeTargetId: null,
  activeProgress: 0,
  stepBank: 0,
  creditedDate: '',
  creditedSteps: 0,
  rewardedNodeIds: [firstNodeId],
  locationCompleted: false,
  }
}

export const getMapNode = (nodeId: string, locationId = 'silent-ruins') => getLocationMap(locationId).nodes.find((node) => node.id === nodeId)

const isEdgeAvailable = (edge: MapEdge, story?: StoryProgress) => {
  if (!edge.requiredStoryChoice || !story) return true
  const selectedChoice = story.choices[edge.requiredStoryChoice.encounterId]
  return edge.requiredStoryChoice.choiceIds.includes(selectedChoice)
}

export const getAvailableTargetIds = (progress: MapProgress, locationId = 'silent-ruins', story?: StoryProgress) => {
  if (progress.activeTargetId) return [progress.activeTargetId]
  return getLocationMap(locationId).edges
    .filter((edge) => edge.from === progress.currentNodeId && isEdgeAvailable(edge, story))
    .map((edge) => edge.to)
}

const applyStepsToActiveRoute = (progress: MapProgress, incomingSteps: number, locationId = 'silent-ruins'): MapProgress => {
  if (!progress.activeTargetId) {
    return { ...progress, stepBank: progress.stepBank + incomingSteps }
  }

  const target = getMapNode(progress.activeTargetId, locationId)
  if (!target) return { ...progress, activeTargetId: null, activeProgress: 0, stepBank: progress.stepBank + incomingSteps }

  const remaining = Math.max(0, target.cost - progress.activeProgress)
  const invested = Math.min(remaining, incomingSteps)
  const nextProgress = progress.activeProgress + invested
  const leftover = incomingSteps - invested

  if (nextProgress < target.cost) {
    return { ...progress, activeProgress: nextProgress }
  }

  return {
    ...progress,
    currentNodeId: target.id,
    completedNodeIds: Array.from(new Set([...progress.completedNodeIds, target.id])),
    activeTargetId: null,
    activeProgress: 0,
    stepBank: progress.stepBank + leftover,
  }
}

export const addDebugRouteSteps = (progress: MapProgress, steps: number, locationId = 'silent-ruins') =>
  applyStepsToActiveRoute(progress, Math.max(0, steps), locationId)

export const creditTodaySteps = (progress: MapProgress, date: string, todaySteps: number, locationId = 'silent-ruins'): MapProgress => {
  const credited = progress.creditedDate === date ? progress.creditedSteps : 0
  const normalizedTodaySteps = Math.max(0, todaySteps)
  const nextCreditedSteps = progress.creditedDate === date ? Math.max(progress.creditedSteps, normalizedTodaySteps) : normalizedTodaySteps
  const incoming = Math.max(0, normalizedTodaySteps - credited)
  const synced = { ...progress, creditedDate: date, creditedSteps: nextCreditedSteps }
  return incoming > 0 ? applyStepsToActiveRoute(synced, incoming, locationId) : synced
}

export const startMapRoute = (progress: MapProgress, targetId: string, locationId = 'silent-ruins', story?: StoryProgress): MapProgress => {
  if (progress.activeTargetId && progress.activeTargetId !== targetId) return progress
  if (!getAvailableTargetIds(progress, locationId, story).includes(targetId)) return progress

  const started = { ...progress, activeTargetId: targetId, activeProgress: progress.activeTargetId ? progress.activeProgress : 0, stepBank: 0 }
  return applyStepsToActiveRoute(started, progress.stepBank, locationId)
}

export const carryStepCreditToMap = (source: MapProgress, target: MapProgress): MapProgress => {
  return {
    ...target,
    stepBank: source.stepBank,
    creditedDate: source.creditedDate,
    creditedSteps: source.creditedSteps,
  }
}

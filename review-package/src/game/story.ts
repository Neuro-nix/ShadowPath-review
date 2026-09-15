export type IdentityPath = 'guardian' | 'survivor' | 'third'

export type StoryChoice = {
  id: string
  title: string
  text: string
  result: string
  identity?: IdentityPath
  identityAffinity?: IdentityPath
  ability?: string
  abilityAffinity?: string
  coins?: number
  xp?: number
}

export type StoryEncounter = {
  id: string
  type: 'memory' | 'trial'
  eyebrow: string
  title: string
  scene: string
  art?: string
  choices: StoryChoice[]
}

export type StoryJournalEntry = {
  encounterId: string
  title: string
  choice: string
  result: string
}

export type StoryProgress = {
  completedEncounterIds: string[]
  choices: Record<string, string>
  abilities: string[]
  identity: Record<IdentityPath, number>
  journal: StoryJournalEntry[]
}

export const STORY_ENCOUNTERS: StoryEncounter[] = [
  {
    id: 'trial-ash-guard',
    type: 'trial',
    eyebrow: 'Первое испытание',
    title: 'Страж без приказа',
    scene: 'Пепельная фигура поднимает копьё, но не атакует. Она повторяет стойку героя, словно ждёт знакомого приказа.',
    choices: [
      { id: 'endure', title: 'Не отступать', text: 'Выдержать молчаливое давление и дождаться движения стража.', result: 'Страж первым опускает копьё. Путь признаёт твою выдержку.', coins: 10, xp: 20 },
      { id: 'mirror', title: 'Повторить его знак', text: 'Ответить той же стойкой и вернуть стражу забытый ритуал.', result: 'Доспех вспоминает завершение караула и рассыпается тёплым пеплом.', coins: 15, xp: 15 },
      { id: 'slip', title: 'Пройти между ударами', text: 'Не принимать чужие правила и найти пустоту в движении.', result: 'Копьё пронзает только тень, а дорога остаётся за спиной.', coins: 5, xp: 25 },
    ],
  },
  {
    id: 'memory-falling-world',
    type: 'memory',
    eyebrow: 'Первое воспоминание',
    title: 'Мир падает вверх',
    scene: 'Башни и камни уходят в серое небо. Среди гула слышны два дыхания, но оба ощущаются как твои.',
    art: '/generated-assets/memory-falling-world.webp',
    choices: [
      { id: 'hold', title: 'Я удерживал мир', text: 'Принять чувство долга и сопротивления.', result: 'В памяти остаётся тяжесть мира, который нельзя было отпустить.', identity: 'guardian', xp: 25 },
      { id: 'carry', title: 'Я нёс конец дальше', text: 'Признать отчаянное движение ради выживания.', result: 'В памяти остаётся дорога сквозь гибнущие миры.', identity: 'survivor', xp: 25 },
      { id: 'witness', title: 'Я видел обоих', text: 'Не присваивать себе ни одну роль.', result: 'Ты сохраняешь противоречие, не превращая его в готовый ответ.', identity: 'third', xp: 25 },
    ],
  },
  {
    id: 'memory-word-home',
    type: 'memory',
    eyebrow: 'Второе воспоминание',
    title: 'Чужой голос говорит «дом»',
    scene: 'Один голос произносит слово как клятву. Другой — как название места, которого у него никогда не было.',
    art: '/generated-assets/memory-word-home.webp',
    choices: [
      { id: 'protect', title: 'Дом нужно защищать', text: 'Связать память с принадлежностью и долгом.', result: 'Слово становится обещанием остаться, даже когда проще уйти.', identity: 'guardian', xp: 35 },
      { id: 'leave', title: 'Дом не должен стать цепью', text: 'Связать память с движением и выживанием.', result: 'Слово остаётся болью, которую нельзя позволить превратить в клетку.', identity: 'survivor', xp: 35 },
      { id: 'build', title: 'Дом можно выбрать заново', text: 'Отделить новую жизнь от обеих старых.', result: 'Впервые Террайн ощущается не только чужим местом.', identity: 'third', xp: 35 },
    ],
  },
  {
    id: 'memory-two-hands',
    type: 'memory',
    eyebrow: 'Третье воспоминание',
    title: 'Две руки на одном клинке',
    scene: 'Человеческая и нечеловеческая руки держат один клинок. Одна шепчет «удержи», другая — «пропусти». Боль принадлежит обеим.',
    art: '/generated-assets/memory-two-hands.webp',
    choices: [
      { id: 'hold', title: 'Удержать', text: 'Я не должен был дать ему пройти.', result: 'Открыта способность «Стойка Перехода»: один раз за испытание она смягчает опасное действие.', identity: 'guardian', ability: 'guard-stance', xp: 50 },
      { id: 'pass', title: 'Пройти', text: 'Остановиться значило исчезнуть.', result: 'Открыта способность «Пепельный выпад»: один раз за испытание она усиливает решительное действие.', identity: 'survivor', ability: 'ash-lunge', xp: 50 },
      { id: 'separate', title: 'Разомкнуть руки', text: 'Я не хочу повторять их удар.', result: 'Открыта способность «Тихий разрыв»: один раз за испытание она прерывает навязанный ритм.', identity: 'third', ability: 'silent-break', xp: 50 },
    ],
  },
  {
    id: 'trial-hushed-causeway',
    type: 'trial',
    eyebrow: 'Испытание тракта',
    title: 'Гать без эха',
    scene: 'Доски глушат шаги и не принимают вес тела. Дорога ждёт, какой смысл герой отдаст слову «дом».',
    choices: [
      { id: 'guard', title: 'Защитить найденное', text: 'Ступить так, будто дом — это то, что нужно удержать.', result: 'Гать принимает твёрдый шаг. За спиной на миг слышится спокойный караул.', identityAffinity: 'guardian', coins: 20, xp: 35 },
      { id: 'move', title: 'Не стать цепью', text: 'Ступить так, будто дом не имеет права остановить живого.', result: 'Доски расходятся перед быстрым шагом, оставляя позади только лёгкий след.', identityAffinity: 'survivor', coins: 20, xp: 35 },
      { id: 'choose', title: 'Назвать путь своим', text: 'Ступить без старого приказа и старого бегства.', result: 'Эхо исчезает. На миг дорога звучит только твоим шагом.', identityAffinity: 'third', coins: 20, xp: 35 },
    ],
  },
  {
    id: 'trial-moss-sentinel',
    type: 'trial',
    eyebrow: 'Первое испытание',
    title: 'Последний приказ часового',
    scene: 'Каменный страж поднимает клинок. Победить его можно выдержкой, натиском или нарушив древний приказ.',
    art: '/generated-assets/moss-sentinel.webp',
    choices: [
      { id: 'brace', title: 'Принять удар', text: 'Удержать проход и переждать тяжёлый взмах.', result: 'Часовой разбивает клинок о твою защиту и замирает.', abilityAffinity: 'guard-stance', coins: 25, xp: 45 },
      { id: 'strike', title: 'Пойти навстречу', text: 'Не дать часовому завершить движение.', result: 'Усиленный выпад пробивает мох в центре каменной брони.', abilityAffinity: 'ash-lunge', coins: 25, xp: 45 },
      { id: 'disrupt', title: 'Разорвать приказ', text: 'Ударить не по телу, а по повторяющемуся ритму.', result: 'Приказ обрывается, и страж впервые опускает оружие.', abilityAffinity: 'silent-break', coins: 25, xp: 45 },
    ],
  },
  {
    id: 'trial-sealed-stair',
    type: 'trial',
    eyebrow: 'Отзвук способности',
    title: 'Печать запечатанной лестницы',
    scene: 'За поверженным часовым лестница остаётся закрытой. Каменная печать повторяет не удар, а внутренний способ, которым герой прошёл приказ.',
    choices: [
      { id: 'anchor', title: 'Удержать форму печати', text: 'Встать в центр знака и принять давление камня на себя.', result: 'Печать перестаёт давить наружу. Лестница признаёт спокойную стойкость и открывает первую ступень.', abilityAffinity: 'guard-stance', coins: 20, xp: 40 },
      { id: 'drive', title: 'Пробить слабое звено', text: 'Найти трещину в рисунке и вложить движение в один точный рывок.', result: 'Трещина вспыхивает пепельным светом. Печать не ломается, а уступает дороге вперёд.', abilityAffinity: 'ash-lunge', coins: 20, xp: 40 },
      { id: 'unmake', title: 'Разомкнуть повтор', text: 'Сбить навязанный ритм печати, пока линии не перестанут замыкаться.', result: 'Знак теряет старую команду. Камень тихо расходится, будто никогда не был заперт.', abilityAffinity: 'silent-break', coins: 20, xp: 40 },
    ],
  },
]

export const createInitialStoryProgress = (): StoryProgress => ({
  completedEncounterIds: [],
  choices: {},
  abilities: [],
  identity: { guardian: 0, survivor: 0, third: 0 },
  journal: [],
})

export const getStoryEncounter = (id: string) => STORY_ENCOUNTERS.find((encounter) => encounter.id === id)

export const getDominantIdentityPath = (story: StoryProgress): IdentityPath | null => {
  const entries = Object.entries(story.identity) as [IdentityPath, number][]
  const highest = Math.max(...entries.map(([, value]) => value))
  if (highest <= 0) return null
  const leaders = entries.filter(([, value]) => value === highest)
  return leaders.length === 1 ? leaders[0][0] : 'third'
}

export const resolveStoryEncounter = (progress: StoryProgress, encounterId: string, choiceId: string) => {
  if (progress.completedEncounterIds.includes(encounterId)) return { progress, coins: 0, xp: 0, abilityBonus: false, identityBonus: false }
  const encounter = getStoryEncounter(encounterId)
  const choice = encounter?.choices.find((item) => item.id === choiceId)
  if (!encounter || !choice) return { progress, coins: 0, xp: 0, abilityBonus: false, identityBonus: false }

  const abilityBonus = Boolean(choice.abilityAffinity && progress.abilities.includes(choice.abilityAffinity))
  const identityBonus = Boolean(choice.identityAffinity && getDominantIdentityPath(progress) === choice.identityAffinity)
  const bonusCoins = abilityBonus ? 15 : 0
  const identityCoins = identityBonus ? 10 : 0
  const bonusXp = abilityBonus ? 20 : 0
  const identityXp = identityBonus ? 15 : 0
  const nextIdentity = { ...progress.identity }
  if (choice.identity) nextIdentity[choice.identity] += 1

  return {
    progress: {
      ...progress,
      completedEncounterIds: [...progress.completedEncounterIds, encounter.id],
      choices: { ...progress.choices, [encounter.id]: choice.id },
      abilities: choice.ability && !progress.abilities.includes(choice.ability)
        ? [...progress.abilities, choice.ability]
        : progress.abilities,
      identity: nextIdentity,
      journal: [...progress.journal, { encounterId: encounter.id, title: encounter.title, choice: choice.title, result: choice.result }],
    },
    coins: (choice.coins ?? 0) + bonusCoins + identityCoins,
    xp: (choice.xp ?? 0) + bonusXp + identityXp,
    abilityBonus,
    identityBonus,
  }
}

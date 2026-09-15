# Единая сцена события — GPT Image reference-pack v1

Статус: **approved; пять состояний реализованы для пролога в production shell R1**

Дата: 20 июля 2026

## Задача

После нажатия `Открыть событие` игра не должна запускать очередь отдельных
модалок. Обычный момент, сюжетный выбор, память, мини-игра и награда живут в
одной полноэкранной сцене. Меняется её фаза и содержимое, но не контейнер.

```text
arrival -> intro/choice -> action (optional) -> resolution -> journey
                  \-> close -> journey, scene remains resumable
```

## Визуальные референсы

Исходники GPT Image:

1. `gpt-image/encounter-shell-v1-01-ordinary-choice.png` — обычное событие с
   равноправным выбором;
2. `gpt-image/encounter-shell-v1-02-memory.png` — трактовка воспоминания;
3. `gpt-image/encounter-shell-v1-03-lockpicking.png` — физический замок с тремя
   штифтами;
4. `gpt-image/encounter-shell-v1-04-battle.png` — Пепельный страж и поле 5×5;
5. `gpt-image/encounter-shell-v1-05-resolution.png` — результат и награда
   внутри той же сцены.

Проверочные изображения реального размера лежат в
`previews/encounter-shell-v1-mobile-*.png`.

## Инварианты оболочки

- строго портретный полноэкранный режим;
- глобальная нижняя навигация скрыта, пока сцена активна;
- `Закрыть` возвращает на путь, но не удаляет незавершённую сцену;
- арт занимает верхнюю часть экрана, контент вырастает из затемнения сцены;
- не используется отдельная прямоугольная модалка поверх мира;
- одно главное действие или один набор равноправных вариантов за раз;
- базовая награда за достигнутую точку не зависит от результата мини-игры;
- бонус показывается отдельной строкой и может быть нулевым;
- результат не открывается новой модалкой: shell переключается в `resolution`;
- после `Продолжить путь` возвращаются главный экран и глобальная навигация.

## Фазы и данные

| Фаза | Главное | Действие | Что сохраняется |
|---|---|---|---|
| `intro` | место, персонаж или контекст | продолжить / выбрать | активная сцена |
| `choice` | 2–3 равноправных решения | выбрать вариант | выбор только после подтверждения |
| `action` | конкретная механика | тап, drag или цепочка | промежуточный прогресс сцены |
| `resolution` | последствие и награда | продолжить путь | выбор, базовая награда, бонус |
| `closed` | главный экран пути | снова открыть событие | незавершённая фаза и ввод |

Для простого события `intro` и `choice` могут быть одним экраном. Для тайника
`choice` отсутствует. У Пепельного стража сначала идёт сюжетный выбор, затем
бой, затем единый результат.

## Состояния reference-pack

### Обычное событие

`Шепчущая роща` показывает минимальный вариант оболочки: один атмосферный
момент, уже начисленная базовая награда и два равноправных подхода. Нажатие на
вариант сразу переводит shell в результат; отдельная кнопка подтверждения не
нужна.

### Воспоминание

В первой памяти прямо объясняется договор системы: прошлое изменить нельзя,
игрок выбирает трактовку нового героя. Все три ответа визуально равны. После
выбора результат сообщает о записи в хронику, но не выдаёт новый попап.

### Взлом

В сцене остаётся контекст стены и герой, а сам замок становится крупной
интерактивной областью. На production три штифта, success band, active state и
feedback остаются кодовыми элементами. Иллюстрация задаёт материал и свет, но
не запекает положение игрового маркера.

### Бой

Верх экрана показывает врага и его намерение, низ — кодовое поле 5×5. Щит
подсвечен не только цветом, но и контуром. Поле не должно превращаться в
универсальный puzzle-экран без связи со стражем.

### Результат

Показывается эмоциональное последствие, затем две сравнимые строки:
`Базовая награда` и `Боевой бонус`. Нет сундука, конфетти и второго отчёта.

## Арт-бюджет

Reference-pack не означает уникальный полноэкранный арт на каждую точку:

- обычные точки используют региональные category-pools;
- память, босс, финал и ключевой NPC могут иметь уникальный арт;
- замок, поле боя, выборы, reward rows и весь UI создаются кодом;
- одна иллюстрация может поддерживать `intro`, `action` и `resolution` через
  кроп, свет, позу overlay-героя и состояние UI;
- производственный минимум первого пролога: 3–4 региональных сцены, одна
  память и один уникальный Пепельный страж.

## Mobile QA 390×844

- все заголовки и действия помещаются без горизонтальной обрезки;
- у выбора touch rows занимают почти всю безопасную ширину;
- у замка видны ровно три штифта и одна success band;
- у боя видны ровно 25 клеток, цель хода и намерение врага;
- результат сохраняет читаемое разделение базы и бонуса;
- критические элементы не попадают под верхнюю или нижнюю safe area.

В production размеры текста и touch targets должны быть кодовыми, а не
копироваться из растра буквально. Минимальная интерактивная высота — 44 pt;
основной текст проверяется на контраст не ниже WCAG AA; выбранное состояние не
обозначается только цветом.

## Prompt set

Режим: built-in GPT Image. Первый экран создан как новый edit утверждённой
journey-серии; остальные состояния — отдельные edit-проходы от общей оболочки.

### 01 — обычное событие

```text
Use case: ui-mockup
Asset type: screen 1 of a unified full-screen encounter reference pack for the portrait iPhone game Shadow Path.

Input images:
- Image 1 is the primary application/style and tall iPhone geometry reference. Preserve the exact shadow hero identity, narrow safe layout, painterly dark-fantasy polish, typography character, matte warm-gold accent and full-screen presentation. Do not preserve its guardian or arrival copy.
- Image 2 is supporting world reference for ruined forest paths and the hero.

Primary request: create the ordinary choice-event state that opens after an arrival. It must feel like entering one continuous scene, not opening a card or modal. The global bottom navigation disappears while the encounter is active. A quiet text close action at top returns to the journey and leaves the scene available to resume.

Scene/backdrop: a close, whispering forest grove inside the same ruined region. Dark trunks lean inward, mist carries subtle repeated shadow shapes, and the small black-green hero pauses as if listening. No visible enemy. Use one restrained green echo in the woods, not floating icons or runes.

Composition: native tall portrait iPhone aspect approximately 390:844, full-screen screenshot without phone frame. Top safe area has only a quiet close action and small encounter type. Middle 50% is immersive art with hero. Bottom 42% uses a natural black gradient integrated into the scene, not a rectangular card. It contains title, one short line, base reward, and two equal-weight choice actions. Both choices are dark matte rows with thin warm borders; neither looks like the correct answer. No bottom tab navigation.

Text (verbatim Russian; render only this text):
top left: "Закрыть"
small eyebrow: "ТОЧКА ПУТИ · ВЫБОР"
title: "ШЕПЧУЩАЯ РОЩА"
body: "Между деревьями кто-то повторяет твои шаги."
reward line: "Получено: +30 XP"
first choice title: "Слушать шаги"
first choice note: "Дать роще повторить твой ритм."
second choice title: "Оставить метку"
second choice note: "Не потерять обратный путь."

Interaction hierarchy: the place and choice are primary. Reward is factual and secondary. Choices must be large enough for touch, separated clearly, and fully readable at 390px screen width.

Strict constraints: preserve the exact hero identity and visual system. No modal card, no window frame, no global bottom navigation, no route graph, progress bar, nodes, runes, icons, emoji, badges, reward chips, decorative dividers, ornate frame, glass surface, extra text or watermark.
```

### 02 — воспоминание

```text
Use case: ui-mockup
Asset type: screen 2 of the same unified full-screen Shadow Path encounter shell, memory interpretation state.

Input images:
- Image 1 is the edit target and exact UI system reference. Preserve its tall iPhone aspect, safe areas, typography, spacing, full-screen black-gradient content treatment and quiet top-left close action. Replace the ordinary event content.
- Image 2 is the scene reference. Use its impossible upward-falling ruined towers, stones, grey sky and restrained ember detail as the dominant memory image.

Primary request: create the first memory interpretation screen inside the same encounter shell. It is not a new modal. The player sees a fixed fragment of the past and chooses only how the new hero understands it. Do not show the shadow hero inside the historical memory image.

Composition: native tall portrait iPhone approximately 390:844, full-screen without phone frame. Top has "Закрыть". Upper 48% is the falling-world art. Lower area blends through a black gradient and contains the memory eyebrow, title, short scene text, a plain-language contract line, and three compact equal-weight choice rows. No global bottom navigation.

Text (verbatim Russian; render only this text):
top left: "Закрыть"
eyebrow: "ПЕРВОЕ ВОСПОМИНАНИЕ"
title: "МИР ПАДАЕТ ВВЕРХ"
scene: "Башни и камни уходят в серое небо. Два дыхания ощущаются как твои."
contract: "Прошлое не изменить. Выбери, как Нечто его поймёт."
choice 1: "Я удерживал мир"
choice 2: "Я нёс конец дальше"
choice 3: "Я видел обоих"
footer note: "Выбор сохранится в хронике"

Hierarchy: memory art and title first, the contract sentence clearly readable, three choices equal with dark matte surfaces and thin restrained warm borders. No answer should appear correct or selected.

Strict constraints: preserve the shell visual system. No modal card, global navigation, route UI, progress bar, icons, runes, sigils, emoji, reward chips, ornate frames, glass, extra text or watermark.
```

### 03 — взлом

```text
Use case: ui-mockup
Asset type: screen 3 of the same unified full-screen Shadow Path encounter shell, starter lockpicking state.

Input image: edit target and exact UI system reference. Preserve its tall iPhone aspect, safe areas, typography, painterly world, full-screen scene treatment and quiet top-left close action. Replace the grove choice content with a physical lockpicking action inside the same scene, not another modal.

Scene: close broken ruin wall with an old iron clasp hidden in a stone crevice. The shadow hero watches from nearby but is secondary. In the lower-middle, the interaction becomes a readable in-world lock mechanism: three tall vertical pin lanes, a single luminous horizontal success band across them, one active pin marker and two waiting pins. It may use precise code-like overlay geometry while still feeling materially attached to the iron lock.

Composition: native tall portrait iPhone approximately 390:844, full-screen without phone frame. Top has quiet close and encounter type. Upper 38% is contextual art. Middle 34% contains the three-pin interaction at large touch-readable scale. Bottom contains one-line help, base-reward safety note and a single large restrained warm-gold action button. No bottom tab navigation.

Text (verbatim Russian; render only this text):
top left: "Закрыть"
eyebrow: "ДЕЙСТВИЕ · ТАЙНИК"
title: "ЗАБЫТЫЙ ТАЙНИК"
status: "Штифт 1 из 3"
instruction: "Поймай метку в светлой прорези."
safety note: "Базовая находка уже получена. Точность влияет только на бонус."
primary button: "Поймать"

Interaction clarity: the active lane and success band are unmistakable without decorative fantasy symbols. The button is the only primary action.

Strict constraints: same encounter shell; no modal card, global navigation, route graph, runes, icons, emoji, extra rewards, timer, ornate frame, glass surface, extra text or watermark.
```

### 04 — бой

```text
Use case: ui-mockup
Asset type: screen 4 of the same unified full-screen Shadow Path encounter shell, starter connect-3 battle state.

Input images:
- Image 1 is the edit target and exact UI system reference. Preserve its tall iPhone aspect, safe areas, typography, black-gradient integration and quiet top-left close action. Replace the grove content.
- Image 2 is the guardian and confrontation reference. Preserve the solemn ash guardian, ruined arch, shadow hero identity and restrained backlight.

Primary request: create the hands-on battle phase inside the same continuous encounter scene after the story choice. It must not look like a separate generic puzzle modal pasted over the art. The upper scene shows the ash guardian beginning a heavy strike while the hero holds the path. The lower interaction is a clear 5x5 connect-3 board tied to the encounter.

Composition: native tall portrait iPhone approximately 390:844, full-screen without phone frame. Top has quiet close plus small battle status. Upper 34% shows guardian and hero. Under it: title and a compact enemy-intent strip integrated into the scene. Lower 43% contains a large 5x5 board of simple tactile combat marks, then one concise instruction. No bottom navigation and no large action button; the board itself is the interaction.

Text (verbatim Russian; render only this text):
top left: "Закрыть"
eyebrow: "БОЙ · ХОД 1 ИЗ 6"
title: "ПЕПЕЛЬНЫЙ СТРАЖ"
intent label: "НАМЕРЕНИЕ: ТЯЖЁЛЫЙ УДАР"
intent help: "Щит держит первый натиск."
instruction: "Соединяй 3+ одинаковых знака"

Board: exactly 5 columns by 5 rows. Use four consistent simple mark families representing attack, guard, flame and break. Guard marks receive one restrained warm focus edge because of enemy intent; selected path, if shown, must also use shape/outline, not color alone. Keep the board large enough for finger dragging.

Strict constraints: same encounter shell; no modal card, global navigation, route UI, health-bar clutter, coins, XP, timers, emoji, ornamental runes, glass panel, extra text or watermark.
```

### 05 — результат

```text
Use case: ui-mockup
Asset type: screen 5, shared resolution and reward state of the same unified full-screen Shadow Path encounter shell.

Input images:
- Image 1 is the edit target and exact shell reference. Preserve its tall iPhone aspect, safe areas, typography, guardian and hero identity, painterly quality and integrated black-gradient content treatment. Remove the board and active battle controls.
- Image 2 is supporting reference for a calm road-forward composition and restrained button style.

Primary request: show the result of the ash-guardian encounter inside the same continuous scene, not a new modal and not a separate report card. The guardian is dissolving into quiet ash under the ruined arch, the small hero now faces the open road, and the mood releases tension without becoming celebratory. Base reward and battle bonus are clearly separated in plain text. One action returns to the journey.

Composition: native tall portrait iPhone approximately 390:844, full-screen without phone frame. Upper 58% is the resolved scene. Lower 42% blends through a black gradient with completion eyebrow, title, one atmospheric line, two compact reward rows and one restrained warm-gold primary button. No global bottom navigation on the result; it returns after the CTA.

Text (verbatim Russian; render only this text):
eyebrow: "СЦЕНА ЗАВЕРШЕНА"
title: "ПУТЬ ОТКРЫТ"
body: "Страж теряет форму. Нечто проходит под аркой."
first reward label: "Базовая награда"
first reward value: "+50 XP · 35 монет"
second reward label: "Боевой бонус"
second reward value: "+8 XP · 10 монет"
primary button: "Продолжить путь"

Hierarchy: emotional resolution and title first, rewards factual and easy to compare, CTA clear. Reward rows are simple typography with subtle separators, not chips or loot cards.

Strict constraints: same encounter shell; no modal card, separate report window, global navigation, board, route graph, progress bar, icons, emoji, badges, chest, confetti, ornate frame, glass, extra text or watermark.
```

## Production approval

Пользователь подтвердил 20 июля 2026:

1. полноэкранную оболочку без глобальной навигации;
2. возможность закрыть и позже возобновить незавершённую сцену;
3. одинаковый shell для обычного события, памяти, взлома и боя;
4. единый результат вместо отдельного reward/report popup;
5. визуальный язык пяти мобильных референсов.

Решения перенесены в `PROLOGUE_SHELL_PRODUCTION_SPEC.md` и реализованы без
изменения save shape и node IDs. Следующий gate — проверка старого сейва и
полного цикла на реальном iPhone.

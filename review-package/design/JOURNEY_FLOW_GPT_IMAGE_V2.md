# Путь и выбор маршрута — GPT Image flow v2

Статус: **approved; реализовано для пролога в production shell R1**

Дата: 20 июля 2026

## Референсы

1. `gpt-image/journey-flow-v2-01-fork.png` — маршрут не выбран;
2. `gpt-image/journey-flow-v2-02-route-choice.png` — отдельный выбор пути;
3. `gpt-image/journey-flow-v2-03-active-route.png` — выбранный путь в движении;
4. `gpt-image/journey-flow-v2-04-arrival.png` — точка достигнута;
5. `gpt-image/journey-flow-v2-05-evening.png` — необязательное вечернее
   приглашение в лагерь.

Актуальные варианты для мобильной проверки имеют суффикс `-mobile-safe.png`.
Их копии реального размера находятся в
`previews/journey-flow-v2-mobile-*.png`.

## Mobile QA 390×844

Первый честный центральный кроп исходных композиций выявил обрезку длинных
заголовков, краёв карточек выбора и крайних пунктов навигации. Поэтому серия
была не просто уменьшена, а заново скомпонована в нативной пропорции iPhone.

Проверено 20 июля 2026:

- все заголовки, CTA и четыре пункта навигации помещаются целиком;
- выбор маршрута показывает обе карточки, их стоимость и итоговый остаток;
- `860 шагов` сохраняет приоритет в движении;
- событие и запас читаются раздельно при прибытии;
- вечернее действие `Остаться в пути` остаётся заметным, но вторичным;
- верхняя и нижняя safe area не перекрывают интерактивные элементы.

Mobile-safe изображения — дизайн-референсы и не входят в runtime bundle.
Фон, герой, текст и controls в production остаются отдельными слоями.

## Логика чисел

Информационная иерархия меняется вместе с задачей игрока:

| Состояние | Главное | Вторичное |
|---|---|---|
| Развилка | свободный запас | шаги за сегодня |
| Выбор | цена каждого пути и остаток после решения | текущий запас |
| Движение | сколько осталось до цели | вложено в переход и шаги за сегодня |
| Прибытие | событие и действие `Открыть событие` | свободный запас и шаги за сегодня |
| Вечер | приглашение к костру | текущий путь и шаги за сегодня |

Запас не показывается как крупный ноль во время активного перехода. Дневной
итог не исчезает, но остаётся спокойным контекстом, а не превращает игру в
фитнес-отчёт.

## Модель выбора

Линии и узлы убраны только с эмоционального главного экрана. На развилке CTA
`Выбрать путь` открывает отдельный полноэкранный выбор с двумя или тремя
атмосферными направлениями, стоимостью, характером пути и точным остатком.
`Показать на карте` остаётся необязательным переходом к функциональной карте.

После подтверждения запас автоматически вкладывается в маршрут по существующим
правилам игры. Игрок возвращается на главный экран, где видит цель и остаток
до неё.

## Prompt set

Режим: built-in GPT Image. Первый экран создан как `generate` по двум
проектным референсам; второй–пятый — отдельные `edit`-проходы для сохранения
единого визуального языка.

Для mobile-safe прохода к каждому состоянию добавлено общее ограничение:

```text
Recompose the approved screen as a native tall portrait iPhone screenshot at approximately 390:844 aspect ratio. Preserve the exact scene, hero identity, Russian copy, hierarchy and visual system. Keep every word, button and navigation label fully inside the narrow safe content column with at least 28 screen pixels of side padding. Scenic artwork may bleed to the edges. Do not crop, wrap or remove any required text. No phone frame, no new UI, no extra text or watermark.
```

Состояния, тексты и запреты остаются теми же, что в prompts `01–05` ниже.

### 01 — развилка

```text
Use case: ui-mockup
Asset type: high-fidelity portrait iPhone game main-screen concept for Shadow Path, full-screen app screenshot without a phone frame.

Primary request: create screen 1 of a coherent three-screen flow, the main journey screen when the hero is standing at a fork and no route has been selected. This redesign is game-first: the available step reserve is the primary number; today's total is a small secondary fact.

Input images:
- Image 1 is the identity reference for the hero "Нечто". Preserve the black flowing amorphous body, large luminous green eyes, gentle vulnerable personality, and integrate it naturally into the scene with no magenta or white source background.
- Image 2 is mood reference only: dark misty forest valley, cold blue-grey dawn, subtle distant silent gothic spire.

Scene/backdrop: immersive painterly dark-fantasy forest clearing with a real natural fork in the terrain, one path disappearing left through ruined stone and one path descending right into mist. Do not draw lines or markers on the paths. The small shadow hero stands at the fork, visibly waiting for the player's decision.

Style/medium: premium contemporary narrative mobile RPG UI, atmospheric painterly illustration, calm editorial typography, matte dark surfaces, restrained warm-gold action accent. Emotional and inviting, not a fitness dashboard and not a generic ornate medieval menu.

Composition/framing: portrait 1024x1536. Respect iPhone safe areas. Top 18% contains a compact secondary daily fact and a clear reserve hierarchy. Middle 57% is immersive art with the hero prominent but not oversized. Bottom 25% contains the narrative prompt, one CTA, and text-only navigation. Strong negative space and high legibility.

Text (verbatim, Russian Cyrillic; render exactly, no extra text):
small secondary line: "СЕГОДНЯ 10 000"
label: "В ЗАПАСЕ"
primary number: "6 240 шагов"
title: "ТРОПА РАСХОДИТСЯ"
supporting line: "Нечто ждёт твоего решения."
primary button: "Выбрать путь"
bottom text navigation only: "Путь   Мир   Лагерь   Герой"

Hierarchy rules: "6 240 шагов" is the dominant data point, but smaller than the hero. "СЕГОДНЯ 10 000" is quiet and secondary. The CTA is obvious but restrained. Use a clean humanist sans for numbers and an elegant restrained serif for the narrative title.

Strict constraints: one screen only, no phone mockup, no route lines, no progress bar, no nodes, no runes, no waypoint dots, no icons, no emoji, no badges, no coins, no XP, no decorative dividers, no ornamental frames, no glass cards, no map overlay, no floating symbols, no icon-only navigation, no watermark. Natural terrain may fork, but there must be no diagrammatic path graphics.
```

### 02 — выбор маршрута

```text
Use case: ui-mockup
Asset type: screen 2 of the same high-fidelity portrait iPhone Shadow Path flow.

Primary request: transform the supplied main journey screen into a dedicated full-screen route chooser that opens after tapping "Выбрать путь". Preserve the exact visual system, world, color palette, painterly quality, typography character, button styling, safe areas, and the identity of the shadow hero. Replace the previous screen content and text with a clear choice between two destinations.

Scene/backdrop: keep the same dark misty valley as a quiet full-screen backdrop. Present two large vertically stacked atmospheric destination panels, each using a painterly crop of a real place rather than an icon: the first shows a broken stone bridge above a ravine; the second shows a low forest trail disappearing into green mist. The small shadow hero may wait quietly near the bottom, but destination comparison is primary.

Composition: portrait 1024x1536, no phone frame. Top has a quiet text-only back action, compact reserve, then the title. Middle contains two large destination panels with generous spacing. The first destination is selected using only a restrained warm-gold border and slightly brighter image. Bottom contains the exact reserve result, one primary CTA, and one quiet text link. No bottom tab navigation on this decision screen.

Text (verbatim, Russian Cyrillic; remove every old UI label and render only this text):
top left: "Назад"
top right: "В запасе 6 240"
title: "КУДА ДАЛЬШЕ?"
first panel title: "ОБВАЛИВШИЙСЯ МОСТ"
first panel cost: "2 800 шагов"
first panel tone: "Короткий · опасный"
second panel title: "НИЗКАЯ ТРОПА"
second panel cost: "4 200 шагов"
second panel tone: "Долгий · тихий"
selected-route result: "Останется 3 440 шагов"
primary button: "Выбрать этот путь"
quiet text link: "Показать на карте"

Interaction clarity: make it unmistakable that the first destination is currently selected and the button confirms it. The cost and remaining reserve must be legible without looking like a finance or fitness dashboard.

Strict constraints: preserve premium contemporary narrative game styling. No route graph, no connecting lines, no progress bars, no map nodes, no waypoint dots, no runes, no icons, no emoji, no badges, no checkmark symbol, no ornamental frames, no glass cards, no floating symbols, no bottom navigation, no extra text, no watermark.
```

### 03 — активный путь

```text
Use case: ui-mockup
Asset type: screen 3 of the same high-fidelity portrait iPhone Shadow Path flow.

Input images:
- Image 1 is the edit target: the main journey screen at the fork.
- Image 2 is a supporting design-system reference: preserve its typography, palette, destination-screen polish, button restraint, and exact hero identity.

Primary request: transform Image 1 into the active-journey state after the player selected a route. Keep it clearly the same application and world, but change the natural scene from a fork to one committed stone trail through misty forest ruins. The hero is moving forward along the trail, not waiting at a junction. There is no free reserve to foreground because steps now automatically feed the active route. The primary information is how many steps remain to the selected destination.

Scene/backdrop: same premium painterly dark fantasy valley, now a single narrow trail curving toward a ruined arch with a faint restrained warm presence beyond it. The shadow hero appears in the lower-middle, smaller than on the fork screen and leaning slightly forward as if travelling. No drawn footsteps, arrows or overlays.

Composition/framing: portrait 1024x1536, full-screen without phone frame, iPhone safe areas. Top 20% contains a small daily fact, destination label, and remaining-step hierarchy. Middle 58% is immersive art and hero movement. Bottom 22% has a short atmospheric sentence, one quiet secondary action, and text-only navigation.

Text (verbatim, Russian Cyrillic; remove all old screen text and render only this text):
small secondary line: "СЕГОДНЯ 10 000"
destination label: "ДО ПЕПЕЛЬНОГО СТРАЖА"
small state label: "ОСТАЛОСЬ"
primary number: "860 шагов"
secondary explanation: "Вложено 3 140 из 4 000"
atmospheric line: "Следы ещё тёплые. Нечто не сворачивает."
quiet action button: "Посмотреть путь"
bottom text navigation only: "Путь   Мир   Лагерь   Герой"

Hierarchy: "860 шагов" is the dominant data point. "СЕГОДНЯ 10 000" is small and quiet. Do not show "В запасе" anywhere. The action button must be dark and restrained with a thin warm-gold edge, not a bright primary CTA, because walking happens automatically.

Strict constraints: preserve the exact hero identity and coherent visual system from both inputs. No route graph, no connecting lines, no progress bar, no map nodes, no waypoint dots, no runes, no icons, no emoji, no badges, no arrows, no decorative dividers, no ornamental frames, no glass cards, no floating symbols, no extra text, no watermark.
```

### 04 — прибытие

```text
Use case: ui-mockup
Asset type: screen 4, arrival-ready state, in the approved high-fidelity portrait iPhone Shadow Path journey flow.

Input images:
- Image 1 is the edit target and primary visual reference: preserve its exact application design system, hero identity, painterly dark-fantasy world, typography hierarchy, text-only navigation and iPhone-safe composition.
- Image 2 is supporting reference for the restrained warm-gold primary button and visual polish.

Primary request: transform the active-journey screen into the moment when the selected destination has just been reached and an encounter is waiting to be opened. The route is complete, so do not show remaining distance or route progress. The event itself is now primary; leftover reserve is secondary.

Scene/backdrop: bring the ruined stone arch much closer and turn it into an encounter threshold. Beneath or just beyond the arch stands a tall, solemn ash-and-stone guardian silhouette, readable as a character but not a horror monster and not an icon. The small shadow hero stands in the lower-middle foreground facing the guardian. Use cold mist, charcoal ruins and one restrained warm light behind the guardian. Preserve emotional tension and the hero's vulnerable personality.

Composition/framing: portrait 1024x1536, full-screen UI without phone frame, respect iPhone safe areas. Top 18% has a small daily fact and quiet arrival status. Middle 58% is the immersive confrontation with the hero and guardian. Bottom 24% contains the event name, one short line, leftover reserve, one obvious primary action and text-only bottom navigation.

Text (verbatim, Russian Cyrillic; remove all old screen text and render only this text):
small secondary line: "СЕГОДНЯ 10 000"
small status: "ТОЧКА ДОСТИГНУТА"
event title: "ПЕПЕЛЬНЫЙ СТРАЖ"
secondary reserve: "В запасе 1 100 шагов"
atmospheric line: "Страж поднял голову."
primary button: "Открыть событие"
bottom text navigation only: "Путь   Мир   Лагерь   Герой"

Hierarchy: the event title and guardian encounter are primary. "В запасе 1 100 шагов" is useful but secondary. Do not show "ОСТАЛОСЬ", "0 шагов", invested progress, a progress bar or route cost. The CTA should use the same restrained matte warm-gold style as the approved route-confirmation button.

Strict constraints: preserve the exact shadow hero identity and coherent visual system. No route graph, no connecting lines, no progress bars, no map nodes, no waypoint dots, no runes, no icons, no emoji, no badges, no arrows, no decorative dividers, no ornate fantasy frame, no glass cards, no floating symbols, no extra text, no watermark.
```

### 05 — вечер

```text
Use case: ui-mockup
Asset type: screen 5, optional evening invitation state, in the approved high-fidelity portrait iPhone Shadow Path journey flow.

Input images:
- Image 1 is the edit target: preserve its exact hero identity, layout rhythm, typography character, text-only navigation and single-route journey context.
- Image 2 is a supporting design-system reference for title scale, warm accent and premium painterly polish only; do not preserve the guardian or arrival content.

Primary request: transform the active-journey screen into a calm evening state that softly invites the player to return to camp without blocking the journey. This is not a modal and not a forced stop. The campfire invitation is primary; the current route remains as one short secondary context line.

Scene/backdrop: the same ruined forest road at blue-black evening. The trail curves toward a small, real campfire sheltered beside low ruined stones in the middle distance; its warm amber light is the main visual beacon but does not overwhelm the scene. The shadow hero stands in the lower-middle foreground, turned slightly toward the campfire as if considering whether to return. No other characters. Preserve the distant dark world and gentle emerald glow of the hero.

Lighting/mood: quiet night, cool charcoal and blue-grey shadows, restrained warm amber firelight, intimate and safe without becoming cheerful or orange. Premium painterly dark fantasy.

Composition/framing: portrait 1024x1536, full-screen UI without phone frame, respect iPhone safe areas. Top 18% contains a small daily fact, quiet time label and current-route context. Middle 58% is immersive evening art with hero and campfire. Bottom 24% contains the invitation title, one short line, one warm primary button, one quiet text alternative and text-only bottom navigation.

Text (verbatim, Russian Cyrillic; remove all old screen text and render only this text):
small secondary line: "СЕГОДНЯ 10 000"
small time label: "ВЕЧЕР"
secondary route context: "До Пепельного стража 860 шагов"
title: "КОСТЁР ЗОВЁТ"
atmospheric line: "Огонь будет ждать до рассвета."
primary button: "Вернуться в лагерь"
quiet text alternative: "Остаться в пути"
bottom text navigation only: "Путь   Мир   Лагерь   Герой"

Hierarchy: the campfire, invitation title and primary button are dominant. Route context and today's total are small and quiet. The primary button uses restrained matte warm gold. "Остаться в пути" must be a clearly readable text action, not a second bright button.

Strict constraints: preserve the exact shadow hero identity and coherent visual system. No modal card, no forced-choice framing, no route graph, no connecting lines, no progress bar, no map nodes, no waypoint dots, no runes, no icons, no emoji, no badges, no arrows, no decorative dividers, no ornate fantasy frame, no glass cards, no floating symbols, no extra text, no watermark.
```

## Следующий gate

Нужно отдельно подтвердить:

1. экран прибытия и приоритет события над числами;
2. вечернее приглашение и возможность `Остаться в пути`;
3. полный mobile-safe набор состояний главного экрана;
4. переход от главного экрана в единую оболочку события.

Production-реализация остаётся заблокирована до явного согласования полного
набора и отдельного согласования оболочки событий.

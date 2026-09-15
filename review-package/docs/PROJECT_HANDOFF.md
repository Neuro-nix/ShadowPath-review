# Shadow Path — current project handoff

Updated: **20 July 2026**.

This is the entry point for a new chat. Read other documents only when the task
requires them.

## Product and stack

`Shadow Path` is a portrait-only iOS walking RPG. Real HealthKit steps move a
small dark-fantasy hero through branching locations, events, memories,
minigames and a growing travelling camp.

- Root: `/Users/rasvetbruskov/Downloads/Shadow path`
- React 19, TypeScript, Vite, Capacitor 8, iOS 15+
- Main UI: `src/App.tsx`, `src/App.css`
- Gameplay data/rules: `src/game/`
- Persistence: Capacitor Preferences in `src/services/storage.ts`
- iOS project: `ios/App/App.xcodeproj`
- Bundle ID: `com.nikita.shadowpath`
- Development team: `BF2XGLBFGT`
- Physical device: `Nikita iphone`, iPhone 16,
  `C5ACFE27-85F7-5D6A-9CAF-516C198A53D8`

Verification:

```bash
npm test
npm run lint
npm run build
npx cap sync ios
```

## Non-negotiable constraints

- Keep the game portrait-only.
- Preserve local saves and old-save normalization.
- Do not rename existing location, node, encounter or minigame IDs.
- Do not change route costs, rewards or minigame thresholds during UI work.
- Route lines, nodes, hero, labels and UI remain code overlays, not baked art.
- Do not replace approved narrative or visual decisions without discussion.
- Outside `silent-ruins`, the legacy UI stays unchanged until its own redesign
  gate.

## Current phase: prologue production shell R1

Journey flow v2 and the unified encounter shell are approved and implemented
for `silent-ruins`.

Implemented:

- Portrait Journey states: fork, destination-card route choice, travel,
  arrival, completion and inline evening return.
- Adaptive step hierarchy: free reserve at a fork, route cost/reserve during
  choice, distance remaining during travel; today's total stays secondary.
- One resumable full-screen encounter shell for point events, ordinary choices,
  memory, lockpicking, connect-3 battle and resolution.
- Pending scenes are reconstructed from existing point/story/lock/battle
  completion ledgers; no `GameSave` field was added.
- Closing an unfinished scene returns to arrival and allows resume.
- Prologue battle resolves in place without the legacy battle-report overlay.
- Existing `MapScreen` remains available both from the fork's `Карта пути` and
  from `Показать на карте` in the route chooser.
- Every prologue destination card has a code-rendered semantic silhouette:
  campfire, grove, road, arch, cache, guard, shrine or spire.
- Legacy modal queue remains active outside the prologue.

Files:

- `src/components/PrologueShell.tsx`
- `src/components/PrologueShell.css`
- `src/components/prologueShellState.ts`
- `design/PROLOGUE_SHELL_PRODUCTION_SPEC.md`
- `design/JOURNEY_FLOW_GPT_IMAGE_V2.md`
- `design/ENCOUNTER_SHELL_GPT_IMAGE_V1.md`

## R1 verification state

Local 390×844 QA covered Journey, route choice/travel/arrival, ordinary choice,
careful crossing, close/resume, resolution and lockpicking layout.

On 20 July 2026:

- `npm test`, `npm run lint` and `npm run build` passed;
- `npx cap sync ios` completed;
- a signed Debug build completed with `xcodebuild`;
- the build was installed over the existing app on `Nikita iphone` without
  uninstalling, preserving its data container;
- the pre-R1 Preferences file was copied before installation and parsed
  successfully.

The first hands-on screenshots found three presentation issues. A follow-up R1
patch added direct map access at the fork, semantic destination figures and a
safe-area-aware local-map header with `Назад к пути` below it. The patch passed
390×844 visual QA, the full automated gate, signed device build, installation
and launch on `Nikita iphone`.

The real old save is a useful compatibility control:

- it is currently in `moss-gate` at `buried-armory`;
- `silent-ruins` is complete with the original seven visited node IDs;
- `forgotten-cache`, `ash-guard` and `memory-falling-world` are complete;
- point-event, lockpicking, battle, story, evolution and world progress use the
  existing keys;
- the hero is `shadowborn` with the prologue shard already claimed.

After the phone was unlocked, CoreDevice launched the installed build
successfully. Preferences copied after launch matched the pre-install backup
for the current world/node, completed locations and nodes, story, lockpicking,
battle, hero, shard and reward ledgers. The real pre-R1 save therefore passes
the structural launch check. The user chose to reset the device progress and
test the redesigned experience from the beginning rather than preserve the old
save on the phone. A full fresh-prologue pass remains.

## Current playable slice

### Ruins by the Silent Spire

- 9 nodes; 7 per playthrough.
- Route cost: approximately `8,700–9,600` steps.
- Optional starter lockpicking at `forgotten-cache`.
- Mandatory story trial plus starter connect-3 at `ash-guard`.
- First memory and first evolution shard before world-map opening.

### Quiet Road

- 11 nodes; 8 per route.
- Route cost: `20,000–21,200` steps.
- Mandatory second memory and a story-gated following branch.

### Moss Gate

- 11 nodes; 9 per route.
- Route cost: `22,500–22,900` steps.
- Third memory grants one of three provisional abilities; later trials test it.

Connector and later-region maps remain playable prototypes. Their exact scope
is recorded in `FIRST_REGION_VERTICAL_SLICE.md`; they add no unapproved canon.

## Working systems outside R1

- HealthKit steps, monotonic same-day credit and refresh on app return.
- Carry-over of free route steps and same-day credit across world travel.
- Local maps, global map, route gates, rewards and developer progress tools.
- Compact point-event cards, choice events, careful crossing and area search.
- Three-pin lockpicking with native iOS haptics.
- Turn-based connect-3 with enemy intent and ability hooks.
- Memories, journal, first evolution shard and `Нечто → Shadowborn → Гуль`.
- Three camp upgrade branches, regional night events and absence summaries.
- Streak/Wayfarer Stone and configurable local reminders.

## Approved design decisions

- The main journey is a living dark diorama, not a fitness dashboard or a
  persistent node graph.
- Route choice is a separate full-screen destination-card flow.
- Every newly reached non-start point should eventually provide a small moment.
- Minigame failure never removes route progress or the base node reward.
- Memories record interpretation of fixed history and do not transform the
  hero directly.
- Coins are the only ordinary spendable currency; shards are rare evolution
  resources.
- The shared evolution trunk is `Нечто → Shadowborn → Гуль → branch choice`.
- Camp growth is a long-term travelling home, not only a three-level shop.
- The current 30-location world map is a navigation prototype and will be
  replaced.

## Project cleanup completed

The 19 July cleanup audit was approved and executed on 20 July:

- removed dated duplicate briefs, chat transcripts and obsolete project
  snapshots;
- removed rejected Journey v1/states prototypes and previews;
- removed obsolete root HTML mockups and old UI/art briefs;
- removed unused `public/icons.svg`, route-node/path PNGs and their dead
  generator code;
- removed the unused 5.9 MB map composite and generated `dist`/`.DS_Store`;
- replaced the Vite template README;
- consolidated permanent rules in `GAME_DESIGN.md` and reduced roadmap history.

Runtime copies of used assets were deliberately kept even when a master source
has identical pixels: `generated-assets` is the source/alpha workspace, while
`public/generated-assets` is the app bundle input.

## Immediate next work

1. Continue the fresh prologue on the newly installed device patch and confirm
   `Карта пути`, destination silhouettes and the corrected map header.
2. Complete the full prologue on the phone, checking ordinary choice, memory,
   three pins, the
   `5×5` battle, close/resume, long text and top/bottom safe areas.
3. If needed, use the prepared unresolved point/story/lock/battle fixtures to
   isolate a resume defect, restoring the real Preferences afterward.
4. Fix only defects found by those checks; preserve save shape, IDs and balance.
5. Repeat test/lint/build/sync/build/install and the affected device scenarios.
6. Choose one R2 screen only after this device gate passes. The local map is a
   likely candidate: preliminary direction is a schematic parchment-like route
   with richer graphic nodes, not a graph laid over location concept art.

The missing dedicated Ash Guard runtime art remains a separate visual task and
does not block R1 shell verification.

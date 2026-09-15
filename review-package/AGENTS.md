# Shadow Path: instructions for new chats

Before working on this project, read `docs/PROJECT_HANDOFF.md`. It is the short,
current source of context. Then open only the documents relevant to the task.

## Reading order

1. `docs/PROJECT_HANDOFF.md` - current state, decisions, next work.
2. `ROADMAP.md` - version goals and priorities.
3. `docs/FIRST_REGION_VERTICAL_SLICE.md` - current playable content and pacing.
4. `docs/GAME_DESIGN.md` - canonical full design, but read only relevant sections.
5. `ShadowPath_lore_memory_canon_2026-06-16.md` - only for lore or story work.
6. `docs/MAP_LAYER_PIPELINE_2026-06-19.md` - only for map art and asset work.
7. `docs/CAMP_UPGRADES.md` - only for camp economy or upgrade work.
8. `docs/MINIGAMES_DESIGN.md` - only for minigame planning or implementation.

Do not search deleted historical drafts or reconstruct old chat transcripts by
default. If an external historical source conflicts with the handoff or
`docs/GAME_DESIGN.md`, use the newer source and mention the conflict.

## Working rules

- Talk to the user in Russian.
- Inspect existing code before changing architecture.
- Recommend starting a fresh chat after a meaningful milestone, after large
  device/build verification, before beginning a new roadmap theme, or when the
  current chat has accumulated enough context that most new work starts with
  summarizing old decisions. Before recommending it, update
  `docs/PROJECT_HANDOFF.md`, tell the user what the next chat should start
  from, and include a ready-to-copy prompt for the new chat.
- Keep the game portrait-only.
- Preserve local saves and existing node IDs when changing maps.
- Route lines, nodes, character and UI are code overlays, not baked into map art.
- Run `npm test`, `npm run lint`, and `npm run build` after gameplay changes.
- Update `docs/PROJECT_HANDOFF.md` and `ROADMAP.md` after a meaningful milestone.
- Do not replace approved narrative or visual decisions without discussing the
  change with the user.

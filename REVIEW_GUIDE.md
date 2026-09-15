# Shadow Path — R1 review package

This repository contains a focused review snapshot of the Shadow Path R1 production shell for the prologue location `silent-ruins`.

Start with:
1. `review-package/docs/PROJECT_HANDOFF.md`
2. `review-package/ROADMAP.md`
3. `review-package/docs/FIRST_REGION_VERTICAL_SLICE.md`
4. `review-package/design/PROLOGUE_SHELL_PRODUCTION_SPEC.md`

Primary implementation:
- `review-package/src/components/PrologueShell.tsx`
- `review-package/src/components/PrologueShell.css`
- `review-package/src/components/prologueShellState.ts`
- `review-package/src/App.tsx`
- `review-package/src/game/`
- `review-package/src/services/storage.ts`
- `review-package/tests/game.test.ts`

Review goals:
- Find real bugs and high-risk issues.
- Check close/resume for unfinished scenes.
- Check old-save compatibility and preservation of IDs, route costs, rewards and thresholds.
- Check portrait-only layout, safe areas, long text and a 390x844 viewport.
- Check that legacy UI outside `silent-ruins` remains intact.
- Review React/TypeScript/CSS structure and test coverage.

Project constraints:
- Do not rename existing location, node, encounter or minigame IDs.
- Do not change save shape or balance without an explicit design decision.
- Preserve local saves and old-save normalization.
- Keep route lines, nodes, hero and UI as code overlays.
- Keep the game portrait-only.
- Do not propose a broad rewrite without evidence.

Suggested commands in the original project:
```bash
npm test
npm run lint
npm run build
```

Please report findings by severity, with file path, approximate line, cause and concrete fix. Do not edit files during review.

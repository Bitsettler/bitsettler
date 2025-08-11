# BitSettler – Cursor Rules (Session Rails)

## Allowed edit zones
- Engine v2: `src/lib/depv2/**`
- UI for engine v2: `src/components/depv2/**`
- Dev/demo pages: `src/app/dev/depv2/**`

Everything else is **read‑only** unless I explicitly say otherwise.

## Stack & conventions
- Next.js (App Router) + TypeScript (strict), shadcn/ui + Tailwind.
- Keep lists virtualized when >200 rows.
- Memoize heavy selectors and use an LRU cache (size 500) for calc results.
- Dark theme must match shadcn defaults.

## Domain rules (BitCraft)
- If no recipe produces an item → treat it as a **base** material.
- Ignore placeholder names `{0}`/`{1}`; display `#<id>`.
- Malformed rows (e.g., `output_item: [0, {}]`) → skip gracefully.
- Steps = total recipe applications in the expansion.

## Performance targets
- Build recipe/item indexes **once** per session.
- Cold run < 300ms on deep trees; warm (cached) < 50ms.

## Testing
- Vitest: edge cases (missing recipe, shared sub‑inputs, cycles, output qty > 1).
- If a legacy calculator exists, use it **only for parity tests** (don’t import it into production paths).

## Session kickoff script (what to tell Cursor, every time)
Follow CURSOR_RULES.md. Open only the files I list. Ask before opening anything else. Show me the diff, then stop.

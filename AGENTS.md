# KnightPrep Agent Guide

## Project Identity

KnightPrep is a desktop chess training app built with Tauri, React, TypeScript, Vite, and Tailwind CSS. It should feel like Anki for chess: users review chess "cards" by making actual moves on an interactive board, receive correct/incorrect feedback, and then grade the review so the app can decide when the card should be shown again.

This project is currently a v1 product, so prefer focused, shippable workflows over broad speculative systems. Build toward a serious chess study tool that helps players memorize openings, gambits, tactics, and user-created decks through repeated board interaction.

## Core Product Direction

- The review loop is central. A user studies a card, answers by moving a piece, sees whether the move was right or wrong, then grades the card with options such as Again, Hard, Good, or Easy.
- Scheduling should account for both objective performance and subjective difficulty. Whether the answer was correct or incorrect and whether the user marks it easy, hard, etc. should both affect the next review date.
- Openings need a dedicated mode where users choose an opening, step through variations, and train each branch until the move order is committed to memory.
- Gambits need a dedicated section, but gambits may also appear inside openings. Model this as overlapping categories/tags, not mutually exclusive modes.
- Users should be able to upload their own decks. Treat deck import/export and user-generated study content as first-class v1 concerns, even if the initial implementation is small.
- Tactics remain part of the product, but do not let tactics-only assumptions leak into openings or deck-review logic.

## Existing App Shape

The current app uses:

- `src/App.tsx` for the root layout, active navigation state, panel resize state, and the current mock card.
- `src/types.ts` for shared TypeScript types.
- `src/mockData.ts` for temporary card and activity data.
- `src/components/Sidebar.tsx` for navigation and daily summary.
- `src/components/Header.tsx` for search, streak, level, notifications, and user controls.
- `src/components/CardArea.tsx` for the main study surface and board answer flow.
- `src/components/ChessBoard.tsx` for interactive board input.
- `src/components/RightPanel.tsx` for explanation, moves, themes, and notes.
- `src/hooks/useResize.ts` for resizable/collapsible panes.
- `src/utils/chess.ts` for FEN parsing and piece helpers.
- `src-tauri/` for the Tauri v2 Rust desktop shell.

## Visual Style

Respect the current homepage/application style when creating new screens:

- Keep the app feeling like a polished desktop productivity tool: restrained, crisp, and information-dense.
- Preserve the three-pane mental model where it makes sense: navigation, study/work area, and contextual details.
- Use the existing light UI foundation: `#f8f9fb` page background, white panels, subtle gray borders, soft shadows, blue active states, gray body text, and small dense typography.
- Keep rounded corners modest, generally `rounded-lg` or `rounded-xl` where the current UI already uses them.
- Use Lucide React icons for controls and navigation when an icon exists.
- Favor compact toolbars, tabs, segmented controls, badges, and side panels over marketing-style hero sections or decorative layouts.
- Style Openings, Gambits, Decks, Review, Progress, and Settings pages as natural extensions of the current interface, not as separate visual experiments.
- Make chess-specific surfaces clear and inspectable. Boards, move lists, variations, tags, and explanations should be easy to scan.

## Data And Domain Modeling Guidance

- Represent cards independently from decks so the same card can belong to multiple collections or modes.
- Prefer tags/categories for overlaps such as `Opening`, `Gambit`, `Tactic`, `Endgame`, and named openings.
- Represent openings as trees or variation graphs rather than flat strings once real opening training is introduced.
- Store moves in a form that can support validation, display, and progression. SAN is useful for display, while from/to squares or UCI-style move data are useful for interaction.
- Preserve enough chess position state to validate moves reliably. FEN is already used and should remain part of card/position data.
- Keep scheduling metadata separate from the chess content so imported decks and shared opening lines are not coupled to one user's review history.
- Expect future persistence through Tauri-backed local storage or a database. Avoid burying important domain state in React-only component state when it will need to persist.

## Spaced Repetition Guidance

The v1 scheduler does not need to be perfect, but it should be explainable and deterministic.

- Track at least: last reviewed time, next due time, interval, ease/difficulty factor, lapse count, review count, last result, and last rating.
- Correct answers should generally move a card farther into the future, with Easy increasing the interval more than Good, and Hard keeping it closer.
- Incorrect answers should count as a lapse and bring the card back sooner, even if the user marks the card as familiar.
- The UI should make review consequences legible enough that users trust the system.
- Keep scheduler logic in a dedicated module when implemented, with tests around interval updates and edge cases.

## Implementation Preferences

- Use React 18, TypeScript, Tailwind CSS, and the project's existing component style.
- Keep shared domain types in `src/types.ts` until they become large enough to justify splitting by domain.
- Prefer small focused components over adding large feature blobs to `App.tsx`.
- Keep mock data realistic and structured so it can evolve into persisted data.
- Use accessible buttons and form controls with clear focus and hover states.
- Avoid introducing new UI libraries unless there is a strong reason.
- Avoid large architectural rewrites while the product shape is still forming.

## Commands

- Install dependencies: `npm install`
- Web dev server: `npm run dev`
- Typecheck: `npm run typecheck`
- Build web app: `npm run build`
- Tauri dev app: `npm run tauri dev`
- Tauri desktop build: `npm run tauri build`

Run `npm run typecheck` after TypeScript changes. Run `npm run build` when touching app wiring, imports, config, or anything likely to affect bundling.

## Quality Bar

- Keep review behavior, card state, and scheduling logic easy to reason about.
- Test pure scheduler or chess-domain functions when adding them.
- Verify key UI flows manually in the browser or Tauri dev app when changing interaction behavior.
- Do not break the current resizable/collapsible sidebar and right panel behavior.
- New pages should remain usable at desktop widths and should not overflow or hide primary controls.

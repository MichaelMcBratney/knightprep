# KnightPrep

A chess flashcard trainer desktop app built with **Tauri + React + TypeScript + Vite + Tailwind CSS**.

Study chess openings, gambits, and tactics by answering flashcards with actual piece moves on an interactive board — like Anki, but for chess.

## Features

- Interactive chess board — drag or click pieces to answer
- Move validation with correct/incorrect feedback and explanations
- Resizable and collapsible left sidebar and right panel
- 3-pane layout: Navigation | Study board | Explanation & move order
- Mock flashcard deck with openings, gambits, and tactics
- Activity calendar, streak tracker, XP level ring

## Tech Stack

- [Tauri v2](https://tauri.app) — native desktop shell (targets Windows .exe)
- [React 18](https://react.dev) + [TypeScript](https://www.typescriptlang.org)
- [Vite 5](https://vitejs.dev)
- [Tailwind CSS v3](https://tailwindcss.com)
- [Lucide React](https://lucide.dev) icons

## Getting Started

### Web preview (no Rust required)

```bash
npm install
npm run dev
```

### Desktop build (requires Rust)

1. Install [Rust](https://rustup.rs)
2. Run:

```bash
npm install
npm run tauri dev      # development
npm run tauri build    # produces installer in src-tauri/target/release/bundle/
```

The Windows NSIS installer will appear at `src-tauri/target/release/bundle/nsis/`.

## Project Structure

```
src/
  App.tsx                  # Root layout, resize state
  types.ts                 # Shared TypeScript types
  mockData.ts              # Flashcard mock data
  components/
    Sidebar.tsx            # Left nav panel
    Header.tsx             # Top bar (search, streak, level, user)
    CardArea.tsx           # Main study area with chess board
    ChessBoard.tsx         # Interactive 8x8 board (drag + click)
    RightPanel.tsx         # Explanation, moves, themes, notes tabs
    ResizeHandle.tsx       # Drag handle between panes
  hooks/
    useResize.ts           # Resize + collapse logic
  utils/
    chess.ts               # FEN parser, piece symbols
src-tauri/                 # Tauri Rust shell
```

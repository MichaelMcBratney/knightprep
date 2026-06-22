export type PieceType = 'K' | 'Q' | 'R' | 'B' | 'N' | 'P';
export type PieceColor = 'w' | 'b';

export interface Piece {
  type: PieceType;
  color: PieceColor;
}

export type BoardState = (Piece | null)[][];

export interface MoveOrderEntry {
  white: string;
  black: string;
}

export interface FlashCard {
  id: number;
  total: number;
  tags: string[];
  question: string;
  positionDescription: string;
  tip: string;
  boardFen: string;
  correctMove: string;
  correctMoveFrom: string;
  correctMoveTo: string;
  correctMoveAlgebraic: string;
  evaluation: string;
  explanation: string;
  idea: string;
  moveOrder: MoveOrderEntry[];
  highlightSquares: string[];
  currentMoveIndex: number;
}

export type NavItem = 'Dashboard' | 'Openings' | 'Gambits' | 'Tactics' | 'Decks' | 'Review' | 'Progress' | 'Settings';
export type RightTab = 'Explanation' | 'Moves' | 'Themes' | 'Notes';

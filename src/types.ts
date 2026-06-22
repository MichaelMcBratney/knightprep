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

export type OpeningSide = 'White' | 'Black';
export type OpeningRating = 'again' | 'hard' | 'good' | 'easy';
export type OpeningResult = 'correct' | 'incorrect';
export type OpeningCategory = 'Opening' | 'Gambit' | 'Tactic' | 'Endgame' | 'Imported' | 'Repertoire' | 'Other';

export interface OpeningVariationNode {
  id: string;
  fen: string;
  moveNumber: number;
  sideToMove: PieceColor;
  prompt: string;
  expectedMoveSan: string;
  expectedMoveFrom: string;
  expectedMoveTo: string;
  opponentReplySan?: string;
  opponentReplyFrom?: string;
  opponentReplyTo?: string;
  opponentReplyFen?: string;
  incomingMoveSan?: string;
  idea: string;
  explanation: string;
  tags: string[];
  branches: OpeningVariationNode[];
}

export interface OpeningNodeProgress {
  nodeId: string;
  attempts: number;
  correct: number;
  missed: number;
  streak: number;
  due: boolean;
  mastery: number;
  intervalDays: number;
  ease: number;
  lapses: number;
  lastTrainedAt?: string;
  nextDueAt?: string;
  lastResult?: OpeningResult;
  lastRating?: OpeningRating;
}

export interface OpeningMoveHistoryEntry {
  id: string;
  nodeId: string;
  san: string;
  actor: 'user' | 'opponent';
  result?: OpeningResult;
  fen: string;
}

export interface ImportedOpeningLine {
  id: string;
  name: string;
  rawPgn: string;
  moves: string[];
  tags: string[];
  errors: string[];
  importedAt: string;
}

export interface OpeningRepertoire {
  id: string;
  name: string;
  eco: string;
  side: OpeningSide;
  family: string;
  description: string;
  tags: string[];
  totalPositions: number;
  duePositions: number;
  accuracy: number;
  mastery: number;
  root: OpeningVariationNode;
}

export type OpeningProgressMap = Record<string, OpeningNodeProgress>;

export interface OpeningLineMove {
  nodeId: string;
  san: string;
  moveNumber: number;
  sideToMove: PieceColor;
}

export interface GeneratedOpeningReviewCard {
  id: string;
  openingId: string;
  openingName: string;
  eco: string;
  family: string;
  side: OpeningSide;
  nodeId: string;
  prompt: string;
  boardFen: string;
  correctMove: string;
  correctMoveFrom: string;
  correctMoveTo: string;
  explanation: string;
  idea: string;
  tags: string[];
  categories: OpeningCategory[];
  path: OpeningLineMove[];
  dueAt: string;
  priority: number;
  progress?: OpeningNodeProgress;
}

export interface OpeningLibraryFilters {
  search?: string;
  side?: OpeningSide | 'All';
  categories?: OpeningCategory[];
  tags?: string[];
  dueOnly?: boolean;
  weakOnly?: boolean;
  importedOnly?: boolean;
  minMastery?: number;
  maxMastery?: number;
}

export interface OpeningSummaryBucket {
  id: string;
  label: string;
  category?: OpeningCategory;
  openingCount: number;
  positionCount: number;
  trainedCount: number;
  dueCount: number;
  weakCount: number;
  averageMastery: number;
  averageAccuracy: number;
  tags: string[];
}

export interface OpeningWeakBranchSummary {
  openingId: string;
  openingName: string;
  eco: string;
  family: string;
  side: OpeningSide;
  nodeId: string;
  moveSan: string;
  prompt: string;
  path: OpeningLineMove[];
  tags: string[];
  attempts: number;
  missed: number;
  lapses: number;
  streak: number;
  accuracy: number;
  mastery: number;
  dueAt?: string;
  weaknessScore: number;
  reasons: string[];
}

export interface OpeningRepertoireStats {
  openingId: string;
  name: string;
  eco: string;
  family: string;
  side: OpeningSide;
  tags: string[];
  categories: OpeningCategory[];
  totalPositions: number;
  trainedPositions: number;
  newPositions: number;
  duePositions: number;
  weakPositions: number;
  masteredPositions: number;
  averageMastery: number;
  averageAccuracy: number;
  reviewCount: number;
  lapseCount: number;
  coverage: number;
  recommendedNodeId?: string;
}

export interface OpeningRepertoireChoice {
  openingId: string;
  name: string;
  eco: string;
  family: string;
  side: OpeningSide;
  description: string;
  tags: string[];
  categories: OpeningCategory[];
  stats: OpeningRepertoireStats;
  recommendation: 'review-due' | 'repair-weakness' | 'learn-new' | 'maintain';
  recommendedNodeId?: string;
}

export interface OpeningProgressDashboardStats {
  totalOpenings: number;
  totalPositions: number;
  trainedPositions: number;
  newPositions: number;
  duePositions: number;
  weakPositions: number;
  masteredPositions: number;
  averageMastery: number;
  averageAccuracy: number;
  reviewCount: number;
  lapseCount: number;
  sideSummaries: OpeningSummaryBucket[];
  categorySummaries: OpeningSummaryBucket[];
  tagSummaries: OpeningSummaryBucket[];
  weakestBranches: OpeningWeakBranchSummary[];
  dueQueue: GeneratedOpeningReviewCard[];
}

export interface OpeningReviewInput {
  openingId: string;
  nodeId: string;
  result: OpeningResult;
  rating: OpeningRating;
  reviewedAt: string;
}

export interface OpeningDuePosition {
  openingId: string;
  openingName: string;
  node: OpeningVariationNode;
  progress?: OpeningNodeProgress;
  dueAt: string;
  priority: number;
}

export interface OpeningNote {
  id: string;
  openingId: string;
  nodeId?: string;
  body: string;
  createdAt: string;
  updatedAt: string;
}

export type OpeningNoteStore = Record<string, OpeningNote>;

import { BoardState, Piece, PieceColor, PieceType } from '../types';

const pieceMap: Record<string, Piece> = {
  K: { type: 'K', color: 'w' }, Q: { type: 'Q', color: 'w' },
  R: { type: 'R', color: 'w' }, B: { type: 'B', color: 'w' },
  N: { type: 'N', color: 'w' }, P: { type: 'P', color: 'w' },
  k: { type: 'K', color: 'b' }, q: { type: 'Q', color: 'b' },
  r: { type: 'R', color: 'b' }, b: { type: 'B', color: 'b' },
  n: { type: 'N', color: 'b' }, p: { type: 'P', color: 'b' },
};

export function fenToBoard(fen: string): BoardState {
  const board: BoardState = Array(8).fill(null).map(() => Array(8).fill(null));
  const rows = fen.split(' ')[0].split('/');
  for (let rank = 0; rank < 8; rank++) {
    let file = 0;
    for (const ch of rows[rank]) {
      if (ch >= '1' && ch <= '8') { file += parseInt(ch); }
      else { board[rank][file] = pieceMap[ch] || null; file++; }
    }
  }
  return board;
}

export function squareToCoords(square: string): [number, number] {
  return [8 - parseInt(square[1]), square.charCodeAt(0) - 'a'.charCodeAt(0)];
}

export function coordsToSquare(rank: number, file: number): string {
  return String.fromCharCode('a'.charCodeAt(0) + file) + (8 - rank);
}

export function getPieceSymbol(piece: Piece): string {
  const symbols: Record<PieceType, Record<PieceColor, string>> = {
    K: { w: '♔', b: '♚' }, Q: { w: '♕', b: '♛' },
    R: { w: '♖', b: '♜' }, B: { w: '♗', b: '♝' },
    N: { w: '♘', b: '♞' }, P: { w: '♙', b: '♟' },
  };
  return symbols[piece.type][piece.color];
}

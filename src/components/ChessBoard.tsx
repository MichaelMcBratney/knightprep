import React, { useState, useCallback } from 'react';
import { BoardState } from '../types';
import { getPieceSymbol } from '../utils/chess';

interface ChessBoardProps {
  board: BoardState;
  highlightSquares: string[];
  correctFrom: string;
  correctTo: string;
  onMove: (from: string, to: string) => void;
  answered: boolean;
}

export default function ChessBoard({ board, highlightSquares, correctFrom, correctTo, onMove, answered }: ChessBoardProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);

  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

  const getSquareStyle = (square: string, rank: number, file: number): string => {
    const isLight = (rank + file) % 2 === 0;
    let base = isLight ? 'bg-[#f0d9b5]' : 'bg-[#b58863]';
    if (selected === square) base = 'bg-yellow-300';
    else if (dragOver === square) base = isLight ? 'bg-yellow-200' : 'bg-yellow-400';
    else if (answered && (square === correctFrom || square === correctTo)) base = 'bg-[#aed581]';
    else if (highlightSquares.includes(square)) base = isLight ? 'bg-[#cdd26a]' : 'bg-[#aaa23a]';
    return base;
  };

  const handleSquareClick = useCallback((square: string) => {
    if (answered) return;
    const piece = board[8 - parseInt(square[1])][square.charCodeAt(0) - 97];
    if (selected) {
      if (selected === square) { setSelected(null); return; }
      onMove(selected, square); setSelected(null);
    } else if (piece) { setSelected(square); }
  }, [selected, board, onMove, answered]);

  const handleDragStart = (e: React.DragEvent, square: string) => {
    if (answered || !board[8 - parseInt(square[1])][square.charCodeAt(0) - 97]) return;
    setDragging(square); setSelected(null);
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="select-none">
      <div className="flex">
        <div className="flex flex-col" style={{ width: 20 }}>
          {ranks.map((r) => <div key={r} className="flex items-center justify-center text-[11px] font-semibold text-[#7a6a52]" style={{ height: 50 }}>{r}</div>)}
        </div>
        <div className="border border-[#8b7355] shadow-lg" style={{ width: 400, height: 400 }}>
          {ranks.map((rank, ri) => (
            <div key={rank} className="flex" style={{ height: 50 }}>
              {files.map((file, fi) => {
                const sq = file + rank;
                const piece = board[ri][fi];
                return (
                  <div
                    key={sq}
                    data-square={sq}
                    role="button"
                    aria-label={`${sq}${piece ? ` ${piece.color === 'w' ? 'white' : 'black'} ${piece.type}` : ''}`}
                    className={`relative flex items-center justify-center cursor-pointer transition-colors duration-100 ${getSquareStyle(sq, ri, fi)}`}
                    style={{ width: 50, height: 50 }}
                    onClick={() => handleSquareClick(sq)}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(sq); }}
                    onDrop={(e) => { e.preventDefault(); if (dragging && dragging !== sq) onMove(dragging, sq); setDragging(null); setDragOver(null); }}
                  >
                    {selected && selected !== sq && !piece && <div className="absolute w-3 h-3 rounded-full bg-black/20 pointer-events-none" />}
                    {piece && (
                      <div
                        draggable={!answered}
                        onDragStart={(e) => handleDragStart(e, sq)}
                        onDragEnd={() => { setDragging(null); setDragOver(null); }}
                        className={`leading-none transition-opacity ${dragging === sq ? 'opacity-30' : 'opacity-100'}`}
                        style={{ cursor: answered ? 'default' : 'grab', userSelect: 'none', fontSize: 36, textShadow: piece.color === 'w' ? '0 1px 3px rgba(0,0,0,0.5)' : '0 1px 2px rgba(0,0,0,0.3)' }}
                      >
                        {getPieceSymbol(piece)}
                      </div>
                    )}
                    {fi === 0 && <span className="absolute top-0.5 left-0.5 text-[9px] font-bold text-[#7a6a52] leading-none">{rank}</span>}
                    {ri === 7 && <span className="absolute bottom-0.5 right-1 text-[9px] font-bold text-[#7a6a52] leading-none">{file}</span>}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <div className="flex" style={{ paddingLeft: 20 }}>
        {files.map((f) => <div key={f} className="flex items-center justify-center text-[11px] font-semibold text-[#7a6a52]" style={{ width: 50, height: 20 }}>{f}</div>)}
      </div>
    </div>
  );
}

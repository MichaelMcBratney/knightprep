import React, { useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Clock, Bookmark, MoreHorizontal, Lightbulb, CheckCircle2, XCircle, Eye } from 'lucide-react';
import { FlashCard } from '../types';
import ChessBoard from './ChessBoard';
import { fenToBoard } from '../utils/chess';

interface CardAreaProps {
  card: FlashCard;
  cardIndex: number;
  onNext: () => void;
  onPrev: () => void;
}

type AnswerState = 'unanswered' | 'correct' | 'incorrect';

export default function CardArea({ card, cardIndex, onNext, onPrev }: CardAreaProps) {
  const [answerState, setAnswerState] = useState<AnswerState>('unanswered');
  const [moveInput, setMoveInput] = useState('');

  const board = fenToBoard(card.boardFen);
  const progress = (cardIndex / card.total) * 100;

  const handleMove = useCallback((from: string, to: string) => {
    if (answerState !== 'unanswered') return;
    setMoveInput(`${from}–${to}`);
    setAnswerState(from === card.correctMoveFrom && to === card.correctMoveTo ? 'correct' : 'incorrect');
  }, [answerState, card.correctMoveFrom, card.correctMoveTo]);

  const handleNext = () => { setAnswerState('unanswered'); setMoveInput(''); onNext(); };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#f8f9fb]">
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-4 flex-shrink-0">
        <button onClick={onPrev} className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"><ChevronLeft size={16} className="text-gray-500" /></button>
        <button onClick={handleNext} className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"><ChevronRight size={16} className="text-gray-500" /></button>
        <span className="text-[13px] font-semibold text-gray-700">Card {cardIndex} of {card.total}</span>
        <div className="flex-1 max-w-[200px] h-2 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
        <div className="flex-1" />
        <button className="flex items-center gap-1.5 text-[12px] text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg px-3 py-1.5 font-medium">
          <Clock size={13} />Due today
        </button>
        <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-50"><Bookmark size={16} className="text-gray-400" /></button>
        <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-50"><MoreHorizontal size={16} className="text-gray-400" /></button>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex gap-6">
          <div className="flex-shrink-0">
            <ChessBoard
              board={board}
              highlightSquares={answerState === 'unanswered' ? card.highlightSquares : []}
              correctFrom={answerState !== 'unanswered' ? card.correctMoveFrom : ''}
              correctTo={answerState !== 'unanswered' ? card.correctMoveTo : ''}
              onMove={handleMove}
              answered={answerState !== 'unanswered'}
            />
            <div className="mt-3 bg-white rounded-xl border border-gray-200 px-4 py-3 flex items-center gap-3 shadow-sm">
              <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-500"><path d="M9 12h6M12 9v6" /><circle cx="12" cy="12" r="9" /></svg>
              </div>
              <div className="flex-1">
                <div className="text-[13px] font-semibold text-gray-800">Your turn — make the best move for White</div>
                <div className="text-[11px] text-gray-400 mt-0.5">Drag a piece or click a piece and destination square.</div>
              </div>
              {moveInput ? (
                <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5">
                  <span className="text-[13px] font-mono font-semibold text-gray-700">{moveInput}</span>
                  {answerState === 'correct' && <CheckCircle2 size={14} className="text-green-500" />}
                  {answerState === 'incorrect' && <XCircle size={14} className="text-red-500" />}
                </div>
              ) : <span className="text-[12px] text-gray-300 font-medium">Move input</span>}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex gap-2 mb-4">
              {card.tags.map((tag) => (
                <span key={tag} className={`text-[12px] font-semibold px-3 py-1 rounded-full flex items-center gap-1.5 ${
                  tag === 'Opening' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'
                }`}>
                  {tag === 'Opening' ? (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>
                  ) : (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                  )}
                  {tag}
                </span>
              ))}
            </div>
            <h2 className="text-[22px] font-bold text-gray-900 leading-tight mb-3">{card.question}</h2>
            <p className="text-[13px] text-gray-500 mb-4">{card.positionDescription}</p>
            <div className="flex flex-wrap gap-2 mb-5">
              {["Queen's Gambit", 'Accepted', 'Main Line', 'Opening', 'Positional'].map((t) => (
                <span key={t} className="text-[12px] bg-white border border-gray-200 text-gray-600 px-2.5 py-1 rounded-lg">{t}</span>
              ))}
            </div>
            <div className="flex items-start gap-2 mb-5">
              <Lightbulb size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
              <span className="text-[12px] text-gray-500">{card.tip}</span>
            </div>
            {answerState === 'correct' && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
                <div className="flex items-center gap-2 mb-2"><CheckCircle2 size={18} className="text-green-600" /><span className="text-[14px] font-bold text-green-800">Correct — {card.correctMove} is the best move!</span></div>
                <p className="text-[12px] text-green-700 leading-relaxed mb-3">Well done! This supports the d4 pawn and develops the light-squared bishop.</p>
                <button onClick={handleNext} className="w-full bg-white border border-green-300 rounded-lg py-2 text-[12px] font-semibold text-green-700 hover:bg-green-50 transition-colors flex items-center justify-center gap-2"><Eye size={14} />View Explanation</button>
              </div>
            )}
            {answerState === 'incorrect' && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
                <div className="flex items-center gap-2 mb-2"><XCircle size={18} className="text-red-600" /><span className="text-[14px] font-bold text-red-800">Not quite — the best move was {card.correctMove}</span></div>
                <p className="text-[12px] text-red-700 leading-relaxed mb-3">{card.explanation}</p>
                <button onClick={handleNext} className="w-full bg-white border border-red-300 rounded-lg py-2 text-[12px] font-semibold text-red-700 hover:bg-red-50 transition-colors flex items-center justify-center gap-2"><ChevronRight size={14} />Next Card</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

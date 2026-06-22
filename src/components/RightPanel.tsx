import React from 'react';
import { Star, Zap, Play, Grid, Share2, ChevronsRight } from 'lucide-react';
import { FlashCard, RightTab } from '../types';

interface RightPanelProps {
  card: FlashCard;
  activeTab: RightTab;
  onTabChange: (tab: RightTab) => void;
  onCollapse: () => void;
}

const tabs: RightTab[] = ['Explanation', 'Moves', 'Themes', 'Notes'];

export default function RightPanel({ card, activeTab, onTabChange, onCollapse }: RightPanelProps) {
  return (
    <div className="w-full bg-white border-l border-gray-200 flex flex-col h-full overflow-hidden">
      <div className="flex items-stretch border-b border-gray-200 flex-shrink-0">
        {tabs.map((tab) => (
          <button key={tab} onClick={() => onTabChange(tab)}
            className={`flex-1 py-3 text-[12px] font-semibold transition-colors relative whitespace-nowrap ${
              activeTab === tab ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab}
            {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-600 rounded-t" />}
          </button>
        ))}
        <button onClick={onCollapse} title="Collapse panel" className="flex-shrink-0 px-2.5 flex items-center justify-center border-l border-gray-100 hover:bg-gray-50 transition-colors">
          <ChevronsRight size={14} className="text-gray-400" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'Explanation' && <ExplanationTab card={card} />}
        {activeTab === 'Moves' && <MovesTab card={card} />}
        {activeTab === 'Themes' && <ThemesTab card={card} />}
        {activeTab === 'Notes' && <NotesTab />}
      </div>
      <div className="border-t border-gray-200 px-4 py-3 flex items-center gap-3 flex-shrink-0">
        <button className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-semibold text-[12px] transition-colors">
          <Play size={13} className="fill-blue-600" />Play Position
        </button>
        <div className="flex-1" />
        <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100"><Grid size={16} className="text-gray-400" /></button>
        <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100"><Share2 size={16} className="text-gray-400" /></button>
      </div>
    </div>
  );
}

function ExplanationTab({ card }: { card: FlashCard }) {
  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-2 mb-1"><Star size={14} className="text-yellow-500 fill-yellow-400" /><span className="text-[13px] font-bold text-gray-800">Answer by move</span></div>
        <div className="flex items-center gap-2 text-[12px] text-gray-500">
          <span>Move validation: On</span>
          <span className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
            <svg width="8" height="6" viewBox="0 0 8 6" fill="none"><path d="M1 3l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </span>
        </div>
      </div>
      <div className="h-px bg-gray-100" />
      <div>
        <div className="flex items-center gap-2 mb-2"><Star size={14} className="text-yellow-500 fill-yellow-400" /><span className="text-[13px] font-bold text-gray-800">Best Move</span></div>
        <div className="flex items-center gap-3 mb-3">
          <span className="text-2xl font-bold text-gray-900">{card.correctMove}</span>
          <span className="text-[11px] font-semibold bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{card.evaluation}</span>
        </div>
        <p className="text-[12px] text-gray-600 leading-relaxed">{card.explanation}</p>
      </div>
      <div className="h-px bg-gray-100" />
      <div>
        <div className="flex items-center gap-2 mb-2"><Zap size={14} className="text-gray-400" /><span className="text-[13px] font-bold text-gray-800">Idea</span></div>
        <p className="text-[12px] text-gray-600 leading-relaxed">{card.idea}</p>
      </div>
      <div className="h-px bg-gray-100" />
      <div>
        <div className="text-[13px] font-bold text-gray-800 mb-3">Move Order</div>
        {card.moveOrder.map((entry, i) => {
          const hl = i === card.currentMoveIndex;
          return (
            <div key={i} className={`flex items-center rounded px-2 py-1 ${hl ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
              <span className="text-[12px] text-gray-400 w-5 flex-shrink-0">{i + 1}.</span>
              <span className={`text-[12px] font-medium flex-1 ${hl ? 'text-blue-600 font-semibold' : 'text-gray-700'}`}>{entry.white}</span>
              <span className={`text-[12px] flex-1 ${hl ? 'text-blue-600 font-semibold' : 'text-gray-600'}`}>{entry.black}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MovesTab({ card }: { card: FlashCard }) {
  return (
    <div>
      <div className="text-[13px] font-bold text-gray-800 mb-3">Full Move List</div>
      {card.moveOrder.map((entry, i) => (
        <div key={i} className="flex items-center px-2 py-1.5 rounded hover:bg-gray-50">
          <span className="text-[12px] text-gray-400 w-5">{i + 1}.</span>
          <span className="text-[12px] font-medium text-gray-700 flex-1">{entry.white}</span>
          <span className="text-[12px] text-gray-600 flex-1">{entry.black}</span>
        </div>
      ))}
    </div>
  );
}

function ThemesTab({ card }: { card: FlashCard }) {
  return (
    <div>
      <div className="text-[13px] font-bold text-gray-800 mb-3">Opening Themes</div>
      <div className="flex flex-wrap gap-2">
        {card.tags.concat(['Central Control', 'Development', 'King Safety', 'Pawn Structure']).map((tag) => (
          <span key={tag} className="text-[12px] bg-gray-100 text-gray-600 px-3 py-1 rounded-full">{tag}</span>
        ))}
      </div>
      <div className="mt-4 text-[12px] text-gray-500 leading-relaxed">This position features classic themes from the selected opening. Mastering the thematic ideas here will help you navigate similar positions in your games.</div>
    </div>
  );
}

function NotesTab() {
  return (
    <div>
      <div className="text-[13px] font-bold text-gray-800 mb-3">Your Notes</div>
      <textarea className="w-full h-48 text-[12px] text-gray-700 bg-gray-50 border border-gray-200 rounded-lg p-3 resize-none outline-none focus:border-blue-400 focus:bg-white transition-colors" placeholder="Add your personal notes for this card..." />
      <button className="mt-2 w-full py-2 bg-blue-600 text-white text-[12px] font-semibold rounded-lg hover:bg-blue-700 transition-colors">Save Notes</button>
    </div>
  );
}

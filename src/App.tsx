import { useState } from 'react';
import { NavItem, RightTab } from './types';
import { mockCards } from './mockData';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import CardArea from './components/CardArea';
import RightPanel from './components/RightPanel';
import ResizeHandle from './components/ResizeHandle';
import OpeningsPage from './components/OpeningsPage';
import { useResize } from './hooks/useResize';

export default function App() {
  const [activeNav, setActiveNav] = useState<NavItem>('Dashboard');
  const [activeTab, setActiveTab] = useState<RightTab>('Explanation');
  const [cardIndex, setCardIndex] = useState(0);

  const sidebar = useResize({ initial: 260, min: 160, max: 380, direction: 'right', collapseThreshold: 80 });
  const rightPanel = useResize({ initial: 320, min: 200, max: 480, direction: 'left', collapseThreshold: 80 });

  const card = mockCards[cardIndex % mockCards.length];
  const handleNext = () => setCardIndex((i) => (i + 1) % mockCards.length);
  const handlePrev = () => setCardIndex((i) => (i - 1 + mockCards.length) % mockCards.length);

  return (
    <div className="flex h-screen w-screen bg-[#f8f9fb] overflow-hidden font-sans select-none">
      {!sidebar.collapsed && (
        <div style={{ width: sidebar.width }} className="flex-shrink-0 h-full overflow-hidden">
          <Sidebar active={activeNav} onNavigate={setActiveNav} onCollapse={sidebar.collapse} />
        </div>
      )}

      <ResizeHandle onMouseDown={sidebar.onMouseDown} onDoubleClick={sidebar.toggle} />

      {sidebar.collapsed && (
        <CollapsedTab side="left" onClick={sidebar.expand} label="Navigation" />
      )}

      <div className="flex flex-col flex-1 min-w-0 h-full">
        <Header />
        {activeNav === 'Openings' ? (
          <OpeningsPage />
        ) : (
          <div className="flex flex-1 min-h-0 overflow-hidden">
            <CardArea
              card={{ ...card, id: cardIndex + 1 }}
              cardIndex={cardIndex + 1}
              onNext={handleNext}
              onPrev={handlePrev}
            />

            <ResizeHandle onMouseDown={rightPanel.onMouseDown} onDoubleClick={rightPanel.toggle} />

            {rightPanel.collapsed && (
              <CollapsedTab side="right" onClick={rightPanel.expand} label="Details" />
            )}

            {!rightPanel.collapsed && (
              <div style={{ width: rightPanel.width }} className="flex-shrink-0 h-full overflow-hidden">
                <RightPanel
                  card={card}
                  activeTab={activeTab}
                  onTabChange={setActiveTab}
                  onCollapse={rightPanel.collapse}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function CollapsedTab({ side, onClick, label }: { side: 'left' | 'right'; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      title={`Expand ${label}`}
      className={`flex-shrink-0 w-6 h-full bg-white hover:bg-blue-50 border-gray-200 flex flex-col items-center justify-center gap-1.5 transition-colors group ${
        side === 'left' ? 'border-r' : 'border-l'
      }`}
    >
      {[0, 1, 2].map((i) => (
        <div key={i} className="w-[3px] h-[3px] rounded-full bg-gray-300 group-hover:bg-blue-400 transition-colors" />
      ))}
      <span
        className="text-[9px] font-semibold text-gray-300 group-hover:text-blue-400 tracking-widest transition-colors mt-1 uppercase"
        style={{ writingMode: 'vertical-rl', transform: side === 'left' ? 'rotate(180deg)' : 'none' }}
      >
        {label}
      </span>
    </button>
  );
}

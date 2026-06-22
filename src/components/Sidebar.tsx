import React from 'react';
import {
  Home, BookOpen, Swords, Target, Layers, RotateCcw, BarChart2, Settings, ChevronRight, ChevronsLeft,
} from 'lucide-react';
import { NavItem } from '../types';
import { activityData } from '../mockData';

interface SidebarProps {
  active: NavItem;
  onNavigate: (item: NavItem) => void;
  onCollapse: () => void;
}

const navItems: { name: NavItem; icon: React.FC<{ size?: number; className?: string }>; badge?: number }[] = [
  { name: 'Dashboard', icon: Home },
  { name: 'Openings', icon: BookOpen },
  { name: 'Gambits', icon: Swords },
  { name: 'Tactics', icon: Target },
  { name: 'Decks', icon: Layers },
  { name: 'Review', icon: RotateCcw, badge: 36 },
  { name: 'Progress', icon: BarChart2 },
  { name: 'Settings', icon: Settings },
];

const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export default function Sidebar({ active, onNavigate, onCollapse }: SidebarProps) {
  return (
    <aside className="w-full bg-white border-r border-gray-200 flex flex-col h-full overflow-hidden">
      <div className="px-4 py-4 border-b border-gray-100 flex items-center gap-3 flex-shrink-0">
        <div className="w-9 h-9 rounded-xl bg-[#1a2744] flex items-center justify-center flex-shrink-0">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L9 6H6L8 10L5 14H10L12 22L14 14H19L16 10L18 6H15L12 2Z" fill="white" opacity="0.9" />
            <circle cx="12" cy="12" r="3" fill="#4a90d9" opacity="0.8" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-[#1a2744] text-[16px] leading-tight truncate">KnightPrep</div>
          <div className="text-[10px] text-gray-400 font-medium truncate">Study. Practice. Advance.</div>
        </div>
        <button onClick={onCollapse} title="Collapse sidebar" className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-md hover:bg-gray-100 transition-colors">
          <ChevronsLeft size={15} className="text-gray-400" />
        </button>
      </div>
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto overflow-x-hidden">
        {navItems.map(({ name, icon: Icon, badge }) => {
          const isActive = active === name;
          return (
            <button
              key={name}
              onClick={() => onNavigate(name)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 relative group ${
                isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-blue-600 rounded-r-full" />}
              <Icon size={17} className={isActive ? 'text-blue-600 flex-shrink-0' : 'text-gray-400 group-hover:text-gray-600 flex-shrink-0'} />
              <span className="flex-1 text-left truncate">{name}</span>
              {badge !== undefined && (
                <span className="bg-blue-100 text-blue-700 text-[11px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center flex-shrink-0">{badge}</span>
              )}
            </button>
          );
        })}
      </nav>
      <div className="mx-2 mb-3 p-3 bg-gray-50 rounded-xl border border-gray-100 flex-shrink-0">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[11px] font-semibold text-gray-700">Today at a glance</span>
          <ChevronRight size={13} className="text-gray-400 flex-shrink-0" />
        </div>
        <div className="space-y-1.5">
          {[
            { label: 'Cards due', value: '36', color: 'text-blue-600' },
            { label: 'Accuracy', value: '87%', color: 'text-green-600' },
            { label: 'Reviews', value: '58', color: 'text-gray-700' },
            { label: 'Study time', value: '42m', color: 'text-gray-700' },
          ].map(({ label, value, color }) => (
            <div key={label} className="flex items-center justify-between">
              <span className="text-[11px] text-gray-500 truncate">{label}</span>
              <span className={`text-[11px] font-semibold ${color} flex-shrink-0 ml-2`}>{value}</span>
            </div>
          ))}
        </div>
        <div className="mt-2.5 pt-2.5 border-t border-gray-200">
          <div className="flex gap-1 mb-1">
            {days.map((d, i) => <div key={i} className="text-[9px] text-gray-400 font-medium w-5 text-center">{d}</div>)}
          </div>
          {activityData.map((week, wi) => (
            <div key={wi} className="flex gap-1 mb-1">
              {week.map((a, di) => <div key={di} className={`w-5 h-4 rounded-sm ${a ? 'bg-green-400' : 'bg-gray-200'}`} />)}
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

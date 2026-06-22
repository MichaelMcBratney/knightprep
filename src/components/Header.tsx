import React from 'react';
import { Search, Bell, ChevronDown, Command } from 'lucide-react';

export default function Header() {
  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center px-6 gap-6 flex-shrink-0">
      <div className="flex-1 max-w-xl">
        <div className="relative flex items-center">
          <Search size={15} className="absolute left-3 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search openings, themes, decks..."
            className="w-full pl-9 pr-12 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-blue-400 focus:bg-white transition-colors placeholder-gray-400 text-gray-700"
          />
          <div className="absolute right-3 flex items-center gap-0.5 text-gray-400">
            <Command size={11} />
            <span className="text-[11px] font-medium">K</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-5">
        <div className="flex items-center gap-2">
          <span className="text-xl">🔥</span>
          <div className="text-center">
            <div className="font-bold text-gray-800 text-[15px] leading-tight">12</div>
            <div className="text-[10px] text-gray-400 leading-tight">day streak</div>
          </div>
        </div>
        <div className="w-px h-8 bg-gray-200" />
        <div className="flex items-center gap-2.5">
          <div className="relative w-10 h-10">
            <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e5e7eb" strokeWidth="3" />
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#3b82f6" strokeWidth="3" strokeDasharray="100" strokeDashoffset="18" strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[9px] font-bold text-blue-600">24</span>
            </div>
          </div>
          <div>
            <div className="font-bold text-gray-800 text-[14px] leading-tight">Level 24</div>
            <div className="text-[10px] text-gray-400 leading-tight">1800 / 2200 XP</div>
          </div>
        </div>
        <div className="w-px h-8 bg-gray-200" />
        <button className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
          <Bell size={18} className="text-gray-500" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-500 rounded-full border-2 border-white" />
        </button>
        <button className="flex items-center gap-2 hover:bg-gray-50 rounded-lg px-2 py-1.5 transition-colors">
          <img
            src="https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=80&h=80&dpr=2"
            alt="Alex"
            className="w-8 h-8 rounded-full object-cover border-2 border-gray-200"
          />
          <span className="font-semibold text-[13px] text-gray-700">Alex</span>
          <ChevronDown size={14} className="text-gray-400" />
        </button>
      </div>
    </header>
  );
}

import React from 'react';
import { Member } from '../types/bill';
import { Share2, PlusCircle, History, RotateCcw } from 'lucide-react';
import { InstallButton } from './InstallButton';

interface HeaderProps {
  onOpenShare: () => void;
  onOpenNewRound: () => void;
  onOpenHistory: () => void;
  onOpenRoom?: () => void;
  currentRoomId?: string;
  currentUser?: Member | null;
  onOpenFriendMode?: () => void;
  historyCount: number;
  currentRoundNumber?: number;
  onReset: () => void;
  onLoadPreset: (presetType: 'izakaya' | 'mookata') => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenShare,
  onOpenNewRound,
  onOpenHistory,
  historyCount,
  onReset,
  onLoadPreset,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3 sm:gap-6">
        {/* Zone 1: Brand wordmark & Solo Badge */}
        <div className="flex items-center gap-2.5 shrink-0">
          <a
            href="#"
            className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 flex items-center gap-2"
          >
            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-500 text-white font-black text-base shadow-sm">
              ฿
            </span>
            <span>หารบิล</span>
          </a>


        </div>

        {/* Zone 2: Navigation anchors & Presets */}
        <nav className="hidden lg:flex items-center gap-5 text-sm font-medium text-slate-600">
          <a
            href="#members-section"
            className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
          >
            สมาชิก
          </a>
          <a
            href="#items-section"
            className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
          >
            รายการบิล
          </a>
          <a
            href="#tax-section"
            className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
          >
            ภาษี/ส่วนลด
          </a>
          <a
            href="#summary-section"
            className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
          >
            สรุปยอดโอน
          </a>

          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <button
              onClick={() => onLoadPreset('izakaya')}
              className="text-xs text-slate-500 hover:text-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              title="โหลดตัวอย่างร้านอิซากายะ"
            >
              ตัวอย่าง 1
            </button>
            <span className="text-slate-300">·</span>
            <button
              onClick={() => onLoadPreset('mookata')}
              className="text-xs text-slate-500 hover:text-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              title="โหลดตัวอย่างหมูกระทะ"
            >
              ตัวอย่าง 2
            </button>
            <span className="text-slate-300">·</span>
            <button
              onClick={onReset}
              className="text-xs text-rose-500 hover:text-rose-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              title="ล้างข้อมูลเริ่มใหม่"
            >
              ล้างบิล
            </button>
          </div>
        </nav>

        {/* Zone 3: Actions (New Round + History + Reset Bill + Share) */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <InstallButton />
          <button
            onClick={onOpenNewRound}
            className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors whitespace-nowrap shrink-0 flex items-center gap-1 cursor-pointer"
            title="เพิ่มรอบใหม่ (ไปต่อรอบ 2)"
          >
            <PlusCircle className="w-3.5 h-3.5 text-amber-600" />
            <span className="hidden md:inline">+ รอบใหม่</span>
          </button>

          <button
            onClick={onOpenHistory}
            className="p-1.5 sm:px-2.5 sm:py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors whitespace-nowrap shrink-0 flex items-center gap-1 cursor-pointer relative"
            title="ดูประวัติบิลทั้งหมด"
          >
            <History className="w-3.5 h-3.5 text-indigo-600" />
            <span className="hidden md:inline">ประวัติ</span>
            {historyCount > 0 && (
              <span className="px-1.5 py-0.2 bg-indigo-600 text-white text-[10px] font-bold rounded-full">
                {historyCount}
              </span>
            )}
          </button>

          <button
            onClick={onReset}
            className="p-1.5 sm:px-2.5 sm:py-1.5 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors whitespace-nowrap shrink-0 flex items-center gap-1 cursor-pointer"
            title="ล้างบิลเพื่อเริ่มใหม่"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">ล้างบิล</span>
          </button>

          <button
            onClick={onOpenShare}
            className="px-3 sm:px-3.5 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-white bg-slate-900 rounded-xl hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5 text-amber-400" />
            <span>สรุปยอด</span>
          </button>
        </div>
      </div>
    </header>
  );
};

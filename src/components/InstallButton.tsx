import React, { useState } from 'react';
import { Download, Share, SquarePlus, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const InstallButton: React.FC = () => {
  const { canInstall, needsIOSInstructions, install } = usePWAInstall();
  const [showIOSHelp, setShowIOSHelp] = useState(false);

  if (!canInstall && !needsIOSInstructions) return null;

  return (
    <>
      <button
        onClick={canInstall ? install : () => setShowIOSHelp(true)}
        className="p-1.5 sm:px-2.5 sm:py-1.5 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-xl transition-colors whitespace-nowrap shrink-0 flex items-center gap-1 cursor-pointer"
        title="ติดตั้งแอปลงหน้าจอหลัก"
      >
        <Download className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">ติดตั้งแอป</span>
      </button>

      {showIOSHelp && (
        <div
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-slate-900/50 p-4"
          onClick={() => setShowIOSHelp(false)}
        >
          <div
            className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-3">
              <h2 className="text-base font-bold text-slate-900">ติดตั้งหารบิลบน iPhone / iPad</h2>
              <button
                onClick={() => setShowIOSHelp(false)}
                className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                aria-label="ปิด"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <ol className="space-y-3 text-sm text-slate-700">
              <li className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 text-xs font-bold flex items-center justify-center shrink-0">1</span>
                <span className="flex items-center gap-1.5 flex-wrap">
                  เปิดด้วย Safari แล้วแตะปุ่มแชร์ <Share className="w-4 h-4 text-sky-600" />
                </span>
              </li>
              <li className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 text-xs font-bold flex items-center justify-center shrink-0">2</span>
                <span className="flex items-center gap-1.5 flex-wrap">
                  เลือก "เพิ่มไปยังหน้าจอโฮม" <SquarePlus className="w-4 h-4 text-slate-600" />
                </span>
              </li>
              <li className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 text-xs font-bold flex items-center justify-center shrink-0">3</span>
                <span>แตะ "เพิ่ม" มุมขวาบน เสร็จแล้ว</span>
              </li>
            </ol>
            <p className="mt-4 text-xs text-slate-400">
              ถ้าเปิดในแอปอื่น (เช่น LINE) ให้เลือก "เปิดใน Safari" ก่อน
            </p>
          </div>
        </div>
      )}
    </>
  );
};

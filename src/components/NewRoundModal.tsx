import React, { useState } from 'react';
import { Member, BillSettings } from '../types/bill';
import { X, PlusCircle, Users, RotateCcw, ArrowRight } from 'lucide-react';

interface NewRoundModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSettings: BillSettings;
  currentMembers: Member[];
  onConfirmNewRound: (mode: 'keep_members' | 'fresh', newVenueName: string) => void;
}

export const NewRoundModal: React.FC<NewRoundModalProps> = ({
  isOpen,
  onClose,
  currentSettings,
  currentMembers,
  onConfirmNewRound,
}) => {
  const currentRound = currentSettings.roundNumber || 1;
  const nextRound = currentRound + 1;
  const [venueName, setVenueName] = useState('');
  const [selectedMode, setSelectedMode] = useState<'keep_members' | 'fresh'>('keep_members');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirmNewRound(selectedMode, venueName.trim());
    onClose();
  };

  const drinkerCount = currentMembers.filter((m) => m.isDrinker).length;
  const nonDrinkerCount = currentMembers.length - drinkerCount;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 pb-24 sm:pb-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative mb-12 sm:mb-0 max-h-[85vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-4">
          <div className="p-2.5 bg-amber-500 text-white rounded-2xl shadow-sm">
            <PlusCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">เพิ่มรอบใหม่ (รอบที่ {nextRound})</h3>
            <p className="text-xs text-slate-500">
              บิลปัจจุบันจะถูกบันทึกเก็บเข้าประวัติโดยอัตโนมัติ
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Mode Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">
              เลือกรูปแบบการเริ่มรอบใหม่:
            </label>

            {/* Option 1: Keep same group */}
            <div
              onClick={() => setSelectedMode('keep_members')}
              className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                selectedMode === 'keep_members'
                  ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                  : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <div
                className={`p-2 rounded-xl shrink-0 ${
                  selectedMode === 'keep_members'
                    ? 'bg-white/10 text-amber-400'
                    : 'bg-white text-slate-700 border border-slate-200'
                }`}
              >
                <Users className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="font-bold text-xs sm:text-sm flex items-center gap-1.5">
                  <span>ใช้เพื่อนกลุ่มเดิม ({currentMembers.length} คน)</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                      selectedMode === 'keep_members'
                        ? 'bg-amber-400 text-slate-950'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    แนะนำ
                  </span>
                </div>
                <p
                  className={`text-[11px] mt-0.5 leading-relaxed ${
                    selectedMode === 'keep_members' ? 'text-slate-300' : 'text-slate-500'
                  }`}
                >
                  คงชื่อและสถานะ ดื่ม ({drinkerCount} คน) / ไม่ดื่ม ({nonDrinkerCount} คน) ไว้ตามเดิม ไม่ต้องพิมพ์ใหม่
                </p>
              </div>
            </div>

            {/* Option 2: Fresh start */}
            <div
              onClick={() => setSelectedMode('fresh')}
              className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                selectedMode === 'fresh'
                  ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                  : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <div
                className={`p-2 rounded-xl shrink-0 ${
                  selectedMode === 'fresh'
                    ? 'bg-white/10 text-white'
                    : 'bg-white text-slate-700 border border-slate-200'
                }`}
              >
                <RotateCcw className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="font-bold text-xs sm:text-sm">
                  เริ่มบิลใหม่ทั้งหมด (สมาชิกใหม่)
                </div>
                <p
                  className={`text-[11px] mt-0.5 leading-relaxed ${
                    selectedMode === 'fresh' ? 'text-slate-300' : 'text-slate-500'
                  }`}
                >
                  ล้างรายชื่อและรายการอาหาร เพื่อจัดกลุ่มสมาชิกใหม่ตั้งแต่ต้น
                </p>
              </div>
            </div>
          </div>

          {/* Next venue name input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              ชื่อร้านหรือสถานที่ของรอบใหม่ (ระบุหรือไม่ก็ได้):
            </label>
            <input
              type="text"
              value={venueName}
              onChange={(e) => setVenueName(e.target.value)}
              placeholder={`เช่น ร้านต่อรอบ ${nextRound}, คาราโอเกะ, บาร์ชิลๆ`}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all"
            />
          </div>

          <div className="pt-2 flex gap-2">
            <button
              type="submit"
              className="flex-1 py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer"
            >
              <span>เปิดรอบที่ {nextRound} ทันที</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-semibold rounded-xl transition-colors cursor-pointer"
            >
              ยกเลิก
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

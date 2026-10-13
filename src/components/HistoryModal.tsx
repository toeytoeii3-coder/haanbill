import React, { useState } from 'react';
import { BillRecord, BillSettings } from '../types/bill';
import { calculateBill } from '../utils/calculations';
import { generateGroupShareText } from '../utils/textShare';
import {
  X,
  History,
  Calendar,
  Users,
  ExternalLink,
  Trash2,
  Copy,
  Check,
  Layers,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  historyRecords: BillRecord[];
  activeBillId?: string;
  onSelectRecord: (record: BillRecord) => void;
  onDeleteRecord: (id: string) => void;
  onClearHistory: () => void;
  currentSettings: BillSettings;
  onResetCurrentBill?: () => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  historyRecords,
  activeBillId,
  onSelectRecord,
  onDeleteRecord,
  onClearHistory,
  currentSettings,
  onResetCurrentBill,
}) => {
  const [activeTab, setActiveTab] = useState<'list' | 'combined'>('list');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isCopiedCombined, setIsCopiedCombined] = useState(false);
  const [showClearAllConfirm, setShowClearAllConfirm] = useState(false);

  if (!isOpen) return null;

  // Single round copy
  const handleCopyRecord = (record: BillRecord) => {
    const calc = calculateBill(record.members, record.items, record.settings);
    const text = generateGroupShareText(calc, record.settings);
    navigator.clipboard.writeText(text);
    setCopiedId(record.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Multi-round aggregation logic (e.g. Round 1 + Round 2 + ...)
  const combinedSummary = (() => {
    if (historyRecords.length === 0) return null;

    let grandTotalSum = 0;
    // Map of member name -> { isDrinker: boolean, total: number, rounds: { roundTitle: string, amount: number }[] }
    const memberTotals: Record<
      string,
      {
        name: string;
        isDrinker: boolean;
        total: number;
        rounds: { title: string; amount: number }[];
      }
    > = {};

    historyRecords.forEach((record) => {
      const calc = calculateBill(record.members, record.items, record.settings);
      grandTotalSum += calc.grandTotal;

      calc.breakdowns.forEach((b) => {
        const key = b.member.name.trim().toLowerCase();
        if (!memberTotals[key]) {
          memberTotals[key] = {
            name: b.member.name.trim(),
            isDrinker: b.member.isDrinker,
            total: 0,
            rounds: [],
          };
        }
        memberTotals[key].total += b.total;
        memberTotals[key].rounds.push({
          title: record.settings.restaurantName || `รอบที่ ${record.roundNumber}`,
          amount: b.total,
        });
      });
    });

    const combinedList = Object.values(memberTotals).sort((a, b) => b.total - a.total);

    // Build text
    const textLines: string[] = [];
    textLines.push(`🧾 สรุปยอดรวมทุกรอบของคืนนี้ (${historyRecords.length} รอบ) 🍻`);
    textLines.push(`💰 ยอดรวมทั้งคืน: ${grandTotalSum.toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท`);
    textLines.push('----------------------------------------');
    textLines.push('👥 ยอดรวมที่ต้องโอนรายคน (รวมทุกร้าน):');

    combinedList.forEach((m, idx) => {
      const drinkerTag = m.isDrinker ? '🍺 สายดื่ม' : '🥤 ไม่ดื่ม';
      textLines.push(`\n${idx + 1}. ${m.name} (${drinkerTag})`);
      textLines.push(`   👉 ยอดรวมสุทธิ: *${m.total.toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท*`);
      const roundDetails = m.rounds
        .map((r) => `${r.title}: ${r.amount.toFixed(2)}บ.`)
        .join(', ');
      textLines.push(`   (แจกแจง: ${roundDetails})`);
    });

    textLines.push('\n----------------------------------------');
    if (currentSettings.promptPayId.trim()) {
      textLines.push(`📲 โอนรวมได้ที่พร้อมเพย์: ${currentSettings.promptPayId.trim()}`);
      if (currentSettings.accountName.trim()) {
        textLines.push(`ชื่อบัญชี: ${currentSettings.accountName.trim()}`);
      }
    }
    textLines.push(`\nโอนทีเดียวได้เลยน้า ส่งสลิปในแชทนี้ได้เลย ขอบคุณทุกคนครับ/ค่ะ! 🙏✨`);

    return {
      grandTotal: grandTotalSum,
      list: combinedList,
      text: textLines.join('\n'),
    };
  })();

  const handleCopyCombined = () => {
    if (!combinedSummary) return;
    navigator.clipboard.writeText(combinedSummary.text);
    setIsCopiedCombined(true);
    setTimeout(() => setIsCopiedCombined(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 pb-24 sm:pb-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 relative max-h-[85vh] mb-12 sm:mb-0 flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-4">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">ประวัติบิลและรอบทั้งหมด</h3>
            <p className="text-xs text-slate-500">
              บันทึกไว้ {historyRecords.length} บิล สามารถสลับกลับมาดู หรือรวมยอดทุกรอบของคืนนี้ได้
            </p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-slate-100 p-1 rounded-2xl mb-4 shrink-0">
          <button
            onClick={() => setActiveTab('list')}
            className={`flex-1 py-2 px-3 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'list'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>รายการบิลแต่ละรอบ ({historyRecords.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('combined')}
            className={`flex-1 py-2 px-3 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'combined'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>สรุปยอดรวมทุกรอบ (โอนทีเดียว)</span>
          </button>
        </div>

        {/* Tab 1: List of History */}
        {activeTab === 'list' && (
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {historyRecords.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-2xl">
                ยังไม่มีประวัติบิลที่บันทึกไว้ เมื่อคุณเพิ่มรอบใหม่หรือใช้งาน บิลจะถูกบันทึกที่นี่อัตโนมัติ
              </div>
            ) : (
              historyRecords.map((record) => {
                const isActive = record.id === activeBillId;
                const formattedDate = new Date(record.timestamp).toLocaleDateString('th-TH', {
                  day: 'numeric',
                  month: 'short',
                  year: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <div
                    key={record.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      isActive
                        ? 'bg-amber-50/50 border-amber-300 ring-1 ring-amber-300'
                        : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-900 text-white">
                            รอบที่ {record.roundNumber}
                          </span>
                          <h4 className="font-bold text-slate-900 text-sm">
                            {record.title || 'บิลไม่ระบุชื่อ'}
                          </h4>
                          {isActive && (
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                              กำลังเปิดใช้งานอยู่
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                          <span>{formattedDate}</span>
                          <span aria-hidden="true">·</span>
                          <span>{record.totalMembers} คน</span>
                          <span aria-hidden="true">·</span>
                          <span>{record.items.length} รายการ</span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="font-black text-base text-slate-900 tabular-nums">
                          ฿{record.grandTotal.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            onSelectRecord(record);
                            onClose();
                          }}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>เปิดดู/แก้ไขรอบนี้</span>
                        </button>

                        <button
                          onClick={() => handleCopyRecord(record)}
                          className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                          title="คัดลอกสรุปส่ง LINE"
                        >
                          {copiedId === record.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="text-emerald-700">คัดลอกแล้ว!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>ก็อปสรุป LINE</span>
                            </>
                          )}
                        </button>
                      </div>

                      <button
                        onClick={() => onDeleteRecord(record.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="ลบบิลนี้"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}

            {historyRecords.length > 0 && (
              <div className="pt-3 border-t border-slate-200/60 mt-3">
                {showClearAllConfirm ? (
                  <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
                    <div className="text-xs text-rose-800">
                      <span className="font-bold flex items-center gap-1.5 text-rose-700">
                        <Trash2 className="w-3.5 h-3.5" />
                        ยืนยันล้างประวัติทั้งหมด?
                      </span>
                      <p className="text-[11px] text-rose-600 mt-0.5">
                        บิลที่บันทึกไว้ทั้ง {historyRecords.length} บิลจะถูกลบถาวร
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setShowClearAllConfirm(false)}
                        className="px-3 py-1.5 text-xs font-semibold bg-white text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors"
                      >
                        ยกเลิก
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onClearHistory();
                          setShowClearAllConfirm(false);
                        }}
                        className="px-3.5 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-sm cursor-pointer transition-colors"
                      >
                        ยืนยันลบทั้งหมด
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    {onResetCurrentBill && (
                      <button
                        type="button"
                        onClick={() => {
                          onResetCurrentBill();
                          onClose();
                        }}
                        className="text-xs text-slate-500 hover:text-slate-800 underline cursor-pointer"
                      >
                        ล้างบิลหน้าจอเพื่อเริ่มใหม่
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowClearAllConfirm(true)}
                      className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer ml-auto flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>ล้างประวัติทั้งหมด ({historyRecords.length} บิล)</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Combined Multi-Round Summary */}
        {activeTab === 'combined' && (
          <div className="flex-1 overflow-y-auto space-y-4">
            {combinedSummary ? (
              <>
                <div className="bg-slate-900 text-white p-4 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-400 block">ยอดรวมทั้งคืน (ทุกรอบ)</span>
                    <span className="text-2xl font-black tabular-nums">
                      ฿{combinedSummary.grandTotal.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="text-right text-xs text-slate-400">
                    {historyRecords.length} รอบบิล · {combinedSummary.list.length} คน
                  </div>
                </div>

                {/* Combined preview text */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <pre className="text-xs text-slate-800 font-sans whitespace-pre-wrap leading-relaxed select-all">
                    {combinedSummary.text}
                  </pre>
                </div>

                <button
                  onClick={handleCopyCombined}
                  className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer"
                >
                  {isCopiedCombined ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>คัดลอกยอดรวมทุกรอบแล้ว! พร้อมส่งใน LINE</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>คัดลอกยอดรวมทุกรอบส่ง LINE (โอนครั้งเดียว)</span>
                    </>
                  )}
                </button>
              </>
            ) : (
              <div className="py-16 text-center text-slate-400 text-sm">
                ไม่มีข้อมูลบิลสำหรับรวมยอด
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

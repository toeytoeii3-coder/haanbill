import React, { useState } from 'react';
import { BillItem, Member } from '../types/bill';
import { parsePastedItems } from '../utils/parser';
import { X, FileText, Plus, Sparkles } from 'lucide-react';

interface QuickBatchAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
  onAddItems: (items: BillItem[]) => void;
}

export const QuickBatchAddModal: React.FC<QuickBatchAddModalProps> = ({
  isOpen,
  onClose,
  members,
  onAddItems,
}) => {
  const [inputText, setInputText] = useState(
    `เบียร์สิงห์ทาวเวอร์ 2 1580\nหมูกระทะชุดใหญ่ 1 599\nซาชิมิแซลมอน 1 350\nน้ำแข็ง 2 ถัง 60\nเป๊ปซี่ 1 ลิตร 2 80\nยูซุไฮบอล 2 360`
  );

  if (!isOpen) return null;

  const drinkerIds = members.filter((m) => m.isDrinker).map((m) => m.id);
  const allIds = members.map((m) => m.id);

  const previewItems = parsePastedItems(inputText, drinkerIds, allIds);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (previewItems.length === 0) return;
    onAddItems(previewItems);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 pb-24 sm:pb-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 relative max-h-[85vh] mb-12 sm:mb-0 flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-3">
          <div className="p-2.5 bg-amber-50 text-amber-600 rounded-2xl">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">วางข้อความบิลหลายรายการ</h3>
            <p className="text-xs text-slate-500">
              วางรายการอาหารหรือใบเสร็จ ระบบจะตรวจจับแอลกอฮอล์/ส่วนกลางให้อัตโนมัติ
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              ข้อความรายการ (1 บรรทัด ต่อ 1 รายการ พร้อมราคา):
            </label>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              rows={6}
              placeholder="เช่น:\nเบียร์สิงห์ 2 ลัง 1200\nยำวุ้นเส้น 120\nน้ำแข็ง 30"
              className="w-full px-3.5 py-2.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white resize-none"
            />
          </div>

          {/* Preview of recognized items */}
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span className="font-semibold text-slate-700">
                ตรวจพบ {previewItems.length} รายการ:
              </span>
              <span>ตรวจพบแอลกอฮอล์จะหารเฉพาะคนดื่ม</span>
            </div>

            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {previewItems.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 bg-slate-50 rounded-xl text-xs border border-slate-100"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-slate-400 font-mono">{idx + 1}.</span>
                    <span className="font-medium text-slate-900 truncate">{item.name}</span>
                    <span className="text-slate-500 shrink-0">x{item.quantity}</span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        item.category === 'alcohol'
                          ? 'bg-amber-100 text-amber-800'
                          : item.category === 'communal'
                          ? 'bg-sky-100 text-sky-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {item.category === 'alcohol'
                        ? '🍺 แอลกอฮอล์'
                        : item.category === 'communal'
                        ? '🧊 ส่วนกลาง'
                        : '🍲 อาหาร'}
                    </span>
                    <span className="font-semibold tabular-nums text-slate-900">
                      ฿{(item.price * item.quantity).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 flex gap-2">
            <button
              type="submit"
              disabled={previewItems.length === 0}
              className="flex-1 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>นำเข้า {previewItems.length} รายการเข้าบิล</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              ยกเลิก
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

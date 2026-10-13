import React from 'react';
import { X, Download, CheckCircle2, Calendar } from 'lucide-react';

interface SlipViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  memberName: string;
  slipImageUrl?: string;
  uploadedAt?: number;
  amount?: number;
}

export const SlipViewerModal: React.FC<SlipViewerModalProps> = ({
  isOpen,
  onClose,
  memberName,
  slipImageUrl,
  uploadedAt,
  amount,
}) => {
  if (!isOpen || !slipImageUrl) return null;

  const formattedDate = uploadedAt
    ? new Date(uploadedAt).toLocaleDateString('th-TH', {
        day: 'numeric',
        month: 'short',
        year: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  const handleDownload = () => {
    const a = document.createElement('a');
    a.download = `slip-${memberName}-${amount || 0}.png`;
    a.href = slipImageUrl;
    a.click();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 pb-24 sm:pb-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-slate-100 relative max-h-[85vh] mb-12 sm:mb-0 flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold mb-1 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>สลิปโอนเงินของ {memberName}</span>
          </div>
          {amount !== undefined && (
            <div className="text-xl font-extrabold text-slate-900 tabular-nums">
              ฿{amount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
            </div>
          )}
          {formattedDate && (
            <div className="text-[11px] text-slate-400 flex items-center justify-center gap-1 mt-0.5">
              <Calendar className="w-3 h-3" />
              <span>แนบเมื่อ: {formattedDate}</span>
            </div>
          )}
        </div>

        {/* Slip Image */}
        <div className="flex-1 overflow-y-auto p-2 bg-slate-100 rounded-2xl border border-slate-200 flex items-center justify-center mb-4">
          <img
            src={slipImageUrl}
            alt={`Slip from ${memberName}`}
            className="max-w-full max-h-[60vh] object-contain rounded-xl shadow-sm"
          />
        </div>

        <div className="flex gap-2 shrink-0">
          <button
            onClick={handleDownload}
            className="flex-1 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>ดาวน์โหลดสลิป</span>
          </button>
          <button
            onClick={onClose}
            className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
};

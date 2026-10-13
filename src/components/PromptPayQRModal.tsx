import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { generatePromptPayPayload } from '../utils/promptpay';
import { X, QrCode, Download, Copy, Check } from 'lucide-react';

interface PromptPayQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetId: string;
  accountName?: string;
  bankName?: string;
  amount?: number;
  personName?: string;
}

export const PromptPayQRModal: React.FC<PromptPayQRModalProps> = ({
  isOpen,
  onClose,
  targetId,
  accountName,
  bankName,
  amount,
  personName,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen || !targetId) return;

    const payload = generatePromptPayPayload(targetId, amount);
    if (payload) {
      QRCode.toDataURL(payload, {
        width: 320,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('QR gen error:', err));
    }
  }, [isOpen, targetId, amount]);

  if (!isOpen) return null;

  const handleCopyAccount = () => {
    navigator.clipboard.writeText(targetId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQR = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.download = `promptpay-${personName || 'bill'}-${amount || 0}.png`;
    link.href = qrDataUrl;
    link.click();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 pb-24 sm:pb-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 relative mb-12 sm:mb-0 max-h-[85vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-4">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 mb-2">
            <QrCode className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">
            {personName ? `พร้อมเพย์: ${personName}` : 'สแกนจ่ายผ่านพร้อมเพย์'}
          </h3>
          {amount !== undefined && (
            <div className="text-2xl font-extrabold text-slate-900 mt-1 tabular-nums">
              ฿{amount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
            </div>
          )}
        </div>

        {/* QR Code Container */}
        <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-2xl border border-slate-100 mb-4">
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt="PromptPay QR Code"
              className="w-56 h-56 rounded-xl shadow-sm bg-white p-2"
            />
          ) : (
            <div className="w-56 h-56 flex items-center justify-center text-sm text-slate-400">
              กำลังสร้าง QR Code...
            </div>
          )}

          <div className="text-xs text-slate-500 mt-3 text-center">
            สแกนด้วยแอพธนาคารได้ทุกธนาคาร ยอดเงินระบุให้อัตโนมัติ
          </div>
        </div>

        {/* Account Details */}
        <div className="bg-slate-50 p-3.5 rounded-xl text-xs space-y-1.5 mb-5 border border-slate-100">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">เลขพร้อมเพย์/บัญชี:</span>
            <div className="flex items-center gap-1 font-mono font-medium text-slate-800">
              <span>{targetId}</span>
              <button
                onClick={handleCopyAccount}
                className="p-1 hover:text-sky-600 transition-colors"
                title="คัดลอกเลขบัญชี"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
          {accountName && (
            <div className="flex items-center justify-between">
              <span className="text-slate-500">ชื่อบัญชี:</span>
              <span className="font-medium text-slate-800 truncate max-w-[180px]">{accountName}</span>
            </div>
          )}
          {bankName && (
            <div className="flex items-center justify-between">
              <span className="text-slate-500">ธนาคาร:</span>
              <span className="font-medium text-slate-800">{bankName}</span>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleDownloadQR}
            disabled={!qrDataUrl}
            className="flex-1 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            บันทึกรูป QR
          </button>
          <button
            onClick={onClose}
            className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { BillCalculationResult, BillSettings, Member } from '../types/bill';
import { generatePromptPayPayload } from '../utils/promptpay';
import { generateIndividualShareText } from '../utils/textShare';
import {
  X,
  UserCheck,
  Wine,
  Sparkles,
  QrCode,
  Copy,
  Check,
  CheckCircle2,
  Download,
  Share2,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Upload,
  Image as ImageIcon,
} from 'lucide-react';
import { SlipViewerModal } from './SlipViewerModal';
import { compressSlipImage } from '../utils/storage';

interface FriendViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  calculation: BillCalculationResult;
  settings: BillSettings;
  onTogglePaid: (memberId: string) => void;
  onUploadSlip?: (memberId: string, slipImageUrl: string) => Promise<void> | void;
  initialMemberId?: string;
  isDirectSlipLink?: boolean;
  inline?: boolean;
}

export const FriendViewModal: React.FC<FriendViewModalProps> = ({
  isOpen,
  onClose,
  calculation,
  settings,
  onTogglePaid,
  onUploadSlip,
  initialMemberId,
  isDirectSlipLink,
  inline,
}) => {
  const [selectedMemberId, setSelectedMemberId] = useState<string>(initialMemberId || '');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [showAllItems, setShowAllItems] = useState(false);
  const [isViewingSlip, setIsViewingSlip] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState(false);
  const [isVerifyingAI, setIsVerifyingAI] = useState(false);
  const [aiVerification, setAiVerification] = useState<any>(null);

  useEffect(() => {
    setAiVerification(null);
  }, [selectedMemberId]);

  const handleProcessSlip = async (file: File) => {
    if (!file || !onUploadSlip) return;
    try {
      setIsUploading(true);
      setIsVerifyingAI(true);
      setAiVerification(null);
      const compressed = await compressSlipImage(file);
      await onUploadSlip(activePerson.member.id, compressed);
      setUploadSuccessMsg(true);

      try {
        const res = await fetch('/api/ai/verify-slip', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            slipImageUrl: compressed,
            expectedAmount: activePerson.total,
            memberName: activePerson.member.name,
          }),
        });
        const data = await res.json();
        if (data.success && data.analysis) {
          setAiVerification(data.analysis);
          if (data.analysis.matchAmount || data.analysis.amount >= activePerson.total * 0.95) {
            if (!activePerson.member.hasPaid) {
              onTogglePaid(activePerson.member.id);
            }
          }
        }
      } catch (err) {
        console.error('AI verification error:', err);
      }

      setTimeout(() => setUploadSuccessMsg(false), 5000);
    } catch (err) {
      console.error('Slip upload failed', err);
    } finally {
      setIsUploading(false);
      setIsVerifyingAI(false);
    }
  };

  // Sync initialMemberId if provided
  useEffect(() => {
    if (initialMemberId) {
      setSelectedMemberId(initialMemberId);
    }
  }, [initialMemberId]);

  // Default to first member if none selected
  useEffect(() => {
    if (calculation.breakdowns.length > 0 && !selectedMemberId) {
      setSelectedMemberId(initialMemberId || calculation.breakdowns[0].member.id);
    }
  }, [calculation.breakdowns, selectedMemberId, initialMemberId]);

  const activePerson = calculation.breakdowns.find(
    (b) => b.member.id === selectedMemberId
  ) || calculation.breakdowns[0];

  // Generate PromptPay QR for the selected friend's exact amount
  useEffect(() => {
    if (activePerson && settings.promptPayId) {
      const payload = generatePromptPayPayload(settings.promptPayId, activePerson.total);
      if (payload) {
        QRCode.toDataURL(payload, {
          width: 280,
          margin: 2,
          color: {
            dark: '#0f172a',
            light: '#ffffff',
          },
        })
          .then((url) => setQrDataUrl(url))
          .catch(() => {});
      }
    }
  }, [activePerson, settings.promptPayId]);

  if (!isOpen || !activePerson) return null;

  const isPaid = !!activePerson.member.hasPaid;

  const handleCopyAccount = () => {
    navigator.clipboard.writeText(settings.promptPayId);
    setCopiedAccount(true);
    setTimeout(() => setCopiedAccount(false), 2000);
  };

  const handleCopyMyShare = () => {
    const text = generateIndividualShareText(activePerson, settings);
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const handleDownloadQR = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.download = `promptpay-${activePerson.member.name}-${activePerson.total}.png`;
    a.href = qrDataUrl;
    a.click();
  };

  const renderFriendContent = () => (
    <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 relative max-h-[85vh] mb-12 sm:mb-0 flex flex-col">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
        aria-label="Close"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Header */}
      <div className="text-center mb-4 pr-6">
        <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full inline-block mb-1 border border-amber-200">
          โหมดสำหรับเพื่อนร่วมโต๊ะ (Friend View)
        </span>
        <h3 className="text-lg font-bold text-slate-900 truncate">
          {settings.restaurantName || 'บิลมื้อนี้'} · รอบที่ {settings.roundNumber || 1}
        </h3>
        <p className="text-xs text-slate-500">
          {isDirectSlipLink || initialMemberId
            ? 'สรุปยอดที่ต้องโอนและช่องทางสแกนจ่ายของคุณ'
            : 'แตะเลือกชื่อของคุณเพื่อดูยอดที่ต้องโอนและสแกนจ่ายได้ทันที'}
        </p>
      </div>

      {/* Member Selector Chips (Hidden if opened via direct friend link / initialMemberId) */}
      {!isDirectSlipLink && !initialMemberId && (
        <div className="mb-4">
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            คุณคือใครในโต๊ะนี้? (แตะเลือกชื่อคุณ):
          </label>
          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1 bg-slate-50 rounded-2xl border border-slate-200">
            {calculation.breakdowns.map((b) => {
              const isSelected = b.member.id === selectedMemberId;
              return (
                <button
                  key={b.member.id}
                  onClick={() => setSelectedMemberId(b.member.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200/80'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      b.member.isDrinker ? 'bg-amber-400' : 'bg-emerald-400'
                    }`}
                  />
                  <span>{b.member.name}</span>
                  <span className="text-[10px] opacity-80">
                    {b.member.isDrinker ? '🍺' : '🥤'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Personal Breakdown & Payment Card */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {/* Main Due Card */}
        <div
          className={`p-4 rounded-2xl border transition-all ${
            isPaid
              ? 'bg-emerald-50/60 border-emerald-200'
              : 'bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white text-sm ${
                  activePerson.member.avatarColor
                }`}
              >
                {activePerson.member.name.charAt(0)}
              </div>
              <div>
                <h4 className={`font-bold text-base ${isPaid ? 'text-slate-900' : 'text-white'}`}>
                  {activePerson.member.name}
                </h4>
              </div>
            </div>
            <div className="text-right">
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                isPaid ? 'bg-emerald-200 text-emerald-900' : 'bg-amber-400/20 text-amber-300'
              }`}>
                {isPaid ? '✓ โอนแล้ว' : '⏳ รอโอน'}
              </span>
            </div>
          </div>

          <div className="flex items-baseline justify-between mt-3 pt-3 border-t border-slate-700/50">
            <span className={`text-xs ${isPaid ? 'text-slate-600' : 'text-slate-300'}`}>
              ยอดที่ต้องโอนสุทธิ:
            </span>
            <div className="text-right">
              <span className={`text-2xl font-extrabold ${isPaid ? 'text-emerald-700' : 'text-amber-400'}`}>
                ฿{activePerson.total.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* PromptPay Section */}
        {settings.promptPayId ? (
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <QrCode className="w-4 h-4 text-amber-600" />
                <span>สแกนจ่ายพร้อมเพย์ (PromptPay QR)</span>
              </div>
              <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-md">
                ยอดเฉพาะคุณ (Exact)
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-3 rounded-xl border border-slate-200/80">
              {qrDataUrl ? (
                <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-100 shrink-0">
                  <img src={qrDataUrl} alt="PromptPay QR" className="w-36 h-36 object-contain" />
                </div>
              ) : (
                <div className="w-36 h-36 bg-slate-100 rounded-xl animate-pulse flex items-center justify-center text-xs text-slate-400">
                  กำลังสร้าง QR...
                </div>
              )}

              <div className="space-y-2 text-xs w-full">
                <div>
                  <span className="text-slate-500 block text-[11px]">พร้อมเพย์ / เบอร์โทร / เลขบัญชี:</span>
                  <div className="font-mono font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg mt-0.5 select-all flex items-center justify-between">
                    <span>{settings.promptPayId}</span>
                    <button
                      onClick={handleCopyAccount}
                      className="text-amber-600 hover:text-amber-700 font-sans text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      {copiedAccount ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedAccount ? 'คัดลอกแล้ว' : 'คัดลอก'}</span>
                    </button>
                  </div>
                </div>

                {settings.accountName && (
                  <div>
                    <span className="text-slate-500 block text-[11px]">ชื่อบัญชีผู้รับ:</span>
                    <span className="font-semibold text-slate-800">{settings.accountName} {settings.bankName ? `(${settings.bankName})` : ''}</span>
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={handleDownloadQR}
                    className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-[11px]"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>บันทึก QR</span>
                  </button>
                  <button
                    onClick={handleCopyMyShare}
                    className="flex-1 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-[11px] border border-amber-200"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiedText ? 'คัดลอกข้อความแล้ว' : 'คัดลอกข้อความส่งแชท'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl text-xs text-center space-y-1">
            <p className="font-bold">เจ้าของบิลยังไม่ได้ตั้งค่า PromptPay</p>
            <p className="text-slate-600">โปรดติดต่อผู้ดูแลบิลเพื่อสอบถามช่องทางการโอนเงิน</p>
          </div>
        )}

        {/* Slip Upload & Payment Status */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              <span>สถานะการชำระเงิน & แนบสลิป</span>
            </span>
            <button
              onClick={() => onTogglePaid(activePerson.member.id)}
              className={`text-xs px-3 py-1 rounded-xl font-semibold transition-colors cursor-pointer ${
                isPaid
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                  : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
              }`}
            >
              {isPaid ? '✓ โอนเงินแล้ว (คลิกยกเลิก)' : 'กดปุ่ม "โอนแล้ว"'}
            </button>
          </div>

          {activePerson.member.slipImageUrl ? (
            <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-lg overflow-hidden border border-emerald-300 bg-white shrink-0">
                  <img src={activePerson.member.slipImageUrl} alt="Slip" className="w-full h-full object-cover" />
                </div>
                <div>
                  <span className="text-xs font-bold text-emerald-900 block flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    แนบสลิปโอนเงินเรียบร้อย
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {activePerson.member.slipUploadedAt ? new Date(activePerson.member.slipUploadedAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                </div>
              </div>
              <div className="flex gap-1.5">
                <button
                  onClick={() => setIsViewingSlip(true)}
                  className="px-2.5 py-1 bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  ดูสลิป
                </button>
                <label className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer">
                  เปลี่ยนสลิป
                  <input
                    type="file"
                    accept="image/*"
                    disabled={isUploading}
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleProcessSlip(file);
                    }}
                  />
                </label>
              </div>
            </div>
          ) : (
            <div className="border-2 border-dashed border-slate-300 hover:border-amber-400 bg-white p-4 rounded-xl text-center transition-colors">
              <label className="cursor-pointer block">
                <div className="flex flex-col items-center gap-1">
                  <Upload className="w-6 h-6 text-slate-400 mb-1" />
                  <span className="text-xs font-bold text-slate-700">แนบสลิปโอนเงิน (สแกนตรวจสอบอัตโนมัติด้วย AI)</span>
                  <span className="text-[11px] text-slate-500">คลิกเพื่ออัปโหลดรูปภาพสลิปจากธนาคาร</span>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  disabled={isUploading}
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleProcessSlip(file);
                  }}
                />
              </label>
              <span className="text-[10px] text-slate-400 mt-1.5 block text-center">
                เลือกรูปสลิป AI จะช่วยตรวจสอบยอดโอนและขึ้นสถานะให้อัตโนมัติทันที
              </span>
            </div>
          )}

          {isVerifyingAI && (
            <div className="mt-2.5 p-3 bg-sky-50 border border-sky-200 text-sky-900 rounded-xl text-xs flex items-center gap-2 animate-pulse font-medium">
              <Sparkles className="w-4 h-4 text-sky-600 animate-spin shrink-0" />
              <span>🤖 AI กำลังอ่านสลิปและตรวจสอบยอดโอนอัตโนมัติ...</span>
            </div>
          )}

          {aiVerification && (
            <div className={`mt-3 p-3 rounded-xl border text-xs space-y-1.5 animate-in fade-in ${
              aiVerification.matchAmount ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-amber-50 border-amber-300 text-amber-900'
            }`}>
              <div className="font-bold flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>🤖 ผลการตรวจสอบสลิปด้วย AI:</span>
              </div>
              <p className="font-semibold">{aiVerification.message}</p>
              <div className="grid grid-cols-2 gap-1 pt-1 text-[11px] opacity-90 border-t border-emerald-200/60 mt-1">
                <div>ยอดในสลิป: <span className="font-bold">฿{aiVerification.amount?.toFixed(2)}</span></div>
                <div>ยอดที่ต้องจ่าย: <span className="font-bold">฿{activePerson.total.toFixed(2)}</span></div>
                {aiVerification.senderName && <div>ผู้โอน: <span className="font-medium">{aiVerification.senderName}</span></div>}
                {aiVerification.dateTime && <div>เวลา: <span className="font-medium">{aiVerification.dateTime}</span></div>}
              </div>
              <div className="pt-1 text-[10px] font-bold text-emerald-700">
                {aiVerification.matchAmount ? '✓ ยอดตรงกัน ขึ้นสถานะโอนแล้วให้อัตโนมัติเรียบร้อย' : '⚠ ยอดอาจไม่ตรงกัน โปรดตรวจสอบ'}
              </div>
            </div>
          )}
        </div>

        {/* Itemized Share Details */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs space-y-2">
          <div className="font-bold text-slate-800 flex items-center justify-between">
            <span>แจกแจงค่าใช้จ่ายของคุณ:</span>
            <span className="text-slate-500 font-normal">
              {activePerson.itemDetails.length} รายการ
            </span>
          </div>

          <div className="space-y-1.5 border-t border-slate-200 pt-2">
            {activePerson.foodShare > 0 && (
              <div className="flex justify-between">
                <span className="text-slate-600">ค่าอาหารทั่วไป:</span>
                <span className="font-semibold tabular-nums text-slate-900">
                  ฿{activePerson.foodShare.toFixed(2)}
                </span>
              </div>
            )}

            <div className="flex justify-between">
              <span className="text-slate-600">ค่าเหล้า/เบียร์:</span>
              {activePerson.alcoholShare > 0 ? (
                <span className="font-semibold tabular-nums text-amber-700">
                  ฿{activePerson.alcoholShare.toFixed(2)}
                </span>
              ) : (
                <span className="font-medium text-emerald-600">
                  ฿0.00 (ไม่ดื่มแอลกอฮอล์ ไม่คิดค่าเหล้า)
                </span>
              )}
            </div>

            {activePerson.communalShare > 0 && (
              <div className="flex justify-between">
                <span className="text-slate-600">ค่าส่วนกลาง/น้ำแข็ง:</span>
                <span className="font-semibold tabular-nums text-slate-900">
                  ฿{activePerson.communalShare.toFixed(2)}
                </span>
              </div>
            )}

            {(activePerson.serviceChargeShare > 0 || activePerson.vatShare > 0) && (
              <div className="flex justify-between">
                <span className="text-slate-600">SC + VAT สัดส่วนตนเอง:</span>
                <span className="font-semibold tabular-nums text-slate-900">
                  ฿{(activePerson.serviceChargeShare + activePerson.vatShare).toFixed(2)}
                </span>
              </div>
            )}

            {activePerson.discountShare > 0 && (
              <div className="flex justify-between text-rose-600">
                <span>ส่วนลดที่ได้รับ:</span>
                <span className="font-semibold tabular-nums">
                  -฿{activePerson.discountShare.toFixed(2)}
                </span>
              </div>
            )}
          </div>

          {/* Expandable items detail */}
          <div className="pt-2 border-t border-slate-200">
            <button
              onClick={() => setShowAllItems(!showAllItems)}
              className="w-full py-1 text-slate-600 hover:text-slate-900 flex items-center justify-between font-semibold cursor-pointer"
            >
              <span>ดูชื่อรายการอาหารที่ร่วมแชร์</span>
              {showAllItems ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>

            {showAllItems && (
              <div className="mt-2 space-y-1.5 max-h-36 overflow-y-auto pl-1 pr-1">
                {activePerson.itemDetails.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-[11px] p-1.5 bg-white rounded-lg border border-slate-100"
                  >
                    <span className="text-slate-700 truncate pr-2">
                      {item.itemName} (หาร {item.splitWithCount} คน)
                    </span>
                    <span className="font-semibold text-slate-900 tabular-nums shrink-0">
                      ฿{item.cost.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
        <button
          onClick={onClose}
          className="text-xs text-slate-500 hover:text-slate-800 underline cursor-pointer"
        >
          ปิดหน้านี้
        </button>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
        >
          เรียบร้อย
        </button>
      </div>
    </div>
  );

  if (inline) {
    return (
      <div className="w-full flex flex-col items-center">
        {renderFriendContent()}
        <SlipViewerModal
          isOpen={isViewingSlip}
          onClose={() => setIsViewingSlip(false)}
          memberName={activePerson.member.name}
          slipImageUrl={activePerson.member.slipImageUrl}
          uploadedAt={activePerson.member.slipUploadedAt}
          amount={activePerson.total}
        />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 pb-24 sm:pb-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      {renderFriendContent()}
      <SlipViewerModal
        isOpen={isViewingSlip}
        onClose={() => setIsViewingSlip(false)}
        memberName={activePerson.member.name}
        slipImageUrl={activePerson.member.slipImageUrl}
        uploadedAt={activePerson.member.slipUploadedAt}
        amount={activePerson.total}
      />
    </div>
  );
};

import React, { useState, useRef, useEffect } from 'react';
import QRCode from 'qrcode';
import { BillCalculationResult, BillSettings, BillItem } from '../types/bill';
import { generateGroupShareText } from '../utils/textShare';
import { exportStateAsHash } from '../utils/storage';
import {
  X,
  Copy,
  Check,
  Share2,
  Download,
  Image as ImageIcon,
  MessageSquare,
  Link2,
  QrCode,
  Smartphone,
} from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  calculation: BillCalculationResult;
  settings: BillSettings;
  items: BillItem[];
  onOpenFriendMode?: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  calculation,
  settings,
  items,
  onOpenFriendMode,
}) => {
  const [activeTab, setActiveTab] = useState<'text' | 'image' | 'link'>('text');
  const [isCopiedText, setIsCopiedText] = useState(false);
  const [isCopiedLink, setIsCopiedLink] = useState(false);
  const [renderedImageUrl, setRenderedImageUrl] = useState<string>('');
  const [isRenderingImage, setIsRenderingImage] = useState(false);
  const [linkQrDataUrl, setLinkQrDataUrl] = useState<string>('');
  const [copiedPersonLinkId, setCopiedPersonLinkId] = useState<string | null>(null);

  const fullShareText = generateGroupShareText(calculation, settings);

  // Ultra-clean short link for real-world messaging and instant slip transfers
  const shortLink = typeof window !== 'undefined'
    ? `${window.location.origin}/s/${settings.roomId || 'HAAN-1001'}`
    : '';

  // Generate QR code for the short link (faster and cleaner to scan)
  useEffect(() => {
    if (shortLink && isOpen && activeTab === 'link') {
      QRCode.toDataURL(shortLink, {
        width: 320,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      })
        .then((url) => setLinkQrDataUrl(url))
        .catch(() => {});
    }
  }, [shortLink, isOpen, activeTab]);

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(fullShareText);
      setIsCopiedText(true);
      setTimeout(() => setIsCopiedText(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shortLink);
      setIsCopiedLink(true);
      setTimeout(() => setIsCopiedLink(false), 2000);
    } catch {
      // Fallback
    }
  };

  // Render high quality receipt image onto Canvas
  const drawReceiptCanvas = async () => {
    setIsRenderingImage(true);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setIsRenderingImage(false);
      return;
    }

    // Set canvas dimensions
    const width = 640;
    const padding = 40;
    const baseHeight = 520 + calculation.breakdowns.length * 68;
    canvas.width = width;
    canvas.height = baseHeight;

    // Background: clean off-white
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, width, baseHeight);

    // Card boundary
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(20, 20, width - 40, baseHeight - 40, 24);
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#e2e8f0';
    ctx.stroke();

    // Header branding
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 24px Prompt, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(settings.restaurantName.trim() || 'ใบเสร็จหารบิล (HaanBill)', width / 2, 65);

    ctx.fillStyle = '#64748b';
    ctx.font = '14px Prompt, sans-serif';
    ctx.fillText(
      `วันที่: ${settings.date || new Date().toISOString().split('T')[0]} · รอบที่ ${settings.roundNumber || 1}`,
      width / 2,
      95
    );

    // Divider
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(padding, 115);
    ctx.lineTo(width - padding, 115);
    ctx.stroke();
    ctx.setLineDash([]);

    // Total Amount Box
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.roundRect(padding, 130, width - padding * 2, 85, 16);
    ctx.fill();

    ctx.fillStyle = '#94a3b8';
    ctx.font = '13px Prompt, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('ยอดรวมทั้งโต๊ะ (Grand Total)', padding + 20, 160);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px Prompt, sans-serif';
    ctx.fillText(
      `฿${calculation.grandTotal.toLocaleString('th-TH', { minimumFractionDigits: 2 })}`,
      padding + 20,
      198
    );

    // List of persons
    let y = 250;
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 16px Prompt, sans-serif';
    ctx.fillText('รายชื่อและยอดที่ต้องโอน:', padding, y);
    y += 25;

    calculation.breakdowns.forEach((p, idx) => {
      // Row box
      ctx.fillStyle = p.member.isDrinker ? '#fefce8' : '#f0fdf4';
      ctx.beginPath();
      ctx.roundRect(padding, y, width - padding * 2, 54, 12);
      ctx.fill();
      ctx.strokeStyle = p.member.isDrinker ? '#fef08a' : '#bbf7d0';
      ctx.stroke();

      // Person name & tag
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 15px Prompt, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(
        `${idx + 1}. ${p.member.name} ${p.member.isDrinker ? '🍺 (ดื่ม)' : '🥤 (ไม่ดื่ม)'}`,
        padding + 16,
        y + 32
      );

      // Amount
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 16px Prompt, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(
        `฿${p.total.toLocaleString('th-TH', { minimumFractionDigits: 2 })}`,
        width - padding - 16,
        y + 32
      );

      y += 64;
    });

    // Payment promptpay info
    y += 10;
    ctx.strokeStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.moveTo(padding, y);
    ctx.lineTo(width - padding, y);
    ctx.stroke();
    y += 25;

    if (settings.promptPayId.trim()) {
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 14px Prompt, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`📲 โอนผ่านพร้อมเพย์: ${settings.promptPayId.trim()}`, padding, y);
      y += 20;
      if (settings.accountName.trim()) {
        ctx.fillStyle = '#64748b';
        ctx.font = '13px Prompt, sans-serif';
        ctx.fillText(`ชื่อบัญชี: ${settings.accountName.trim()} (${settings.bankName || 'ธนาคาร'})`, padding, y);
        y += 20;
      }
    }

    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px Prompt, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('สร้างด้วย หารบิล HaanBill · แยกคนดื่ม/ไม่ดื่ม ชัดเจน ยุติธรรม', width / 2, baseHeight - 35);

    const dataUrl = canvas.toDataURL('image/png');
    setRenderedImageUrl(dataUrl);
    setIsRenderingImage(false);
  };

  useEffect(() => {
    if (isOpen && activeTab === 'image') {
      drawReceiptCanvas();
    }
  }, [isOpen, activeTab]);

  const handleDownloadImage = () => {
    if (!renderedImageUrl) return;
    const a = document.createElement('a');
    a.download = `bill-receipt-${settings.restaurantName || 'haanbill'}.png`;
    a.href = renderedImageUrl;
    a.click();
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `สรุปหารบิล: ${settings.restaurantName || 'ปาร์ตี้'}`,
          text: fullShareText,
          url: shortLink,
        });
      } catch {
        // User cancelled share
      }
    } else {
      handleCopyText();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 pb-24 sm:pb-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 relative max-h-[85vh] mb-12 sm:mb-0 flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-4">
          <div className="p-2.5 bg-slate-900 text-white rounded-2xl">
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">แชร์บิลให้เพื่อนร่วมโต๊ะ</h3>
            <p className="text-xs text-slate-500">
              เพื่อนสามารถเปิดดูบนมือถือตัวเอง หรือสแกน QR เพื่อดูยอดและโอนเงินได้ทันที
            </p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-slate-100 p-1 rounded-2xl mb-4 shrink-0">
          <button
            onClick={() => setActiveTab('link')}
            className={`flex-1 py-2 px-3 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'link'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>ให้เพื่อนเปิดดูบนมือถือ</span>
          </button>

          <button
            onClick={() => setActiveTab('text')}
            className={`flex-1 py-2 px-3 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'text'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>ข้อความส่ง LINE</span>
          </button>

          <button
            onClick={() => setActiveTab('image')}
            className={`flex-1 py-2 px-3 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'image'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>รูปใบเสร็จ (PNG)</span>
          </button>
        </div>

        {/* Tab 1: Share Link & Table QR */}
        {activeTab === 'link' && (
          <div className="flex-1 overflow-y-auto space-y-4">
            {/* Table Scan QR */}
            <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center">
              <span className="text-xs font-bold text-slate-900 mb-1">
                ให้เพื่อนที่โต๊ะยกมือถือสแกน QR นี้ได้เลย
              </span>
              <span className="text-[11px] text-slate-500 mb-3">
                เพื่อนจะเปิดบิลนี้บนมือถือตัวเอง แล้วเลือกชื่อเพื่อดูยอดและสแกนพร้อมเพย์ได้ทันที
              </span>

              {linkQrDataUrl ? (
                <img
                  src={linkQrDataUrl}
                  alt="Share Bill QR"
                  className="w-48 h-48 bg-white p-2 rounded-2xl shadow-sm border border-slate-200"
                />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center text-xs text-slate-400">
                  กำลังสร้าง QR สำหรับเปิดบิล...
                </div>
              )}
            </div>

            {/* Link box */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded font-bold text-[10px]">
                    ลิงก์สั้นใช้ได้จริง
                  </span>
                  <span>ส่งให้เพื่อนเปิดดู & แนบสลิป:</span>
                </span>
                {onOpenFriendMode && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenFriendMode();
                    }}
                    className="text-xs text-sky-600 hover:text-sky-700 font-semibold underline cursor-pointer"
                  >
                    ดูมุมมองเพื่อน (Friend View)
                  </button>
                )}
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 break-all select-all font-semibold">
                {shortLink}
              </div>
              <span className="text-[11px] text-slate-500 block">
                เพื่อนแตะลิงก์นี้แล้วสามารถเลือกชื่อตัวเอง สแกนพร้อมเพย์ และแนบรูปสลิปส่งกลับมาได้ทันที
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={handleCopyLink}
                className="flex-1 py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer"
              >
                {isCopiedLink ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>คัดลอกลิงก์สั้นแล้ว!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>คัดลอกลิงก์สั้นสำหรับส่งสลิป</span>
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  const slipInviteText = `🧾 สรุปยอดหารบิล & แนบสลิปโอนเงิน (${settings.restaurantName || 'ปาร์ตี้'}):\n👉 เปิดดูยอด & แนบสลิป: ${shortLink}\n(แตะชื่อตัวเอง สแกนจ่ายพร้อมเพย์ แล้วแนบสลิปได้เลยน้า 🙏✨)`;
                  navigator.clipboard.writeText(slipInviteText);
                  setIsCopiedLink(true);
                  setTimeout(() => setIsCopiedLink(false), 2000);
                }}
                className="py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-sm cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                <span>ก็อปข้อความส่ง LINE</span>
              </button>
            </div>

            {/* Individual member links */}
            {calculation.breakdowns.length > 0 && (
              <div className="pt-3 border-t border-slate-200">
                <span className="text-xs font-bold text-slate-800 block mb-2">
                  หรือแยกลิงก์ส่งให้เพื่อนรายคน (แตะแล้วล็อกชื่อ & ยอดให้อัตโนมัติ):
                </span>
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {calculation.breakdowns.map((b) => {
                    const personLink = `${shortLink}?m=${b.member.id}`;
                    return (
                      <div
                        key={b.member.id}
                        className="flex items-center justify-between p-2 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 text-xs gap-2"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              b.member.isDrinker ? 'bg-amber-400' : 'bg-emerald-400'
                            }`}
                          />
                          <span className="font-bold text-slate-900 truncate">{b.member.name}</span>
                          <span className="text-slate-500 font-mono tabular-nums">
                            ฿{b.total.toFixed(2)}
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            const personMsg = `💰 ยอดของคุณ ${b.member.name}: ฿${b.total.toFixed(
                              2
                            )}\n👉 เปิดดูยอด & แนบสลิป: ${personLink}`;
                            navigator.clipboard.writeText(personMsg);
                            setCopiedPersonLinkId(b.member.id);
                            setTimeout(() => setCopiedPersonLinkId(null), 2000);
                          }}
                          className="px-2.5 py-1 bg-white hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg font-semibold shrink-0 cursor-pointer flex items-center gap-1 text-[11px]"
                        >
                          {copiedPersonLinkId === b.member.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span>ก็อปแล้ว</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>ก็อปลิงก์+ยอด</span>
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Text Summary */}
        {activeTab === 'text' && (
          <div className="flex-1 overflow-y-auto space-y-4">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <pre className="text-xs text-slate-800 font-sans whitespace-pre-wrap leading-relaxed select-all">
                {fullShareText}
              </pre>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleCopyText}
                className="flex-1 py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer"
              >
                {isCopiedText ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>คัดลอกเรียบร้อยแล้ว! พร้อมวางใน LINE</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>คัดลอกข้อความสำหรับส่ง LINE</span>
                  </>
                )}
              </button>

              {'share' in navigator && (
                <button
                  onClick={handleNativeShare}
                  className="py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="แชร์ผ่านแอพบนมือถือ"
                >
                  <Share2 className="w-4 h-4" />
                  <span>แชร์</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Rendered Image */}
        {activeTab === 'image' && (
          <div className="flex-1 overflow-y-auto space-y-4 text-center">
            {isRenderingImage ? (
              <div className="py-16 text-xs text-slate-500">
                กำลังวาดการ์ดใบเสร็จ...
              </div>
            ) : renderedImageUrl ? (
              <div className="p-2 bg-slate-100 rounded-2xl inline-block max-h-80 overflow-y-auto border border-slate-200">
                <img
                  src={renderedImageUrl}
                  alt="Bill Receipt"
                  className="max-w-full h-auto rounded-xl shadow-md mx-auto"
                />
              </div>
            ) : null}

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleDownloadImage}
                disabled={!renderedImageUrl}
                className="flex-1 py-3 px-4 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs sm:text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>บันทึกรูปภาพใบเสร็จ (PNG)</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

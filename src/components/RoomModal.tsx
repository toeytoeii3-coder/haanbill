import React, { useState } from 'react';
import {
  X,
  Users,
  Copy,
  Check,
  RefreshCw,
  PlusCircle,
  LogIn,
  Share2,
  Sparkles,
} from 'lucide-react';

interface RoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRoomId: string;
  onJoinRoom: (roomId: string) => Promise<boolean>;
  onCreateNewRoom: () => void;
  onSyncNow: () => Promise<void>;
  isSyncing: boolean;
}

export const RoomModal: React.FC<RoomModalProps> = ({
  isOpen,
  onClose,
  currentRoomId,
  onJoinRoom,
  onCreateNewRoom,
  onSyncNow,
  isSyncing,
}) => {
  const [inputRoomId, setInputRoomId] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  if (!isOpen) return null;

  const roomShareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}?room=${currentRoomId}`
    : '';

  const handleCopyCode = () => {
    navigator.clipboard.writeText(currentRoomId);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(roomShareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputRoomId.trim()) return;
    setErrorMsg('');
    setIsJoining(true);

    const success = await onJoinRoom(inputRoomId.trim().toUpperCase());
    setIsJoining(false);

    if (success) {
      onClose();
    } else {
      setErrorMsg('ไม่พบห้องนี้บนเซิร์ฟเวอร์ กรุณาตรวจสอบรหัสห้องอีกครั้ง');
    }
  };

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
          <div className="p-2.5 bg-sky-500 text-white rounded-2xl shadow-sm">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">แชร์ห้องหารบิล (Multi-User Room)</h3>
            <p className="text-xs text-slate-500">
              เพื่อนในโต๊ะสามารถเข้าห้องเดียวกันเพื่อดูหรือเพิ่มรายการได้
            </p>
          </div>
        </div>

        {/* Current Room Code Display */}
        <div className="p-4 bg-slate-900 text-white rounded-2xl mb-4 text-center">
          <span className="text-[11px] text-slate-400 uppercase tracking-wider block mb-1">
            รหัสห้องของคุณ (Current Room Code)
          </span>
          <div className="text-3xl font-black font-mono tracking-widest text-amber-400 mb-2">
            {currentRoomId}
          </div>

          <div className="flex items-center justify-center gap-2">
            <button
              onClick={handleCopyCode}
              className="py-1.5 px-3 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copiedCode ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>คัดลอกรหัสแล้ว</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>ก็อปรหัสห้อง</span>
                </>
              )}
            </button>

            <button
              onClick={handleCopyLink}
              className="py-1.5 px-3 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>คัดลอกลิงก์แล้ว</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5" />
                  <span>ก็อปลิงก์ห้อง</span>
                </>
              )}
            </button>

            <button
              onClick={onSyncNow}
              disabled={isSyncing}
              className="py-1.5 px-3 bg-white/10 hover:bg-white/20 disabled:opacity-50 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="ดึงข้อมูลล่าสุดจากเซิร์ฟเวอร์"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>ซิงค์</span>
            </button>
          </div>
        </div>

        {/* Join Other Room Form */}
        <form onSubmit={handleJoin} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 mb-4">
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            เข้าร่วมห้องของเพื่อน (กรอกรหัส 6 หลัก):
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={inputRoomId}
              onChange={(e) => setInputRoomId(e.target.value.toUpperCase())}
              placeholder="เช่น HAAN-8821"
              className="flex-1 px-3.5 py-2 font-mono text-sm bg-white border border-slate-200 rounded-xl uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
            <button
              type="submit"
              disabled={isJoining || !inputRoomId.trim()}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>{isJoining ? 'กำลังเข้า...' : 'เข้าห้อง'}</span>
            </button>
          </div>

          {errorMsg && (
            <p className="text-[11px] text-rose-600 mt-1.5 font-medium">{errorMsg}</p>
          )}
        </form>

        {/* Create Fresh Room Button */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={() => {
              onCreateNewRoom();
              onClose();
            }}
            className="flex-1 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 text-amber-600" />
            <span>สร้างห้องใหม่</span>
          </button>
          <button
            onClick={onClose}
            className="py-2.5 px-4 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
};

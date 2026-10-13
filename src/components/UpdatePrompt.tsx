import React, { useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, X, WifiOff } from 'lucide-react';

const CHECK_INTERVAL_MS = 60 * 60 * 1000; // เช็คเวอร์ชันใหม่ทุก 1 ชั่วโมง

export const UpdatePrompt: React.FC = () => {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      if (!registration) return;
      setInterval(() => {
        if (registration.installing || !navigator.onLine) return;
        registration.update().catch(() => {});
      }, CHECK_INTERVAL_MS);
    },
  });

  // แจ้ง "พร้อมใช้งานออฟไลน์" แล้วซ่อนเองหลัง 4 วินาที
  useEffect(() => {
    if (!offlineReady) return;
    const t = setTimeout(() => setOfflineReady(false), 4000);
    return () => clearTimeout(t);
  }, [offlineReady, setOfflineReady]);

  if (!needRefresh && !offlineReady) return null;

  return (
    <div className="fixed left-0 right-0 bottom-20 z-[70] flex justify-center px-4 pointer-events-none">
      <div
        role="status"
        className="pointer-events-auto w-full max-w-sm bg-slate-900 text-white rounded-2xl shadow-xl p-3.5 flex items-center gap-3"
      >
        {needRefresh ? (
          <>
            <RefreshCw className="w-5 h-5 text-amber-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">มีเวอร์ชันใหม่พร้อมใช้งาน</p>
              <p className="text-xs text-slate-400">ข้อมูลบิลของคุณจะไม่หาย</p>
            </div>
            <button
              onClick={() => updateServiceWorker(true)}
              className="px-3 py-1.5 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-900 rounded-xl cursor-pointer shrink-0"
            >
              อัปเดตเลย
            </button>
            <button
              onClick={() => setNeedRefresh(false)}
              className="p-1 text-slate-400 hover:text-white cursor-pointer shrink-0"
              aria-label="ไว้ทีหลัง"
            >
              <X className="w-4 h-4" />
            </button>
          </>
        ) : (
          <>
            <WifiOff className="w-5 h-5 text-emerald-400 shrink-0" />
            <p className="flex-1 text-sm font-semibold">พร้อมใช้งานแบบออฟไลน์แล้ว</p>
          </>
        )}
      </div>
    </div>
  );
};

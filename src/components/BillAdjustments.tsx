import React from 'react';
import { BillSettings, DiscountType, RoundingMode } from '../types/bill';
import { Settings, Percent, CreditCard, ShieldCheck } from 'lucide-react';

interface BillAdjustmentsProps {
  settings: BillSettings;
  onChangeSettings: (newSettings: BillSettings) => void;
}

export const BillAdjustments: React.FC<BillAdjustmentsProps> = ({
  settings,
  onChangeSettings,
}) => {
  const update = (partial: Partial<BillSettings>) => {
    onChangeSettings({
      ...settings,
      ...partial,
    });
  };

  return (
    <section id="tax-section" className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
      <div className="flex items-center gap-2 mb-1">
        <div className="p-2 bg-sky-50 text-sky-600 rounded-xl">
          <Settings className="w-5 h-5" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">ตั้งค่าบิล ภาษี ส่วนลด และบัญชีรับเงิน</h2>
      </div>
      <p className="text-xs text-slate-500 mb-6">
        กำหนดอัตรา Service Charge, VAT, ส่วนลด และระบุเบอร์พร้อมเพย์เพื่อให้เพื่อนสแกนจ่ายได้ทันที
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: Bill details, Service Charge & VAT */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Percent className="w-3.5 h-3.5 text-slate-500" />
            <span>ค่าบริการ ภาษี และส่วนลด</span>
          </h3>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              ชื่อร้านหรือชื่องาน
            </label>
            <input
              type="text"
              value={settings.restaurantName}
              onChange={(e) => update({ restaurantName: e.target.value })}
              placeholder="เช่น อิซากายะ ทองหล่อ, ส้มตำป้าณี"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Service Charge */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Service Charge (%)
              </label>
              <div className="flex items-center gap-1">
                {[0, 10].map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => update({ serviceChargeRate: rate })}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                      settings.serviceChargeRate === rate
                        ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {rate}%
                  </button>
                ))}
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={settings.serviceChargeRate}
                  onChange={(e) => update({ serviceChargeRate: parseFloat(e.target.value) || 0 })}
                  className="w-16 px-2 py-1.5 text-xs text-center border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none"
                  placeholder="%"
                />
              </div>
            </div>

            {/* VAT */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                VAT (%)
              </label>
              <div className="flex items-center gap-1">
                {[0, 7].map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => update({ vatRate: rate })}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                      settings.vatRate === rate
                        ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {rate}%
                  </button>
                ))}
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={settings.vatRate}
                  onChange={(e) => update({ vatRate: parseFloat(e.target.value) || 0 })}
                  className="w-16 px-2 py-1.5 text-xs text-center border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none"
                  placeholder="%"
                />
              </div>
            </div>
          </div>

          {/* Discount */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              ส่วนลด (Discount)
            </label>
            <div className="flex gap-2">
              <div className="flex bg-slate-100 p-1 rounded-xl shrink-0">
                <button
                  type="button"
                  onClick={() => update({ discountType: 'amount' })}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    settings.discountType === 'amount'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  บาท (฿)
                </button>
                <button
                  type="button"
                  onClick={() => update({ discountType: 'percentage' })}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    settings.discountType === 'percentage'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  เปอร์เซ็นต์ (%)
                </button>
              </div>

              <input
                type="number"
                min="0"
                value={settings.discountValue || ''}
                onChange={(e) => update({ discountValue: parseFloat(e.target.value) || 0 })}
                placeholder="0"
                className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
              />
            </div>
          </div>

          {/* Rounding Mode */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              การปัดเศษยอดเงิน
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'exact', label: 'ทศนิยม 2 ตำแหน่ง' },
                { id: 'roundHalf', label: 'ปัดเศษตามจริง' },
                { id: 'roundUp', label: 'ปัดขึ้นเต็มบาท' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => update({ roundingMode: opt.id as RoundingMode })}
                  className={`py-1.5 px-2 text-[11px] font-semibold rounded-lg border transition-all cursor-pointer ${
                    settings.roundingMode === opt.id
                      ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: PromptPay & Bank Transfer Account */}
        <div className="space-y-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
          <div className="flex items-center gap-1.5">
            <CreditCard className="w-4 h-4 text-sky-600" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              ช่องทางรับเงิน (PromptPay / บัญชีธนาคาร)
            </h3>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              เบอร์พร้อมเพย์ หรือ เลขบัตรประชาชน (10 หรือ 13 หลัก)
            </label>
            <input
              type="text"
              value={settings.promptPayId}
              onChange={(e) => update({ promptPayId: e.target.value })}
              placeholder="เช่น 0812345678"
              className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
            <span className="text-[10px] text-slate-500 mt-1 block">
              ระบบจะนำเบอร์นี้ไปสร้าง QR Code พร้อมเพย์มาตรฐาน EMVCo ให้เพื่อนสแกน
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              ชื่อบัญชี (สำหรับตรวจสอบ)
            </label>
            <input
              type="text"
              value={settings.accountName}
              onChange={(e) => update({ accountName: e.target.value })}
              placeholder="เช่น สมชาย ใจดี"
              className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              ธนาคาร (ทางเลือก)
            </label>
            <input
              type="text"
              value={settings.bankName}
              onChange={(e) => update({ bankName: e.target.value })}
              placeholder="เช่น กสิกรไทย, ไทยพาณิชย์"
              className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <div className="flex items-center gap-2 pt-1 text-[11px] text-emerald-700 bg-emerald-50 p-2.5 rounded-xl border border-emerald-100">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>เพื่อนสามารถสแกน QR จ่ายเงินได้โดยตรง ยอดจะกรอกให้อัตโนมัติ</span>
          </div>
        </div>
      </div>
    </section>
  );
};

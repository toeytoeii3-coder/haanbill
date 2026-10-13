import React, { useState } from 'react';
import { BillCalculationResult, BillSettings } from '../types/bill';
import { generateIndividualShareText } from '../utils/textShare';
import { PromptPayQRModal } from './PromptPayQRModal';
import {
  Wallet,
  Wine,
  UtensilsCrossed,
  Layers,
  Copy,
  Check,
  QrCode,
  CheckCircle2,
  Clock,
  Sparkles,
  Image as ImageIcon,
} from 'lucide-react';
import { SlipViewerModal } from './SlipViewerModal';

interface SummaryCardsProps {
  calculation: BillCalculationResult;
  settings: BillSettings;
  onTogglePaid: (memberId: string) => void;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({
  calculation,
  settings,
  onTogglePaid,
}) => {
  const [selectedPersonForQR, setSelectedPersonForQR] = useState<{
    name: string;
    amount: number;
  } | null>(null);
  const [selectedSlipPerson, setSelectedSlipPerson] = useState<BillCalculationResult['breakdowns'][0] | null>(null);
  const [copiedPersonId, setCopiedPersonId] = useState<string | null>(null);
  const [expandedDetails, setExpandedDetails] = useState<Record<string, boolean>>({});

  const handleCopyIndividual = (person: BillCalculationResult['breakdowns'][0]) => {
    const text = generateIndividualShareText(person, settings);
    navigator.clipboard.writeText(text);
    setCopiedPersonId(person.member.id);
    setTimeout(() => setCopiedPersonId(null), 2000);
  };

  const totalPaidCount = calculation.breakdowns.filter((b) => b.member.hasPaid).length;
  const allPaid = calculation.breakdowns.length > 0 && totalPaidCount === calculation.breakdowns.length;

  return (
    <section id="summary-section" className="space-y-6">
      {/* Overview Stat Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Grand Total */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 text-white rounded-3xl p-5 shadow-sm col-span-2 lg:col-span-1 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>ยอดรวมทั้งสิ้น</span>
            <Wallet className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-extrabold tabular-nums tracking-tight">
            ฿{calculation.grandTotal.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
            <span>{calculation.breakdowns.length} คน</span>
            <span>·</span>
            <span className="text-emerald-400 font-semibold">จ่ายแล้ว {totalPaidCount}/{calculation.breakdowns.length}</span>
          </div>
        </div>

        {/* Food Subtotal */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-2">
            <span>ค่าอาหารทั่วไป</span>
            <UtensilsCrossed className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 tabular-nums">
            ฿{calculation.foodSubtotal.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            หารเฉลี่ยทุกคนตามสั่งจริง
          </div>
        </div>

        {/* Alcohol Subtotal */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-2">
            <span>ค่าแอลกอฮอล์ (เฉพาะคนดื่ม)</span>
            <Wine className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 tabular-nums">
            ฿{calculation.alcoholSubtotal.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-amber-600 font-medium mt-1">
            คนไม่ดื่มจะไม่ถูกคิดค่าใช้จ่ายส่วนนี้
          </div>
        </div>

        {/* Tax, Service & Communal */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-2">
            <span>SC + VAT + ส่วนกลาง</span>
            <Layers className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 tabular-nums">
            ฿
            {(
              calculation.serviceChargeAmount +
              calculation.vatAmount +
              calculation.communalSubtotal
            ).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            หารตามสัดส่วนยอดที่สั่ง
          </div>
        </div>
      </div>

      {/* Individual Breakdown Cards */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              สรุปยอดที่ต้องโอนรายคน
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {allPaid ? (
              <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                ทุกคนโอนครบแล้ว! 🎉
              </span>
            ) : (
              <span className="text-xs text-slate-500">
                โอนแล้ว {totalPaidCount} จาก {calculation.breakdowns.length} คน
              </span>
            )}
          </div>
        </div>

        {/* Multi-Payer Settlement Box */}
        {calculation.multiplePayersActive && calculation.settlements.length > 0 && (
          <div className="mb-6 p-4 bg-slate-900 text-white rounded-2xl shadow-sm border border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-amber-400 text-slate-950 rounded-lg text-xs font-bold">
                  🤝 หักกลบลบหนี้
                </span>
                <h3 className="font-bold text-sm text-white">
                  มีผู้จ่ายเงินหลายคน (เส้นทางการโอนที่น้อยที่สุด):
                </h3>
              </div>
              <span className="text-[11px] text-slate-400">
                {calculation.settlements.length} รายการโอน
              </span>
            </div>

            <div className="space-y-2">
              {calculation.settlements.map((s, idx) => (
                <div
                  key={idx}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-slate-800/80 rounded-xl border border-slate-700/60 gap-2"
                >
                  <div className="flex items-center gap-2 text-xs sm:text-sm">
                    <span className="font-bold text-rose-300">{s.fromMember.name}</span>
                    <span className="text-slate-400">👉 โอนให้</span>
                    <span className="font-bold text-emerald-300">{s.toMember.name}</span>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3">
                    <span className="font-black text-amber-400 tabular-nums text-sm sm:text-base">
                      ฿{s.amount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                    </span>
                    <button
                      onClick={() =>
                        setSelectedPersonForQR({
                          name: `${s.toMember.name} (รับจาก ${s.fromMember.name})`,
                          amount: s.amount,
                        })
                      }
                      className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-900 text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <QrCode className="w-3 h-3 text-slate-700" />
                      <span>สแกนจ่าย</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {calculation.breakdowns.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            เพิ่มสมาชิกและรายการอาหารเพื่อดูการสรุปยอด
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {calculation.breakdowns.map((person) => {
              const isPaid = !!person.member.hasPaid;

              return (
                <div
                  key={person.member.id}
                  className={`p-5 rounded-2xl border transition-all ${
                    isPaid
                      ? 'bg-emerald-50/40 border-emerald-200'
                      : 'bg-slate-50/70 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {/* Card Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-11 h-11 rounded-2xl flex items-center justify-center text-white font-bold text-base shadow-sm ${person.member.avatarColor}`}
                      >
                        {person.member.name.charAt(0)}
                      </div>

                      <div>
                        <h3 className="font-bold text-slate-900 text-base">
                          {person.member.name}
                        </h3>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {person.member.slipImageUrl && (
                        <button
                          onClick={() => setSelectedSlipPerson(person)}
                          className="px-2.5 py-1.5 text-xs font-bold bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-xl flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                          title="คลิกเพื่อดูรูปสลิปที่เพื่อนแนบมา"
                        >
                          <ImageIcon className="w-3.5 h-3.5" />
                          <span>ดูสลิป</span>
                        </button>
                      )}

                      {/* Paid Toggle Button */}
                      <button
                        onClick={() => onTogglePaid(person.member.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                          isPaid
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                        title={isPaid ? 'คลิกเพื่อเปลี่ยนเป็นยังไม่โอน' : 'คลิกเพื่อบันทึกว่าโอนแล้ว'}
                      >
                        {isPaid ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>โอนแล้ว</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>รอโอน</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Main Amount */}
                  <div className="bg-white p-3.5 rounded-xl border border-slate-100 mb-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">ยอดรวม</span>
                      <span className="text-xl font-black text-slate-900 tabular-nums">
                        ฿{person.total.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    {/* Multi-payer upfront & net balance */}
                    {calculation.multiplePayersActive && (() => {
                      const userBal = calculation.userBalances?.find((u) => u.member.id === person.member.id);
                      if (!userBal) return null;
                      return (
                        <div className="mt-2 pt-2 border-t border-slate-100 text-xs flex flex-col gap-1">
                          <div className="flex items-center justify-between text-slate-500">
                            <span>ออกเงินไปก่อน:</span>
                            <span className="font-semibold text-slate-800 tabular-nums">
                              ฿{userBal.totalPaid.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                            </span>
                          </div>

                          <div className="flex items-center justify-between font-bold">
                            <span>ยอดสุทธิ (Net):</span>
                            {userBal.netBalance > 0.01 ? (
                              <span className="text-emerald-600 tabular-nums">
                                + ได้รับคืน ฿{userBal.netBalance.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                              </span>
                            ) : userBal.netBalance < -0.01 ? (
                              <span className="text-rose-600 tabular-nums">
                                - ต้องโอน ฿{Math.abs(userBal.netBalance).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                              </span>
                            ) : (
                              <span className="text-slate-500">เสมอตัว (0.00 บ.)</span>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Breakdown breakdown rows (hidden by default) */}
                  {expandedDetails[person.member.id] && (
                    <div className="space-y-1.5 text-xs text-slate-600 border-t border-slate-200/60 pt-3 mb-4">
                      {person.foodShare > 0 && (
                        <div className="flex justify-between">
                          <span className="text-slate-500">ค่าอาหารทั่วไป:</span>
                          <span className="font-semibold tabular-nums text-slate-800">
                            ฿{person.foodShare.toFixed(2)}
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between">
                        <span className="text-slate-500">ค่าเหล้า/เบียร์:</span>
                        {person.alcoholShare > 0 ? (
                          <span className="font-semibold tabular-nums text-amber-700">
                            ฿{person.alcoholShare.toFixed(2)}
                          </span>
                        ) : (
                          <span className="font-medium text-emerald-600">
                            ฿0.00 (ไม่คิด)
                          </span>
                        )}
                      </div>

                      {person.communalShare > 0 && (
                        <div className="flex justify-between">
                          <span className="text-slate-500">ค่าส่วนกลาง/น้ำแข็ง:</span>
                          <span className="font-semibold tabular-nums text-slate-800">
                            ฿{person.communalShare.toFixed(2)}
                          </span>
                        </div>
                      )}

                      {person.customShare > 0 && (
                        <div className="flex justify-between">
                          <span className="text-slate-500">รายการเฉพาะตน:</span>
                          <span className="font-semibold tabular-nums text-slate-800">
                            ฿{person.customShare.toFixed(2)}
                          </span>
                        </div>
                      )}

                      {(person.serviceChargeShare > 0 || person.vatShare > 0) && (
                        <div className="flex justify-between">
                          <span className="text-slate-500">SC + VAT สัดส่วนตนเอง:</span>
                          <span className="font-semibold tabular-nums text-slate-800">
                            ฿{(person.serviceChargeShare + person.vatShare).toFixed(2)}
                          </span>
                        </div>
                      )}

                      {person.discountShare > 0 && (
                        <div className="flex justify-between text-rose-600">
                          <span>ส่วนลดที่ได้รับ:</span>
                          <span className="font-semibold tabular-nums">
                            -฿{person.discountShare.toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Toggle Details Button */}
                  <div className="mb-3">
                    <button
                      onClick={() =>
                        setExpandedDetails((prev) => ({
                          ...prev,
                          [person.member.id]: !prev[person.member.id],
                        }))
                      }
                      className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <span>{expandedDetails[person.member.id] ? '▲ ซ่อนรายละเอียด' : '▼ ดูรายละเอียดการคำนวณ'}</span>
                    </button>
                  </div>

                  {/* Card Actions */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => handleCopyIndividual(person)}
                      className="flex-1 py-2 px-3 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      title="คัดลอกยอดคนนี้เพื่อส่งแชทส่วนตัว"
                    >
                      {copiedPersonId === person.member.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700">คัดลอกแล้ว!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>ก็อปส่งแชทส่วนตัว</span>
                        </>
                      )}
                    </button>

                    {settings.promptPayId.trim() && (
                      <button
                        onClick={() =>
                          setSelectedPersonForQR({
                            name: person.member.name,
                            amount: person.total,
                          })
                        }
                        className="py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="เปิด QR พร้อมเพย์ยอดนี้"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>QR พร้อมเพย์</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* QR Modal when individual is clicked */}
      <PromptPayQRModal
        isOpen={!!selectedPersonForQR}
        onClose={() => setSelectedPersonForQR(null)}
        targetId={settings.promptPayId}
        accountName={settings.accountName}
        bankName={settings.bankName}
        amount={selectedPersonForQR?.amount}
        personName={selectedPersonForQR?.name}
      />

      {/* Slip Viewer Modal */}
      <SlipViewerModal
        isOpen={!!selectedSlipPerson}
        onClose={() => setSelectedSlipPerson(null)}
        memberName={selectedSlipPerson?.member.name || ''}
        slipImageUrl={selectedSlipPerson?.member.slipImageUrl}
        uploadedAt={selectedSlipPerson?.member.slipUploadedAt}
        amount={selectedSlipPerson?.total}
      />
    </section>
  );
};

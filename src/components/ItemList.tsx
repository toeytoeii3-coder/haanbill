import React, { useState } from 'react';
import { BillItem, ItemCategory, Member } from '../types/bill';
import { detectCategory } from '../utils/parser';
import { QuickBatchAddModal } from './QuickBatchAddModal';
import {
  UtensilsCrossed,
  Wine,
  Sparkles,
  Plus,
  Trash2,
  CheckSquare,
  Square,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface ItemListProps {
  items: BillItem[];
  members: Member[];
  onAddItem: (item: Omit<BillItem, 'id'>) => void;
  onUpdateItem: (id: string, updated: Partial<BillItem>) => void;
  onRemoveItem: (id: string) => void;
  onBatchAddItems: (newItems: BillItem[]) => void;
}

export const ItemList: React.FC<ItemListProps> = ({
  items,
  members,
  onAddItem,
  onUpdateItem,
  onRemoveItem,
  onBatchAddItems,
}) => {
  const [name, setName] = useState('');
  const [priceStr, setPriceStr] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [category, setCategory] = useState<ItemCategory>('food');
  const [assignedMemberIds, setAssignedMemberIds] = useState<string[]>([]);
  const [paidByMemberId, setPaidByMemberId] = useState<string>(members[0]?.id || '');
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [isAssigneeExpanded, setIsAssigneeExpanded] = useState(false);

  // Auto-set default payer if empty
  React.useEffect(() => {
    if (!paidByMemberId && members.length > 0) {
      setPaidByMemberId(members[0].id);
    }
  }, [members, paidByMemberId]);

  // Auto assign default members on category change or initial load
  const handleCategorySelect = (cat: ItemCategory) => {
    setCategory(cat);
    if (cat === 'alcohol') {
      const drinkers = members.filter((m) => m.isDrinker).map((m) => m.id);
      setAssignedMemberIds(drinkers.length > 0 ? drinkers : members.map((m) => m.id));
    } else {
      setAssignedMemberIds(members.map((m) => m.id));
    }
  };

  // Smart detect on name typing
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    if (val.trim()) {
      const detected = detectCategory(val);
      if (detected !== category) {
        handleCategorySelect(detected);
      }
    }
  };

  const handleSelectAll = () => {
    setAssignedMemberIds(members.map((m) => m.id));
  };

  const handleSelectDrinkersOnly = () => {
    const drinkers = members.filter((m) => m.isDrinker).map((m) => m.id);
    setAssignedMemberIds(drinkers);
  };

  const handleSelectNonDrinkersOnly = () => {
    const nonDrinkers = members.filter((m) => !m.isDrinker).map((m) => m.id);
    setAssignedMemberIds(nonDrinkers);
  };

  const handleToggleMember = (memberId: string) => {
    setAssignedMemberIds((prev) =>
      prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId]
    );
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const price = parseFloat(priceStr) || 0;
    if (price <= 0) return;

    // Fallback if no members selected
    const assignees =
      assignedMemberIds.length > 0 ? assignedMemberIds : members.map((m) => m.id);

    const payer = paidByMemberId || members[0]?.id;

    onAddItem({
      name: name.trim(),
      price,
      quantity: Math.max(1, quantity),
      category,
      assignedMemberIds: assignees,
      paidByMemberId: payer,
    });

    // Reset input
    setName('');
    setPriceStr('');
    setQuantity(1);
    setCategory('food');
    setAssignedMemberIds(members.map((m) => m.id));
    setIsAssigneeExpanded(false);
  };

  // Total raw items sum
  const totalItemsSum = items.reduce((acc, it) => acc + it.price * it.quantity, 0);

  return (
    <section id="items-section" className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">รายการอาหารและเครื่องดื่ม</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            ใส่รายการและราคา พร้อมเลือกคนที่ร่วมแชร์ (แอลกอฮอล์จะดึงเฉพาะคนดื่มให้อัตโนมัติ)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsBatchModalOpen(true)}
            className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>วางข้อความบิลหลายรายการ</span>
          </button>
        </div>
      </div>

      {/* Add Item Form */}
      <form onSubmit={handleFormSubmit} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 mb-3">
          {/* Name input */}
          <div className="sm:col-span-6">
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              ชื่อรายการ
            </label>
            <input
              type="text"
              value={name}
              onChange={handleNameChange}
              placeholder="เช่น เบียร์สิงห์ทาวเวอร์, หมูกระทะชุดใหญ่"
              className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all"
            />
          </div>

          {/* Price input */}
          <div className="sm:col-span-3">
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              ราคา (บาท)
            </label>
            <input
              type="number"
              step="any"
              min="0"
              value={priceStr}
              onChange={(e) => setPriceStr(e.target.value)}
              placeholder="0.00"
              className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all"
            />
          </div>

          {/* Quantity stepper */}
          <div className="sm:col-span-3">
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              จำนวน
            </label>
            <div className="flex items-center bg-white border border-slate-200 rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="px-3 py-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              >
                -
              </button>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full text-center text-sm font-semibold tabular-nums focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                className="px-3 py-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Category selector */}
        <div className="mb-3">
          <label className="block text-[11px] font-semibold text-slate-600 mb-1.5">
            ประเภทรายการ
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => handleCategorySelect('food')}
              className={`p-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                category === 'food'
                  ? 'bg-emerald-500 border-emerald-600 text-white shadow-sm'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <UtensilsCrossed className="w-3.5 h-3.5" />
              <span>🍲 อาหารทั่วไป (หารทุกคน)</span>
            </button>

            <button
              type="button"
              onClick={() => handleCategorySelect('alcohol')}
              className={`p-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                category === 'alcohol'
                  ? 'bg-amber-500 border-amber-600 text-white shadow-sm'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Wine className="w-3.5 h-3.5" />
              <span>🍺 แอลกอฮอล์ (หารคนดื่ม)</span>
            </button>

            <button
              type="button"
              onClick={() => handleCategorySelect('communal')}
              className={`p-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                category === 'communal'
                  ? 'bg-sky-500 border-sky-600 text-white shadow-sm'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>🧊 ส่วนกลาง/น้ำแข็ง</span>
            </button>

            <button
              type="button"
              onClick={() => handleCategorySelect('custom')}
              className={`p-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                category === 'custom'
                  ? 'bg-violet-500 border-violet-600 text-white shadow-sm'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>🍨 รายการเฉพาะคน</span>
            </button>
          </div>
        </div>

        {/* Assigned members bar */}
        <div className="bg-white p-3 rounded-xl border border-slate-200 mb-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-700">
              คนที่ร่วมแชร์รายการนี้ ({assignedMemberIds.length}/{members.length} คน):
            </span>

            <div className="flex items-center gap-1.5 text-[11px]">
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-slate-600 hover:text-slate-900 underline cursor-pointer"
              >
                ทุกคน
              </button>
              <span className="text-slate-300">·</span>
              <button
                type="button"
                onClick={handleSelectDrinkersOnly}
                className="text-amber-600 hover:text-amber-700 underline cursor-pointer"
              >
                เฉพาะคนดื่ม
              </button>
              <span className="text-slate-300">·</span>
              <button
                type="button"
                onClick={handleSelectNonDrinkersOnly}
                className="text-emerald-600 hover:text-emerald-700 underline cursor-pointer"
              >
                เฉพาะคนไม่ดื่ม
              </button>
            </div>
          </div>

          {/* Member chips with toggle */}
          <div className="flex flex-wrap gap-1.5">
            {members.map((m) => {
              const isChecked = assignedMemberIds.includes(m.id);
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => handleToggleMember(m.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                    isChecked
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  {isChecked ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                  <span>{m.name}</span>
                  <span className="text-[10px] opacity-75">
                    {m.isDrinker ? '🍺' : '🥤'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Payer selector */}
        <div className="bg-white p-3 rounded-xl border border-slate-200 mb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
              <span>💳 ใครเป็นคนออกเงินจ่ายรายการนี้ไปก่อน (คนจ่าย):</span>
            </div>
            <select
              value={paidByMemberId}
              onChange={(e) => setPaidByMemberId(e.target.value)}
              className="px-3 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer"
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} {m.id === members[0]?.id ? '(เจ้าภาพหลัก)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>เพิ่มรายการนี้เข้าบิล</span>
        </button>
      </form>

      {/* Existing Items List */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-500 pb-1">
          <span>รายการทั้งหมด ({items.length} รายการ)</span>
          <span className="font-semibold text-slate-900 tabular-nums">
            รวมรายการ: ฿{totalItemsSum.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
          </span>
        </div>

        {items.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-2xl">
            ยังไม่มีรายการอาหารในบิล กดเพิ่มรายการด้านบน หรือกด "วางข้อความบิล" ได้เลย
          </div>
        ) : (
          <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-white">
            {items.map((item, idx) => {
              const lineTotal = item.price * item.quantity;
              const assignedMembers = members.filter((m) =>
                item.assignedMemberIds.includes(m.id)
              );

              return (
                <div
                  key={item.id}
                  className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <span className="text-xs font-mono text-slate-400 mt-0.5">
                      {idx + 1}.
                    </span>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900 text-sm">{item.name}</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            item.category === 'alcohol'
                              ? 'bg-amber-100 text-amber-800'
                              : item.category === 'communal'
                              ? 'bg-sky-100 text-sky-800'
                              : item.category === 'custom'
                              ? 'bg-violet-100 text-violet-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {item.category === 'alcohol'
                            ? '🍺 แอลกอฮอล์'
                            : item.category === 'communal'
                            ? '🧊 ส่วนกลาง'
                            : item.category === 'custom'
                            ? '🍨 เฉพาะคน'
                            : '🍲 อาหาร'}
                        </span>
                      </div>

                      {/* Assignees list */}
                      <div className="flex items-center gap-1.5 flex-wrap mt-1">
                        <span className="text-[11px] text-slate-500">
                          แชร์ {assignedMembers.length} คน:
                        </span>
                        {assignedMembers.map((m) => (
                          <span
                            key={m.id}
                            className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded font-medium"
                          >
                            {m.name} {m.isDrinker ? '🍺' : '🥤'}
                          </span>
                        ))}
                      </div>

                      {/* Payer info */}
                      <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-500">
                        <span>💳 จ่ายโดย:</span>
                        <select
                          value={item.paidByMemberId || members[0]?.id || ''}
                          onChange={(e) => onUpdateItem(item.id, { paidByMemberId: e.target.value })}
                          className="bg-slate-100 hover:bg-slate-200 rounded px-1.5 py-0.5 font-bold text-slate-800 cursor-pointer text-[10px]"
                        >
                          {members.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    {/* Stepper & Price */}
                    <div className="flex items-center gap-2">
                      <div className="flex items-center bg-slate-100 rounded-lg text-xs font-semibold">
                        <button
                          onClick={() =>
                            onUpdateItem(item.id, {
                              quantity: Math.max(1, item.quantity - 1),
                            })
                          }
                          className="px-2 py-1 text-slate-600 hover:text-slate-900"
                        >
                          -
                        </button>
                        <span className="px-1 tabular-nums">{item.quantity}</span>
                        <button
                          onClick={() =>
                            onUpdateItem(item.id, {
                              quantity: item.quantity + 1,
                            })
                          }
                          className="px-2 py-1 text-slate-600 hover:text-slate-900"
                        >
                          +
                        </button>
                      </div>

                      <div className="text-right">
                        <div className="font-bold text-sm text-slate-900 tabular-nums">
                          ฿{lineTotal.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                        </div>
                        {item.quantity > 1 && (
                          <div className="text-[10px] text-slate-400 tabular-nums">
                            @฿{item.price.toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => onRemoveItem(item.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="ลบรายการนี้"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <QuickBatchAddModal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        members={members}
        onAddItems={onBatchAddItems}
      />
    </section>
  );
};

import React, { useState } from 'react';
import { Member } from '../types/bill';
import { DEFAULT_AVATAR_COLORS } from '../utils/presets';
import { UserPlus, Wine, Coffee, Trash2, Users } from 'lucide-react';

interface MemberListProps {
  members: Member[];
  onAddMember: (name: string, isDrinker: boolean) => void;
  onToggleDrinker: (memberId: string) => void;
  onRemoveMember: (memberId: string) => void;
  onUpdateMemberName: (memberId: string, name: string) => void;
}

export const MemberList: React.FC<MemberListProps> = ({
  members,
  onAddMember,
  onToggleDrinker,
  onRemoveMember,
  onUpdateMemberName,
}) => {
  const [newName, setNewName] = useState('');
  const [newIsDrinker, setNewIsDrinker] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    onAddMember(newName.trim(), newIsDrinker);
    setNewName('');
  };

  const startEdit = (member: Member) => {
    setEditingId(member.id);
    setEditingName(member.name);
  };

  const saveEdit = (memberId: string) => {
    if (editingName.trim()) {
      onUpdateMemberName(memberId, editingName.trim());
    }
    setEditingId(null);
  };

  const drinkerCount = members.filter((m) => m.isDrinker).length;
  const nonDrinkerCount = members.length - drinkerCount;

  return (
    <section id="members-section" className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">จัดการสมาชิกในโต๊ะ</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            ระบุคนที่มาด้วยกัน พร้อมแยกชัดเจนว่าใครดื่มแอลกอฮอล์หรือไม่ดื่ม
          </p>
        </div>

        {/* Member count summary */}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>รวม {members.length} คน</span>
          <span aria-hidden="true">·</span>
          <span className="text-amber-600 font-medium">🍺 ดื่ม {drinkerCount} คน</span>
          <span aria-hidden="true">·</span>
          <span className="text-emerald-600 font-medium">🥤 ไม่ดื่ม {nonDrinkerCount} คน</span>
        </div>
      </div>

      {/* Add member input bar */}
      <form onSubmit={handleAdd} className="flex flex-wrap sm:flex-nowrap gap-2.5 mb-6">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="ชื่อเพื่อน (เช่น บอส, แพรว, ตั้ม)"
          className="flex-1 min-w-[200px] px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all"
        />

        {/* Drinker state toggle button */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setNewIsDrinker(true)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              newIsDrinker
                ? 'bg-amber-500 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Wine className="w-3.5 h-3.5" />
            <span>ดื่มเหล้า/เบียร์</span>
          </button>
          <button
            type="button"
            onClick={() => setNewIsDrinker(false)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              !newIsDrinker
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Coffee className="w-3.5 h-3.5" />
            <span>ไม่ดื่ม (ขับรถ/สายกิน)</span>
          </button>
        </div>

        <button
          type="submit"
          className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-sm shrink-0 cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>เพิ่มคน</span>
        </button>
      </form>

      {/* Member cards grid */}
      {members.length === 0 ? (
        <div className="py-8 text-center text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-2xl">
          ยังไม่มีสมาชิกในโต๊ะ พิมพ์ชื่อแล้วกดเพิ่มด้านบนได้เลย!
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 rounded-2xl transition-all"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0 ${member.avatarColor}`}
                >
                  {member.name.charAt(0)}
                </div>

                <div className="min-w-0">
                  {editingId === member.id ? (
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onBlur={() => saveEdit(member.id)}
                      onKeyDown={(e) => e.key === 'Enter' && saveEdit(member.id)}
                      autoFocus
                      className="text-sm font-semibold text-slate-900 bg-white border border-slate-300 rounded px-1.5 py-0.5 w-28"
                    />
                  ) : (
                    <button
                      onClick={() => startEdit(member)}
                      className="text-sm font-bold text-slate-900 truncate hover:underline text-left block cursor-pointer"
                      title="คลิกเพื่อแก้ไขชื่อ"
                    >
                      {member.name}
                    </button>
                  )}

                  {/* Status Indicator / Click to toggle */}
                  <button
                    onClick={() => onToggleDrinker(member.id)}
                    className="flex items-center gap-1 text-[11px] font-medium transition-colors cursor-pointer mt-0.5"
                    title="คลิกเพื่อสลับสถานะ ดื่ม / ไม่ดื่ม"
                  >
                    {member.isDrinker ? (
                      <span className="text-amber-600 hover:text-amber-700 flex items-center gap-1">
                        <Wine className="w-3 h-3" />
                        สายดื่ม (หารเหล้า)
                      </span>
                    ) : (
                      <span className="text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
                        <Coffee className="w-3 h-3" />
                        ไม่ดื่ม (ไม่คิดเหล้า)
                      </span>
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => onToggleDrinker(member.id)}
                  className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                    member.isDrinker
                      ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                      : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                  }`}
                  title={member.isDrinker ? 'เปลี่ยนเป็นไม่ดื่ม' : 'เปลี่ยนเป็นคนดื่ม'}
                >
                  {member.isDrinker ? '🍺 ดื่ม' : '🥤 ไม่ดื่ม'}
                </button>

                <button
                  onClick={() => onRemoveMember(member.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                  title="ลบสมาชิกนี้"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

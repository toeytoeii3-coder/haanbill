/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Member, BillItem, BillSettings, BillRecord } from './types/bill';
import {
  PRESET_IZAKAYA,
  PRESET_MOOKATA,
  DEFAULT_AVATAR_COLORS,
} from './utils/presets';
import { calculateBill } from './utils/calculations';
import {
  saveStateToStorage,
  loadStateFromStorage,
  loadStateFromHash,
  getBillHistory,
  saveBillRecord,
  deleteBillRecord,
  clearBillHistory,
  generateRoomCode,
  syncRoomToServer,
  fetchRoomFromServer,
  uploadSlipToServer,
} from './utils/storage';
import { Header } from './components/Header';
import { MemberList } from './components/MemberList';
import { ItemList } from './components/ItemList';
import { BillAdjustments } from './components/BillAdjustments';
import { SummaryCards } from './components/SummaryCards';
import { ShareModal } from './components/ShareModal';
import { NewRoundModal } from './components/NewRoundModal';
import { HistoryModal } from './components/HistoryModal';
import { FriendViewModal } from './components/FriendViewModal';
import { RoomModal } from './components/RoomModal';
import { ConfirmDialog } from './components/ConfirmDialog';
import { UpdatePrompt } from './components/UpdatePrompt';
import {
  PlusCircle,
  History,
  Share2,
  Sparkles,
  Smartphone,
  Users,
  UserCheck,
  CreditCard,
  RefreshCw,
  FileText,
  Utensils,
  CheckCircle2,
  Edit3,
  ArrowRight,
  Receipt,
  QrCode,
  Trash2,
} from 'lucide-react';

export default function App() {
  // Check if loaded with shared hash or room parameter
  const hasHashOnLoad = typeof window !== 'undefined' && window.location.hash.length > 5;
  const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const initialRoomFromUrl = urlParams
    ? (urlParams.get('b') || urlParams.get('room') || urlParams.get('slip'))
    : null;
  const isDirectSlipView = urlParams
    ? (urlParams.get('view') === 'slip' || !!urlParams.get('slip'))
    : false;
  const initialMemberIdFromUrl = urlParams ? urlParams.get('m') || '' : '';

  // Initialize state from hash or storage or default izakaya preset
  const initialState = useMemo(() => {
    const hashState = loadStateFromHash();
    if (hashState && hashState.members?.length > 0) return hashState;
    const storedState = loadStateFromStorage();
    if (storedState) {
      if (storedState.hasReset) return storedState;
      if (storedState.members && storedState.members.length > 0) return storedState;
    }
    return PRESET_IZAKAYA;
  }, []);

  const [settings, setSettings] = useState<BillSettings>(() => ({
    ...initialState.settings,
    roomId: initialRoomFromUrl || initialState.settings.roomId || generateRoomCode(),
    roundNumber: initialState.settings.roundNumber || 1,
  }));
  const [members, setMembers] = useState<Member[]>(initialState.members);
  const [items, setItems] = useState<BillItem[]>(initialState.items);
  const [activeBillId, setActiveBillId] = useState<string>(() => 'bill_' + Date.now());

  // Mobile 5-Tab Navigation State ('open' | 'items' | 'payment' | 'summary' | 'history')
  const [activeMobileTab, setActiveMobileTab] = useState<'open' | 'items' | 'payment' | 'summary' | 'history'>('open');

  // Current Active User state (Who am I on this device?)
  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    return initialState.members[0]?.id || '';
  });

  // Selected member for Friend View
  const [selectedFriendMemberId, setSelectedFriendMemberId] = useState<string>(initialMemberIdFromUrl);

  // History state
  const [historyRecords, setHistoryRecords] = useState<BillRecord[]>(() => getBillHistory());

  // Multi-user Room state
  const currentRoomId = settings.roomId || 'HAAN-1001';
  const [isSyncingRoom, setIsSyncingRoom] = useState(false);

  // Modals
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isNewRoundModalOpen, setIsNewRoundModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isFriendViewOpen, setIsFriendViewOpen] = useState(hasHashOnLoad || isDirectSlipView || !!initialRoomFromUrl);
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [isSharedFromLink, setIsSharedFromLink] = useState(hasHashOnLoad || !!initialRoomFromUrl);
  const [isResetBillConfirmOpen, setIsResetBillConfirmOpen] = useState(false);

  // Sync state to local storage on change
  useEffect(() => {
    saveStateToStorage({ settings, members, items });
  }, [settings, members, items]);

  // Real-time calculation
  const calculationResult = useMemo(() => {
    return calculateBill(members, items, settings);
  }, [members, items, settings]);

  // Active user object
  const currentUser = members.find((m) => m.id === currentUserId) || members[0] || null;

  // Multi-user room server sync (debounced)
  useEffect(() => {
    if (members.length === 0 && items.length === 0) return;
    const timeout = setTimeout(() => {
      syncRoomToServer(currentRoomId, { settings, members, items });
    }, 800);
    return () => clearTimeout(timeout);
  }, [settings, members, items, currentRoomId]);

  // Fetch room if specified in URL query
  useEffect(() => {
    if (initialRoomFromUrl) {
      fetchRoomFromServer(initialRoomFromUrl).then((remoteState) => {
        if (remoteState && remoteState.members?.length > 0) {
          setSettings(remoteState.settings);
          setMembers(remoteState.members);
          setItems(remoteState.items || []);
          setIsSharedFromLink(true);
          setIsFriendViewOpen(true);
          if (initialMemberIdFromUrl) {
            setSelectedFriendMemberId(initialMemberIdFromUrl);
          }
        }
      });
    }
  }, [initialRoomFromUrl, initialMemberIdFromUrl]);

  // Auto archive current bill state whenever items or members change
  useEffect(() => {
    if (members.length === 0 && items.length === 0) return;

    const paidCount = members.filter((m) => m.hasPaid).length;
    const record: BillRecord = {
      id: activeBillId,
      title: settings.restaurantName.trim() || `รอบที่ ${settings.roundNumber || 1}`,
      date: settings.date || new Date().toISOString().split('T')[0],
      timestamp: Date.now(),
      roomId: currentRoomId,
      roundNumber: settings.roundNumber || 1,
      settings,
      members,
      items,
      grandTotal: calculationResult.grandTotal,
      paidCount,
      totalMembers: members.length,
    };

    saveBillRecord(record);
    setHistoryRecords(getBillHistory());
  }, [settings, members, items, calculationResult.grandTotal, activeBillId, currentRoomId]);

  // Handlers for members
  const handleAddMember = (name: string, isDrinker: boolean) => {
    const newId = 'm_' + Date.now();
    const avatarColor =
      DEFAULT_AVATAR_COLORS[members.length % DEFAULT_AVATAR_COLORS.length];
    const newMember: Member = {
      id: newId,
      name,
      isDrinker,
      avatarColor,
      hasPaid: false,
    };
    const updatedMembers = [...members, newMember];
    setMembers(updatedMembers);

    if (isDrinker) {
      setItems((prevItems) =>
        prevItems.map((item) => {
          if (item.category === 'alcohol') {
            return {
              ...item,
              assignedMemberIds: [...item.assignedMemberIds, newId],
            };
          }
          if (item.category === 'food' || item.category === 'communal') {
            return {
              ...item,
              assignedMemberIds: [...item.assignedMemberIds, newId],
            };
          }
          return item;
        })
      );
    } else {
      setItems((prevItems) =>
        prevItems.map((item) => {
          if (item.category === 'food' || item.category === 'communal') {
            return {
              ...item,
              assignedMemberIds: [...item.assignedMemberIds, newId],
            };
          }
          return item;
        })
      );
    }
  };

  const handleToggleDrinker = (memberId: string) => {
    setMembers((prev) =>
      prev.map((m) => {
        if (m.id !== memberId) return m;
        const newStatus = !m.isDrinker;
        return { ...m, isDrinker: newStatus };
      })
    );

    const targetMember = members.find((m) => m.id === memberId);
    if (!targetMember) return;
    const willBeDrinker = !targetMember.isDrinker;

    setItems((prevItems) =>
      prevItems.map((item) => {
        if (item.category === 'alcohol') {
          if (willBeDrinker) {
            return {
              ...item,
              assignedMemberIds: item.assignedMemberIds.includes(memberId)
                ? item.assignedMemberIds
                : [...item.assignedMemberIds, memberId],
            };
          } else {
            return {
              ...item,
              assignedMemberIds: item.assignedMemberIds.filter((id) => id !== memberId),
            };
          }
        }
        return item;
      })
    );
  };

  const handleRemoveMember = (memberId: string) => {
    setMembers((prev) => prev.filter((m) => m.id !== memberId));
    setItems((prevItems) =>
      prevItems.map((it) => ({
        ...it,
        assignedMemberIds: it.assignedMemberIds.filter((id) => id !== memberId),
      }))
    );
  };

  const handleUpdateMemberName = (memberId: string, name: string) => {
    setMembers((prev) =>
      prev.map((m) => (m.id === memberId ? { ...m, name } : m))
    );
  };

  const handleTogglePaid = (memberId: string) => {
    setMembers((prev) =>
      prev.map((m) => (m.id === memberId ? { ...m, hasPaid: !m.hasPaid } : m))
    );
  };

  const handleUploadSlip = async (memberId: string, slipImageUrl: string) => {
    setMembers((prev) =>
      prev.map((m) =>
        m.id === memberId
          ? {
              ...m,
              slipImageUrl,
              slipUploadedAt: Date.now(),
              hasPaid: true,
            }
          : m
      )
    );

    if (currentRoomId) {
      await uploadSlipToServer(currentRoomId, memberId, slipImageUrl);
    }
  };

  // Handlers for items
  const handleAddItem = (newItem: Omit<BillItem, 'id'>) => {
    const itemWithId: BillItem = {
      ...newItem,
      id: 'i_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    };
    setItems((prev) => [...prev, itemWithId]);
  };

  const handleUpdateItem = (id: string, updated: Partial<BillItem>) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, ...updated } : it))
    );
  };

  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const handleBatchAddItems = (newItems: BillItem[]) => {
    setItems((prev) => [...prev, ...newItems]);
  };

  // Presets and resets
  const handleLoadPreset = (presetType: 'izakaya' | 'mookata') => {
    const preset = presetType === 'izakaya' ? PRESET_IZAKAYA : PRESET_MOOKATA;
    setActiveBillId('bill_' + Date.now());
    setSettings({
      ...preset.settings,
      roomId: generateRoomCode(),
      roundNumber: 1,
    });
    setMembers(preset.members);
    setItems(preset.items);
    setCurrentUserId(preset.members[0]?.id || '');
    setIsSharedFromLink(false);
  };

  const handleResetBill = () => {
    setIsResetBillConfirmOpen(true);
  };

  const handleConfirmResetBill = () => {
    const newBillId = 'bill_' + Date.now();
    setActiveBillId(newBillId);
    const newRoom = generateRoomCode();
    const cleanSettings: BillSettings = {
      restaurantName: '',
      date: new Date().toISOString().split('T')[0],
      roomId: newRoom,
      roundNumber: 1,
      serviceChargeRate: 0,
      vatRate: 0,
      discountType: 'percentage',
      discountValue: 0,
      roundingMode: 'exact',
      promptPayId: '',
      accountName: '',
      bankName: '',
    };
    setSettings(cleanSettings);
    setMembers([]);
    setItems([]);
    setCurrentUserId('');
    setSelectedFriendMemberId('');
    window.location.hash = '';
    setIsSharedFromLink(false);

    saveStateToStorage({
      settings: cleanSettings,
      members: [],
      items: [],
      hasReset: true,
    });
  };

  const handleConfirmNewRound = (mode: 'keep_members' | 'fresh', newVenueName: string) => {
    const nextRoundNumber = (settings.roundNumber || 1) + 1;
    const newBillId = 'bill_' + Date.now();
    setActiveBillId(newBillId);

    if (mode === 'keep_members') {
      setSettings((prev) => ({
        ...prev,
        restaurantName: newVenueName || `ร้านรอบที่ ${nextRoundNumber}`,
        roundNumber: nextRoundNumber,
        date: new Date().toISOString().split('T')[0],
        discountValue: 0,
      }));
      setMembers((prev) => prev.map((m) => ({ ...m, hasPaid: false })));
      setItems([]);
    } else {
      setSettings({
        restaurantName: newVenueName || 'บิลใหม่',
        date: new Date().toISOString().split('T')[0],
        roomId: generateRoomCode(),
        roundNumber: 1,
        serviceChargeRate: 0,
        vatRate: 0,
        discountType: 'percentage',
        discountValue: 0,
        roundingMode: 'exact',
        promptPayId: settings.promptPayId,
        accountName: settings.accountName,
        bankName: settings.bankName,
      });
      setMembers([]);
      setItems([]);
    }
    setActiveMobileTab('open');
  };

  // History select/delete/clear
  const handleSelectRecord = (record: BillRecord) => {
    setActiveBillId(record.id);
    setSettings(record.settings);
    setMembers(record.members);
    setItems(record.items);
    setActiveMobileTab('summary');
  };

  const handleDeleteRecord = (id: string) => {
    deleteBillRecord(id);
    setHistoryRecords(getBillHistory());
  };

  const handleClearHistory = () => {
    clearBillHistory();
    setHistoryRecords([]);
  };

  const handleJoinRoom = async (targetRoomId: string): Promise<boolean> => {
    setIsSyncingRoom(true);
    const remoteState = await fetchRoomFromServer(targetRoomId);
    setIsSyncingRoom(false);

    if (remoteState && remoteState.members?.length > 0) {
      setSettings({
        ...remoteState.settings,
        roomId: targetRoomId,
      });
      setMembers(remoteState.members);
      setItems(remoteState.items || []);
      setCurrentUserId(remoteState.members[0]?.id || '');
      setIsSharedFromLink(true);
      return true;
    }
    return false;
  };

  const handleCreateNewRoom = () => {
    const newRoom = generateRoomCode();
    setSettings((prev) => ({ ...prev, roomId: newRoom }));
  };

  const handleSyncNow = async () => {
    if (currentRoomId) {
      await fetchRoomFromServer(currentRoomId);
    }
  };

  if (isDirectSlipView) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 selection:bg-amber-100 selection:text-amber-900">
        <div className="w-full max-w-lg space-y-4">
          <div className="text-center">
            <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full inline-block mb-2 border border-amber-500/30">
              HaanBill · สรุปยอดและแนบสลิปส่วนตัว
            </span>
            <h1 className="text-xl font-extrabold text-white truncate">
              {settings.restaurantName || 'บิลมื้อนี้'} · รอบที่ {settings.roundNumber || 1}
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              ตรวจสอบยอดที่ต้องชำระ สแกนจ่ายพร้อมเพย์ และแนบสลิปโอนเงินได้ทันที
            </p>
          </div>

          <FriendViewModal
            isOpen={true}
            onClose={() => {
              window.location.href = window.location.pathname + (currentRoomId ? `?b=${currentRoomId}` : '');
            }}
            calculation={calculationResult}
            settings={settings}
            onTogglePaid={handleTogglePaid}
            onUploadSlip={handleUploadSlip}
            initialMemberId={initialMemberIdFromUrl}
            isDirectSlipLink={true}
            inline={true}
          />

          <div className="text-center pt-2">
            <a
              href="/"
              className="text-xs text-slate-400 hover:text-white transition-colors underline"
            >
              ต้องการสร้างบิลหารค่าใช้จ่ายของคุณเอง? (คลิกที่นี่)
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-28 selection:bg-amber-100 selection:text-amber-900">
      <UpdatePrompt />
      {/* Header conforming to Top Bar Contract */}
      <Header
        onOpenShare={() => setIsShareModalOpen(true)}
        onOpenNewRound={() => setIsNewRoundModalOpen(true)}
        onOpenHistory={() => {
          setActiveMobileTab('history');
          setIsHistoryModalOpen(true);
        }}
        onOpenRoom={() => setIsRoomModalOpen(true)}
        currentRoomId={currentRoomId}
        currentUser={currentUser}
        onOpenFriendMode={() => setIsFriendViewOpen(true)}
        historyCount={historyRecords.length}
        currentRoundNumber={settings.roundNumber || 1}
        onReset={handleResetBill}
        onLoadPreset={handleLoadPreset}
      />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">




        {/* Tab 1: เปิดบิล & สมาชิก */}
        {activeMobileTab === 'open' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Bill Info Card */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">เปิดบิล / ข้อมูลร้านหรือชื่องาน</h2>
                  <p className="text-xs text-slate-500">ตั้งชื่อร้าน ชื่องาน หรือรอบบิลสำหรับมื้อนี้</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    ชื่อร้าน / ชื่องาน / ปาร์ตี้
                  </label>
                  <input
                    type="text"
                    value={settings.restaurantName}
                    onChange={(e) => setSettings({ ...settings, restaurantName: e.target.value })}
                    placeholder="เช่น อิซากายะ ทองหล่อ, หมูกระทะบ้านเพื่อน"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">วันที่</label>
                    <input
                      type="date"
                      value={settings.date}
                      onChange={(e) => setSettings({ ...settings, date: e.target.value })}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">รอบที่</label>
                    <input
                      type="number"
                      min={1}
                      value={settings.roundNumber || 1}
                      onChange={(e) => setSettings({ ...settings, roundNumber: parseInt(e.target.value) || 1 })}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Member List component */}
            <MemberList
              members={members}
              onAddMember={handleAddMember}
              onToggleDrinker={handleToggleDrinker}
              onRemoveMember={handleRemoveMember}
              onUpdateMemberName={handleUpdateMemberName}
            />


          </div>
        )}

        {/* Tab 2: รายการอาหาร & ภาษีส่วนลด */}
        {activeMobileTab === 'items' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <ItemList
              items={items}
              members={members}
              onAddItem={handleAddItem}
              onUpdateItem={handleUpdateItem}
              onRemoveItem={handleRemoveItem}
              onBatchAddItems={handleBatchAddItems}
            />

            <BillAdjustments
              settings={settings}
              onChangeSettings={(newSettings) => setSettings(newSettings)}
            />


          </div>
        )}

        {/* Tab 3: ตั้งค่าช่องทางรับเงิน (PromptPay / บัญชีธนาคาร) */}
        {activeMobileTab === 'payment' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">ตั้งค่าช่องทางรับเงิน (PromptPay / บัญชีธนาคาร)</h2>
                  <p className="text-xs text-slate-500">กรอกเบอร์พร้อมเพย์หรือเลขบัญชีเพื่อให้เพื่อนๆ สแกนโอนเงินได้ถูกต้อง</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    เบอร์โทรศัพท์พร้อมเพย์ หรือ เลขประจำตัวผู้เสียภาษี
                  </label>
                  <input
                    type="text"
                    value={settings.promptPayId}
                    onChange={(e) => setSettings({ ...settings, promptPayId: e.target.value })}
                    placeholder="เช่น 0812345678 หรือ 13 หลัก"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    ชื่อบัญชี (เจ้าของพร้อมเพย์)
                  </label>
                  <input
                    type="text"
                    value={settings.accountName}
                    onChange={(e) => setSettings({ ...settings, accountName: e.target.value })}
                    placeholder="เช่น นาย สมชาย ใจดี"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    ธนาคาร (ถ้ามี)
                  </label>
                  <select
                    value={settings.bankName || 'กสิกรไทย'}
                    onChange={(e) => setSettings({ ...settings, bankName: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
                  >
                    <option value="กสิกรไทย">กสิกรไทย (KBANK)</option>
                    <option value="ไทยพาณิชย์">ไทยพาณิชย์ (SCB)</option>
                    <option value="กรุงเทพ">กรุงเทพ (BBL)</option>
                    <option value="กรุงไทย">กรุงไทย (KTB)</option>
                    <option value="กรุงศรีอยุธยา">กรุงศรีอยุธยา (BAY)</option>
                    <option value="ทีทีบี">ทีทีบี (TTB)</option>
                    <option value="พร้อมเพย์">พร้อมเพย์ (PromptPay)</option>
                  </select>
                </div>
              </div>

              {/* QR Preview Card */}
              {settings.promptPayId.trim() && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-center gap-4">
                  <div className="w-24 h-24 bg-white p-2 rounded-xl shadow-xs border border-slate-200 flex items-center justify-center shrink-0">
                    <QrCode className="w-20 h-20 text-slate-900" />
                  </div>
                  <div className="text-center sm:text-left">
                    <span className="text-xs font-bold text-emerald-600 block mb-0.5">✓ พร้อมสร้าง QR พร้อมเพย์อัตโนมัติ</span>
                    <h4 className="font-bold text-sm text-slate-900">{settings.accountName || 'บัญชีรับเงิน'}</h4>
                    <p className="text-xs text-slate-600 font-mono mt-0.5">พร้อมเพย์: {settings.promptPayId} ({settings.bankName || 'PromptPay'})</p>
                    <p className="text-[11px] text-slate-400 mt-1">เพื่อนสามารถสแกนจ่ายหรือคลิกดูสลิปยืนยันได้ทันที</p>
                  </div>
                </div>
              )}
            </div>


          </div>
        )}

        {/* Tab 4: สรุปยอดรายคน (แยกลูกค้าดื่ม/ไม่ดื่ม) พร้อมปุ่มแก้ไขและสถานะ */}
        {activeMobileTab === 'summary' && (
          <div className="space-y-6 animate-in fade-in duration-200">


            {/* Summary Cards Component */}
            <SummaryCards
              calculation={calculationResult}
              settings={settings}
              onTogglePaid={handleTogglePaid}
            />


          </div>
        )}

        {/* Tab 5: ประวัติบิลย้อนหลัง */}
        {activeMobileTab === 'history' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                    <History className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">5. ประวัติบิลย้อนหลังแต่ละรอบ</h2>
                    <p className="text-xs text-slate-500">บันทึกทั้งหมด {historyRecords.length} บิล</p>
                  </div>
                </div>

                {historyRecords.length > 0 && (
                  <button
                    onClick={handleClearHistory}
                    className="px-3 py-1.5 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors cursor-pointer"
                  >
                    ล้างประวัติทั้งหมด
                  </button>
                )}
              </div>

              {historyRecords.length === 0 ? (
                <div className="py-16 text-center text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-2xl">
                  ยังไม่มีประวัติบิล บิลจะถูกบันทึกอัตโนมัติเมื่อมีการเพิ่มรายการอาหารหรือสมาชิก
                </div>
              ) : (
                <div className="space-y-3">
                  {historyRecords.map((record) => {
                    const isActive = record.id === activeBillId;
                    const dateStr = new Date(record.timestamp).toLocaleDateString('th-TH', {
                      day: 'numeric',
                      month: 'short',
                      year: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    return (
                      <div
                        key={record.id}
                        className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          isActive
                            ? 'bg-indigo-50/50 border-indigo-200 shadow-sm'
                            : 'bg-slate-50 hover:bg-slate-100/80 border-slate-200'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm text-slate-900">{record.title}</span>
                            <span className="text-[11px] font-semibold px-2 py-0.5 bg-white border border-slate-200 rounded-full text-slate-600">
                              รอบที่ {record.roundNumber}
                            </span>
                            {isActive && (
                              <span className="text-[11px] font-bold px-2 py-0.5 bg-indigo-600 text-white rounded-full">
                                กำลังดูอยู่
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                            <span>📅 {dateStr}</span>
                            <span>·</span>
                            <span>👥 {record.totalMembers} คน</span>
                            <span>·</span>
                            <span className="text-slate-900 font-bold">฿{record.grandTotal.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleSelectRecord(record)}
                            className="px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
                          >
                            เปิดดูบิลนี้
                          </button>
                          <button
                            onClick={() => handleDeleteRecord(record.id)}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                            title="ลบบิลนี้ออกจากประวัติ"
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


          </div>
        )}
      </main>



      {/* Modals */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        calculation={calculationResult}
        settings={settings}
        items={items}
      />

      <NewRoundModal
        isOpen={isNewRoundModalOpen}
        onClose={() => setIsNewRoundModalOpen(false)}
        currentSettings={settings}
        currentMembers={members}
        onConfirmNewRound={handleConfirmNewRound}
      />

      <HistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        historyRecords={historyRecords}
        activeBillId={activeBillId}
        onSelectRecord={(rec) => {
          handleSelectRecord(rec);
          setIsHistoryModalOpen(false);
        }}
        onDeleteRecord={handleDeleteRecord}
        onClearHistory={handleClearHistory}
        currentSettings={settings}
      />

      <FriendViewModal
        isOpen={isFriendViewOpen}
        onClose={() => setIsFriendViewOpen(false)}
        calculation={calculationResult}
        settings={settings}
        onTogglePaid={handleTogglePaid}
        onUploadSlip={handleUploadSlip}
        initialMemberId={selectedFriendMemberId || currentUserId}
      />

      <RoomModal
        isOpen={isRoomModalOpen}
        onClose={() => setIsRoomModalOpen(false)}
        currentRoomId={currentRoomId}
        onJoinRoom={handleJoinRoom}
        onCreateNewRoom={handleCreateNewRoom}
        onSyncNow={handleSyncNow}
        isSyncing={isSyncingRoom}
      />

      <ConfirmDialog
        isOpen={isResetBillConfirmOpen}
        title="ล้างบิลและข้อมูลทั้งหมด?"
        message="การดำเนินการนี้จะล้างสมาชิก รายการอาหาร และตั้งค่าบิลใหม่ทั้งหมด คุณแน่ใจหรือไม่?"
        confirmText="ล้างข้อมูลทันที"
        cancelText="ยกเลิก"
        onConfirm={() => {
          handleConfirmResetBill();
          setIsResetBillConfirmOpen(false);
        }}
        onClose={() => setIsResetBillConfirmOpen(false)}
      />

      {/* Floating Dark Capsule Bottom Navigation Bar (iPhone Style) */}
      <nav
        aria-label="เมนูหลัก"
        className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-1.5rem)] max-w-md bg-zinc-900/95 backdrop-blur-2xl border border-white/10 rounded-full p-1.5 shadow-[0_16px_40px_rgba(0,0,0,0.55)] flex items-center justify-between"
      >
        {[
          { id: 'open', label: 'เปิดบิล', icon: FileText },
          { id: 'items', label: 'รายการ', icon: Utensils },
          { id: 'payment', label: 'พร้อมเพย์', icon: CreditCard },
          { id: 'summary', label: 'สรุปยอด', icon: Receipt },
          { id: 'history', label: 'ประวัติ', icon: History },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeMobileTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveMobileTab(tab.id as typeof activeMobileTab)}
              className={`flex flex-col items-center justify-center flex-1 py-1.5 px-1 rounded-full transition-all duration-200 cursor-pointer active:scale-95 ${
                isActive
                  ? 'bg-white text-zinc-950 font-bold shadow-md'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/5'
              }`}
            >
              <Icon className="w-4 h-4 sm:w-5 sm:h-5 mb-0.5" />
              <span className="text-[10px] tracking-tight whitespace-nowrap">
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

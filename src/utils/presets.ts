import { Member, BillItem, BillSettings } from '../types/bill';

export const DEFAULT_AVATAR_COLORS = [
  'bg-emerald-500',
  'bg-amber-500',
  'bg-indigo-500',
  'bg-rose-500',
  'bg-cyan-500',
  'bg-violet-500',
  'bg-orange-500',
  'bg-teal-500',
];

export const PRESET_IZAKAYA: {
  settings: BillSettings;
  members: Member[];
  items: BillItem[];
} = {
  settings: {
    restaurantName: 'อิซากายะ โตเกียวบาร์ (สาขาทองหล่อ)',
    date: new Date().toISOString().split('T')[0],
    serviceChargeRate: 10,
    vatRate: 7,
    discountType: 'percentage',
    discountValue: 0,
    roundingMode: 'exact',
    promptPayId: '0812345678',
    accountName: 'สมชาย ใจดี',
    bankName: 'กสิกรไทย (KBANK)',
  },
  members: [
    { id: 'm1', name: 'บอส', isDrinker: true, avatarColor: 'bg-emerald-500', hasPaid: false },
    { id: 'm2', name: 'ต้น', isDrinker: true, avatarColor: 'bg-amber-500', hasPaid: false },
    { id: 'm3', name: 'กานต์', isDrinker: true, avatarColor: 'bg-indigo-500', hasPaid: false },
    { id: 'm4', name: 'มีน (ขับรถ)', isDrinker: false, avatarColor: 'bg-rose-500', hasPaid: false },
  ],
  items: [
    {
      id: 'i1',
      name: 'เบียร์สด อาซาฮี ทาวเวอร์',
      price: 790,
      quantity: 2,
      category: 'alcohol',
      assignedMemberIds: ['m1', 'm2', 'm3'], // drinkers only
    },
    {
      id: 'i2',
      name: 'ยูซุไฮบอล (Yuzu Highball)',
      price: 180,
      quantity: 2,
      category: 'alcohol',
      assignedMemberIds: ['m1', 'm2'], // only boss and ton
    },
    {
      id: 'i3',
      name: 'ชาเขียวข้าวคั่วเย็น (รีฟิล)',
      price: 55,
      quantity: 1,
      category: 'custom',
      assignedMemberIds: ['m4'], // only meen (non-drinker)
    },
    {
      id: 'i4',
      name: 'ซาชิมิรวม 5 อย่าง (Chef Special)',
      price: 680,
      quantity: 1,
      category: 'food',
      assignedMemberIds: ['m1', 'm2', 'm3', 'm4'], // all
    },
    {
      id: 'i5',
      name: 'ไก่ย่างยากิโทริรวม 10 ไม้',
      price: 360,
      quantity: 1,
      category: 'food',
      assignedMemberIds: ['m1', 'm2', 'm3', 'm4'], // all
    },
    {
      id: 'i6',
      name: 'ข้าวผัดกระเทียมเนื้อวากิว',
      price: 220,
      quantity: 2,
      category: 'food',
      assignedMemberIds: ['m1', 'm2', 'm3', 'm4'], // all
    },
    {
      id: 'i7',
      name: 'ถั่วแระญี่ปุ่น & น้ำแข็ง',
      price: 80,
      quantity: 2,
      category: 'communal',
      assignedMemberIds: ['m1', 'm2', 'm3', 'm4'], // all
    },
  ],
};

export const PRESET_MOOKATA: {
  settings: BillSettings;
  members: Member[];
  items: BillItem[];
} = {
  settings: {
    restaurantName: 'ริมน้ำหมูกระทะ & คราฟต์เบียร์',
    date: new Date().toISOString().split('T')[0],
    serviceChargeRate: 0,
    vatRate: 0,
    discountType: 'amount',
    discountValue: 100,
    roundingMode: 'roundHalf',
    promptPayId: '0959876543',
    accountName: 'ชลธิชา บุญช่วย',
    bankName: 'ไทยพาณิชย์ (SCB)',
  },
  members: [
    { id: 'mk1', name: 'แป้ง', isDrinker: true, avatarColor: 'bg-emerald-500', hasPaid: true },
    { id: 'mk2', name: 'เจมส์', isDrinker: true, avatarColor: 'bg-cyan-500', hasPaid: false },
    { id: 'mk3', name: 'พลอย', isDrinker: false, avatarColor: 'bg-rose-500', hasPaid: false },
    { id: 'mk4', name: 'โบว์', isDrinker: false, avatarColor: 'bg-violet-500', hasPaid: false },
    { id: 'mk5', name: 'มาร์ค', isDrinker: true, avatarColor: 'bg-orange-500', hasPaid: false },
  ],
  items: [
    {
      id: 'mki1',
      name: 'หมูกระทะชุดใหญ่พิเศษ 3 ถาด',
      price: 499,
      quantity: 2,
      category: 'food',
      assignedMemberIds: ['mk1', 'mk2', 'mk3', 'mk4', 'mk5'],
    },
    {
      id: 'mki2',
      name: 'เบียร์ช้างขวดใหญ่ (ชุดโปร 3 ขวด)',
      price: 270,
      quantity: 3,
      category: 'alcohol',
      assignedMemberIds: ['mk1', 'mk2', 'mk5'], // drinkers
    },
    {
      id: 'mki3',
      name: 'น้ำแข็งถังใหญ่ 2 ถัง',
      price: 35,
      quantity: 2,
      category: 'communal',
      assignedMemberIds: ['mk1', 'mk2', 'mk3', 'mk4', 'mk5'],
    },
    {
      id: 'mki4',
      name: 'น้ำอัดลม 1.5 ลิตร (2 ขวด)',
      price: 45,
      quantity: 2,
      category: 'food',
      assignedMemberIds: ['mk1', 'mk2', 'mk3', 'mk4', 'mk5'],
    },
    {
      id: 'mki5',
      name: 'กุ้งแม่น้ำเผา 1 กิโลกรัม',
      price: 450,
      quantity: 1,
      category: 'food',
      assignedMemberIds: ['mk1', 'mk2', 'mk3', 'mk4', 'mk5'],
    },
  ],
};

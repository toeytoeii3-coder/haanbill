export type ItemCategory = 'alcohol' | 'food' | 'communal' | 'custom';

export interface Member {
  id: string;
  name: string;
  isDrinker: boolean; // true = drinks alcohol, false = non-drinker
  avatarColor: string;
  promptPayId?: string; // PromptPay or phone for receiving money
  accountName?: string;
  bankName?: string;
  hasPaid?: boolean;
  slipImageUrl?: string; // Uploaded payment slip image
  slipUploadedAt?: number;
}

export interface BillItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category: ItemCategory;
  assignedMemberIds: string[]; // IDs of members sharing this item
  paidByMemberId?: string; // ID of member who paid for this item upfront (defaults to first member)
}

export type DiscountType = 'percentage' | 'amount';
export type RoundingMode = 'exact' | 'roundUp' | 'roundHalf';

export interface BillSettings {
  restaurantName: string;
  date: string;
  roomId?: string; // e.g. "ROOM-8821" for multi-user sync
  roundNumber?: number; // e.g. 1, 2, 3...
  roundNote?: string;
  serviceChargeRate: number; // e.g. 10 for 10%
  vatRate: number; // e.g. 7 for 7%
  discountType: DiscountType;
  discountValue: number; // percentage or fixed baht
  roundingMode: RoundingMode;
  promptPayId: string; // Default host phone/ID
  accountName: string;
  bankName: string;
}

export interface PersonBreakdown {
  member: Member;
  foodShare: number;
  alcoholShare: number;
  communalShare: number;
  customShare: number;
  subtotal: number;
  discountShare: number;
  serviceChargeShare: number;
  vatShare: number;
  total: number;
  itemDetails: {
    itemName: string;
    category: ItemCategory;
    cost: number;
    splitWithCount: number;
  }[];
}

export interface UserBalance {
  member: Member;
  totalPaid: number; // Total amount this member paid upfront for the group
  fairShare: number; // Total amount this member actually owes based on consumption
  netBalance: number; // totalPaid - fairShare: > 0 means creditor (receives), < 0 means debtor (pays)
}

export interface SettlementTransfer {
  fromMember: Member;
  toMember: Member;
  amount: number;
}

export interface BillCalculationResult {
  rawSubtotal: number;
  foodSubtotal: number;
  alcoholSubtotal: number;
  communalSubtotal: number;
  customSubtotal: number;
  discountAmount: number;
  netSubtotal: number;
  serviceChargeAmount: number;
  vatAmount: number;
  grandTotal: number;
  breakdowns: PersonBreakdown[];
  userBalances: UserBalance[];
  settlements: SettlementTransfer[];
  multiplePayersActive: boolean;
}

export interface BillRecord {
  id: string;
  title: string;
  date: string;
  timestamp: number;
  roomId?: string;
  roundNumber: number;
  settings: BillSettings;
  members: Member[];
  items: BillItem[];
  grandTotal: number;
  paidCount: number;
  totalMembers: number;
}

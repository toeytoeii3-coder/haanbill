import { BillItem, ItemCategory } from '../types/bill';

const ALCOHOL_KEYWORDS = [
  'เบียร์',
  'เหล้า',
  'ไวน์',
  'วอดก้า',
  'วิสกี้',
  'ไฮบอล',
  'โซจู',
  'บ๊วย',
  'สาเก',
  'ทาวเวอร์',
  'เหยือก',
  'ค็อกเทล',
  'ม็อกเทล',
  'สิงห์',
  'ช้าง',
  'ลีโอ',
  'ไฮเนเก้น',
  'โฮการ์เด้น',
  'อาซาฮี',
  'beer',
  'wine',
  'whisky',
  'whiskey',
  'vodka',
  'soju',
  'cocktail',
  'tower',
  'asahi',
  'heineken',
  'singha',
  'chang',
  'leo',
  'sake',
  'highball',
  'jinro',
  'spy',
  'smirnoff',
  'hoegaarden',
];

const COMMUNAL_KEYWORDS = [
  'น้ำแข็ง',
  'มิกเซอร์',
  'ทิชชู่',
  'โซดา',
  'น้ำเปล่า',
  'ผ้าเย็น',
  'เปิดขวด',
  'ค่าเปิด',
  'ice',
  'mixer',
  'water',
  'soda',
  'corkage',
];

export function detectCategory(name: string): ItemCategory {
  const lower = name.toLowerCase();
  for (const kw of ALCOHOL_KEYWORDS) {
    if (lower.includes(kw)) return 'alcohol';
  }
  for (const kw of COMMUNAL_KEYWORDS) {
    if (lower.includes(kw)) return 'communal';
  }
  return 'food';
}

/**
 * Parses multi-line text input like:
 * "เบียร์ช้าง 3 360"
 * "หมูกระทะ 1 499"
 * "น้ำแข็ง 2 ถัง 50"
 */
export function parsePastedItems(
  text: string,
  drinkerMemberIds: string[],
  allMemberIds: string[]
): BillItem[] {
  const lines = text.split('\n');
  const items: BillItem[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Try finding price at the end or preceded by number
    // Match name, optional quantity, and total price
    // E.g. "เบียร์สิงห์ 2 300" or "ยำมาม่า 120" or "ข้าวกะเพรา 2 จาน 160"
    const numberMatches = trimmed.match(/(\d+(\.\d+)?)/g);

    let price = 0;
    let quantity = 1;
    let name = trimmed;

    if (numberMatches && numberMatches.length >= 2) {
      // Last number is likely price, second to last could be quantity if <= 50
      const lastNum = parseFloat(numberMatches[numberMatches.length - 1]);
      const prevNum = parseFloat(numberMatches[numberMatches.length - 2]);

      if (prevNum > 0 && prevNum <= 100 && lastNum > 0) {
        quantity = prevNum;
        price = lastNum / quantity; // treat last number as subtotal or per unit
        // Remove numbers from the name
        name = trimmed.replace(numberMatches[numberMatches.length - 1], '').replace(numberMatches[numberMatches.length - 2], '').trim();
      } else {
        price = lastNum;
        name = trimmed.replace(numberMatches[numberMatches.length - 1], '').trim();
      }
    } else if (numberMatches && numberMatches.length === 1) {
      price = parseFloat(numberMatches[0]);
      name = trimmed.replace(numberMatches[0], '').trim();
    }

    // Clean up trailing dashes, commas, x, or words
    name = name.replace(/[xX*:\-–]/g, ' ').replace(/\s+/g, ' ').trim();
    if (!name) name = 'รายการไม่ระบุชื่อ';

    const category = detectCategory(name);
    let assigned = allMemberIds;
    if (category === 'alcohol' && drinkerMemberIds.length > 0) {
      assigned = drinkerMemberIds;
    }

    items.push({
      id: 'item_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      name,
      price: Math.max(0, Math.round(price * 100) / 100),
      quantity: Math.max(1, quantity),
      category,
      assignedMemberIds: assigned,
    });
  }

  return items;
}

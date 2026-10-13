import { BillCalculationResult, BillSettings } from '../types/bill';

export function generateGroupShareText(
  result: BillCalculationResult,
  settings: BillSettings
): string {
  const lines: string[] = [];

  const restaurant = settings.restaurantName.trim() || 'ปาร์ตี้มื้อนี้';
  lines.push(`🧾 สรุปหารบิล: ${restaurant} 🍻`);
  if (settings.date) {
    lines.push(`📅 วันที่: ${settings.date}`);
  }
  lines.push(`💰 ยอดรวมทั้งโต๊ะ: ${result.grandTotal.toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท`);

  if (result.discountAmount > 0) {
    lines.push(`🏷️ ส่วนลดรวม: -${result.discountAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท`);
  }
  if (result.serviceChargeAmount > 0 || result.vatAmount > 0) {
    const taxParts: string[] = [];
    if (result.serviceChargeAmount > 0) taxParts.push(`SC ${settings.serviceChargeRate}%`);
    if (result.vatAmount > 0) taxParts.push(`VAT ${settings.vatRate}%`);
    lines.push(`⚙️ คิดรวม: ${taxParts.join(' + ')}`);
  }

  lines.push('----------------------------------------');
  lines.push('👥 ยอดแยกรายคน:');

  result.breakdowns.forEach((p, idx) => {
    const drinkerTag = p.member.isDrinker ? '🍺 สายดื่ม' : '🥤 ไม่ดื่มแอลฯ';
    lines.push(`\n${idx + 1}. ${p.member.name} (${drinkerTag})`);
    lines.push(`   👉 ยอดโอน: *${p.total.toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท*`);

    const itemDetails: string[] = [];
    if (p.foodShare > 0) itemDetails.push(`อาหาร ${p.foodShare.toFixed(2)}บ.`);
    if (p.alcoholShare > 0) itemDetails.push(`เหล้า/เบียร์ ${p.alcoholShare.toFixed(2)}บ.`);
    if (p.communalShare > 0) itemDetails.push(`ส่วนกลาง ${p.communalShare.toFixed(2)}บ.`);
    if (p.customShare > 0) itemDetails.push(`รายการเฉพาะ ${p.customShare.toFixed(2)}บ.`);
    if (p.serviceChargeShare > 0 || p.vatShare > 0) {
      itemDetails.push(`SC+VAT ${(p.serviceChargeShare + p.vatShare).toFixed(2)}บ.`);
    }

    if (itemDetails.length > 0) {
      lines.push(`   (แจกแจง: ${itemDetails.join(', ')})`);
    }
  });

  // Multi-Payer Settlement section
  if (result.multiplePayersActive && result.settlements.length > 0) {
    lines.push('\n----------------------------------------');
    lines.push('🤝 สรุปการโอนเงิน (หักกลบลบหนี้หลายคนจ่าย):');
    result.settlements.forEach((s) => {
      lines.push(`• ${s.fromMember.name} 👉 โอนให้ ${s.toMember.name}: *${s.amount.toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท*`);
    });
  }

  lines.push('\n----------------------------------------');

  if (settings.promptPayId.trim()) {
    lines.push(`📲 ช่องทางโอนเงิน (PromptPay / บัญชี):`);
    lines.push(`• เลขบัญชี / พร้อมเพย์: ${settings.promptPayId.trim()}`);
    if (settings.accountName.trim()) {
      lines.push(`• ชื่อบัญชี: ${settings.accountName.trim()}`);
    }
    if (settings.bankName.trim()) {
      lines.push(`• ธนาคาร: ${settings.bankName.trim()}`);
    }
  }

  lines.push(`\nโอนแล้วส่งสลิปในแชทนี้ได้เลยน้า ขอบคุณทุกคนมากๆ ครับ/ค่ะ! 🙏✨`);

  return lines.join('\n');
}

export function generateIndividualShareText(
  person: BillCalculationResult['breakdowns'][0],
  settings: BillSettings
): string {
  const lines: string[] = [];
  const restaurant = settings.restaurantName.trim() || 'ปาร์ตี้';

  lines.push(`👋 สวัสดีครับ/ค่ะ คุณ ${person.member.name}`);
  lines.push(`🧾 สรุปค่าใช้จ่ายมื้อ "${restaurant}":`);
  lines.push(`👉 ยอดที่ต้องโอน: *${person.total.toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท*`);
  
  if (!person.member.isDrinker) {
    lines.push(`(🥤 คิดเฉพาะค่าอาหารและส่วนกลาง ไม่รวมค่าแอลกอฮอล์)`);
  } else {
    lines.push(`(🍺 รวมค่าอาหารและเครื่องดื่มแอลกอฮอล์แล้ว)`);
  }

  if (settings.promptPayId.trim()) {
    lines.push(`\n📲 โอนได้ที่ พร้อมเพย์/บัญชี:`);
    lines.push(`เลข: ${settings.promptPayId.trim()}`);
    if (settings.accountName.trim()) lines.push(`ชื่อ: ${settings.accountName.trim()}`);
    if (settings.bankName.trim()) lines.push(`ธนาคาร: ${settings.bankName.trim()}`);
  }

  lines.push(`\nโอนแล้วรบกวนส่งสลิปให้ด้วยน้า ขอบคุณจ้า 🙏`);
  return lines.join('\n');
}

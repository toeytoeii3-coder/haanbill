/**
 * PromptPay EMVCo QR Payload Generator
 * Complies with Bank of Thailand & EMVCo Standard for PromptPay
 */

function crc16(data: string): string {
  let crc = 0xffff;
  for (let i = 0; i < data.length; i++) {
    const code = data.charCodeAt(i);
    crc ^= code << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

function formatTag(id: string, value: string): string {
  const len = value.length.toString().padStart(2, '0');
  return `${id}${len}${value}`;
}

export function sanitizePromptPayId(rawId: string): { type: 'phone' | 'national_id' | 'e_wallet' | 'invalid'; value: string } {
  const digits = rawId.replace(/\D/g, '');
  if (digits.length === 10 && digits.startsWith('0')) {
    // Thai Mobile: 08x-xxx-xxxx -> 00668xxxxxxxx
    const formatted = '0066' + digits.substring(1);
    return { type: 'phone', value: formatted };
  } else if (digits.length === 13) {
    // Thai National ID / Tax ID
    return { type: 'national_id', value: digits };
  } else if (digits.length === 15) {
    // E-Wallet ID
    return { type: 'e_wallet', value: digits };
  }
  return { type: 'invalid', value: digits };
}

export function generatePromptPayPayload(targetId: string, amount?: number): string | null {
  if (!targetId) return null;
  const parsed = sanitizePromptPayId(targetId);
  if (parsed.type === 'invalid') return null;

  let subtag = '';
  if (parsed.type === 'phone') {
    subtag = formatTag('01', parsed.value);
  } else if (parsed.type === 'national_id') {
    subtag = formatTag('02', parsed.value);
  } else {
    subtag = formatTag('03', parsed.value);
  }

  const aid = formatTag('00', 'A000000677010111');
  const tag29 = formatTag('29', aid + subtag);

  const tag00 = formatTag('00', '01');
  // 12 = dynamic (has amount), 11 = static
  const hasAmount = typeof amount === 'number' && amount > 0;
  const tag01 = formatTag('01', hasAmount ? '12' : '11');
  const tag53 = formatTag('53', '764'); // THB
  const tag58 = formatTag('58', 'TH');

  let raw = tag00 + tag01 + tag29 + tag53;
  if (hasAmount) {
    const amountStr = amount.toFixed(2);
    raw += formatTag('54', amountStr);
  }
  raw += tag58;

  // Tag 63 for CRC checksum
  raw += '6304';
  const checksum = crc16(raw);
  return raw + checksum;
}

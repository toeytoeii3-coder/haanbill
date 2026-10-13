import { Member, BillItem, BillSettings, BillRecord } from '../types/bill';

const STORAGE_KEY = 'haanbill_state_v1';
const HISTORY_KEY = 'haanbill_history_v1';

export interface SavedBillState {
  settings: BillSettings;
  members: Member[];
  items: BillItem[];
  hasReset?: boolean;
}

export function saveStateToStorage(state: SavedBillState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage quota errors
  }
}

export function loadStateFromStorage(): SavedBillState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function exportStateAsHash(state: SavedBillState): string {
  try {
    const jsonStr = JSON.stringify(state);
    return encodeURIComponent(jsonStr);
  } catch {
    return '';
  }
}

export function loadStateFromHash(): SavedBillState | null {
  try {
    const hash = window.location.hash.replace(/^#/, '');
    if (!hash) return null;
    const jsonStr = decodeURIComponent(hash);
    return JSON.parse(jsonStr);
  } catch {
    return null;
  }
}

// Generate room code like "HAAN-8821"
export function generateRoomCode(): string {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `HAAN-${num}`;
}

// Multi-User Room Server Sync
export async function syncRoomToServer(
  roomId: string,
  state: SavedBillState
): Promise<boolean> {
  try {
    const res = await fetch(`/api/rooms/${encodeURIComponent(roomId)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function fetchRoomFromServer(
  roomId: string
): Promise<SavedBillState | null> {
  try {
    const res = await fetch(`/api/rooms/${encodeURIComponent(roomId)}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.state || null;
  } catch {
    return null;
  }
}

// Upload slip directly to room on server
export async function uploadSlipToServer(
  roomId: string,
  memberId: string,
  slipImageUrl: string
): Promise<{ success: boolean; memberName?: string }> {
  try {
    const res = await fetch(`/api/rooms/${encodeURIComponent(roomId)}/slip`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberId, slipImageUrl }),
    });
    if (!res.ok) return { success: false };
    const data = await res.json();
    return { success: !!data.success, memberName: data.memberName };
  } catch {
    return { success: false };
  }
}

// Compress smartphone photos to clean lightweight Base64 (max 1000px, quality 0.82)
export function compressSlipImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to load image into canvas'));
      img.onload = () => {
        const maxWidth = 1000;
        const maxHeight = 1000;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(reader.result as string);
          return;
        }

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        const compressed = canvas.toDataURL('image/jpeg', 0.82);
        resolve(compressed);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

// History Operations
export function getBillHistory(): BillRecord[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const list: BillRecord[] = JSON.parse(raw);
    return Array.isArray(list) ? list.sort((a, b) => b.timestamp - a.timestamp) : [];
  } catch {
    return [];
  }
}

export function saveBillRecord(record: BillRecord): void {
  try {
    const currentList = getBillHistory();
    const existingIndex = currentList.findIndex((r) => r.id === record.id);
    if (existingIndex >= 0) {
      currentList[existingIndex] = record;
    } else {
      currentList.unshift(record);
    }
    localStorage.setItem(HISTORY_KEY, JSON.stringify(currentList));
  } catch {
    // Ignore quota errors
  }
}

export function deleteBillRecord(id: string): void {
  try {
    const currentList = getBillHistory().filter((r) => r.id !== id);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(currentList));
  } catch {
    // Ignore
  }
}

export function clearBillHistory(): void {
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch {
    // Ignore
  }
}

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '25mb' }));

import fs from 'fs';


// File-backed room storage for persistence across restarts
const DATA_FILE = path.resolve(__dirname, '.rooms_data.json');
let roomsStore: Record<
  string,
  {
    roomId: string;
    updatedAt: number;
    state: any;
  }
> = {};

try {
  if (fs.existsSync(DATA_FILE)) {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    roomsStore = JSON.parse(raw);
  }
} catch (e) {
  console.warn('Failed to load existing rooms data, starting fresh.', e);
}

function persistRooms() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(roomsStore, null, 2), 'utf-8');
  } catch (e) {
    console.error('Failed to persist rooms data:', e);
  }
}

// Ultra-short link redirects:
// /s/HAAN-8821 -> /?b=HAAN-8821&view=slip (Dedicated Slip Upload & Payment View)
// /slip/HAAN-8821 -> /?b=HAAN-8821&view=slip
// /b/HAAN-8821 -> /?b=HAAN-8821
app.get('/s/:roomId', (req, res) => {
  const { roomId } = req.params;
  const m = req.query.m ? `&m=${encodeURIComponent(String(req.query.m))}` : '';
  res.redirect(`/?b=${encodeURIComponent(roomId)}&view=slip${m}`);
});

app.get('/slip/:roomId', (req, res) => {
  const { roomId } = req.params;
  const m = req.query.m ? `&m=${encodeURIComponent(String(req.query.m))}` : '';
  res.redirect(`/?b=${encodeURIComponent(roomId)}&view=slip${m}`);
});

app.get('/b/:roomId', (req, res) => {
  const { roomId } = req.params;
  const m = req.query.m ? `&m=${encodeURIComponent(String(req.query.m))}` : '';
  res.redirect(`/?b=${encodeURIComponent(roomId)}${m}`);
});

// API routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// Get room details
app.get('/api/rooms/:roomId', (req, res) => {
  const { roomId } = req.params;
  const normalizedId = roomId.toUpperCase().trim();
  const room = roomsStore[normalizedId];

  if (!room) {
    res.status(404).json({ error: 'Room not found' });
    return;
  }

  res.json(room);
});

// Update entire room state
app.post('/api/rooms/:roomId', (req, res) => {
  const { roomId } = req.params;
  const normalizedId = roomId.toUpperCase().trim();
  const state = req.body;

  if (!state) {
    res.status(400).json({ error: 'Missing state' });
    return;
  }

  roomsStore[normalizedId] = {
    roomId: normalizedId,
    updatedAt: Date.now(),
    state,
  };
  persistRooms();

  res.json({ success: true, roomId: normalizedId, updatedAt: roomsStore[normalizedId].updatedAt });
});

// Direct slip upload endpoint: /api/rooms/:roomId/slip
app.post('/api/rooms/:roomId/slip', (req, res) => {
  const { roomId } = req.params;
  const normalizedId = roomId.toUpperCase().trim();
  const { memberId, slipImageUrl } = req.body;

  if (!memberId || !slipImageUrl) {
    res.status(400).json({ error: 'Missing memberId or slipImageUrl' });
    return;
  }

  let room = roomsStore[normalizedId];
  if (!room) {
    res.status(404).json({ error: 'Room not found' });
    return;
  }

  // Update member in room state
  if (Array.isArray(room.state?.members)) {
    const memberIndex = room.state.members.findIndex((m: any) => m.id === memberId);
    if (memberIndex >= 0) {
      room.state.members[memberIndex] = {
        ...room.state.members[memberIndex],
        slipImageUrl,
        slipUploadedAt: Date.now(),
        hasPaid: true,
      };
      room.updatedAt = Date.now();
      persistRooms();
      res.json({
        success: true,
        memberId,
        memberName: room.state.members[memberIndex].name,
        updatedAt: room.updatedAt,
      });
      return;
    }
  }

  res.status(404).json({ error: 'Member not found in room' });
});

// AI Slip Verification Endpoint
app.post('/api/ai/verify-slip', async (req, res) => {
  try {
    const { slipImageUrl, expectedAmount, memberName } = req.body;
    if (!slipImageUrl) {
      res.status(400).json({ error: 'Missing slipImageUrl' });
      return;
    }

    let base64Data = slipImageUrl;
    let mimeType = 'image/jpeg';
    if (slipImageUrl.includes(';base64,')) {
      const parts = slipImageUrl.split(';base64,');
      mimeType = parts[0].replace('data:', '');
      base64Data = parts[1];
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType || 'image/jpeg',
              data: base64Data,
            },
          },
          {
            text: `Analyze this Thai bank transfer slip. The expected amount for member "${memberName || 'สมาชิก'}" is ${expectedAmount || 0} THB. Please extract:
1. transferred amount in THB (number)
2. sender name (string or null)
3. receiver name/account (string or null)
4. date and time of transfer (string or null)
5. isValid: whether this is a valid successful bank transfer slip (boolean)
6. matchAmount: whether the extracted amount matches or covers the expected amount of ${expectedAmount} THB (boolean)
7. message: A clear summary message in Thai (e.g. "AI ตรวจสลิปสำเร็จ ยอดโอน 450.00 บาท ตรงกับยอดที่ต้องจ่ายเรียบร้อย")`,
          },
        ],
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            amount: { type: Type.NUMBER, description: 'Extracted transfer amount in THB' },
            senderName: { type: Type.STRING, description: 'Sender name' },
            receiverName: { type: Type.STRING, description: 'Receiver name' },
            dateTime: { type: Type.STRING, description: 'Transfer date and time' },
            isValid: { type: Type.BOOLEAN, description: 'Whether slip is valid successful transfer' },
            matchAmount: { type: Type.BOOLEAN, description: 'Whether amount matches expected amount' },
            message: { type: Type.STRING, description: 'AI analysis summary message in Thai' },
          },
          required: ['amount', 'isValid', 'matchAmount', 'message'],
        },
      },
    });

    const text = response.text || '{}';
    const analysis = JSON.parse(text.trim());
    res.json({ success: true, analysis });
  } catch (err: any) {
    console.error('AI slip verification error:', err);
    res.status(500).json({ error: err.message || 'Failed to verify slip with AI' });
  }
});

async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    // Mount Vite middlewares in development
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: '0.0.0.0',
        port: PORT,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve production static assets
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT} (isDev: ${isDev})`);
  });
}

startServer();

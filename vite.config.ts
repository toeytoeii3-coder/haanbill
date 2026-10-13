import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import {VitePWA} from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        // 'prompt' = เวอร์ชันใหม่จะรอให้ผู้ใช้กด "อัปเดตเลย" (ดู UpdatePrompt.tsx)
        registerType: 'prompt',
        injectRegister: false,
        includeAssets: ['icons/favicon-64.png', 'icons/apple-touch-icon.png'],
        manifest: {
          name: 'หารบิล (HaanBill)',
          short_name: 'หารบิล',
          description:
            'แอพหารค่าอาหารและค่าเหล้าสำหรับสายปาร์ตี้ คำนวณแยกตามคนกินและคนไม่กิน พร้อมคิด Service Charge / VAT',
          lang: 'th',
          start_url: '/',
          scope: '/',
          id: '/',
          display: 'standalone',
          orientation: 'portrait',
          background_color: '#f8fafc',
          theme_color: '#f59e0b',
          categories: ['finance', 'utilities'],
          icons: [
            {src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any'},
            {src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any'},
            {src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable'},
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,png,svg,ico,webmanifest}'],
          cleanupOutdatedCaches: true,
          navigateFallback: '/index.html',
          // เส้นทางที่ server จัดการเอง (API + ลิงก์สั้น) ห้ามให้ service worker ตอบเป็น index.html
          navigateFallbackDenylist: [/^\/api\//, /^\/s\//, /^\/slip\//, /^\/b\//],
          runtimeCaching: [
            {
              // ฟอนต์ Google (Prompt / Plus Jakarta Sans) — แคชไว้ให้ใช้งานออฟไลน์ได้
              urlPattern: ({url}) =>
                url.origin === 'https://fonts.googleapis.com' ||
                url.origin === 'https://fonts.gstatic.com',
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'google-fonts',
                expiration: {maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365},
                cacheableResponse: {statuses: [0, 200]},
              },
            },
            // /api/* ไม่ถูกแคช (ข้อมูลห้อง/สลิปต้องสดเสมอ) — ใช้เครือข่ายตรง ๆ
          ],
        },
        devOptions: {enabled: false},
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});

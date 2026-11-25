import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'node:path';

const backend = 'http://localhost:3000';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: null,
      includeAssets: ['icons/favicon-64.png', 'icons/apple-touch-icon.png'],
      manifest: {
        id: '/',
        name: 'Az Én Kutyaiskolám',
        short_name: 'Kutyaiskola',
        description: 'Bérletek, QR-kód, órarend és hírek: Az Én Kutyaiskolám, Miskolc.',
        lang: 'hu',
        start_url: '/?app=1',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#111111',
        theme_color: '#111111',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ],
        shortcuts: [
          { name: 'Bérletem', short_name: 'Bérletem', url: '/tagoknak', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
          { name: 'Bérlet-szkennelés', short_name: 'Szkenner', url: '/kikepzo', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,woff2}'],
        globIgnores: ['**/AdminApp-*.js'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//, /^\/uploads\//, /^\/fonts\//],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        runtimeCaching: [
          {
            urlPattern: ({ url, sameOrigin }) => sameOrigin && url.pathname.startsWith('/fonts/'),
            handler: 'CacheFirst',
            options: { cacheName: 'fonts', expiration: { maxEntries: 30, maxAgeSeconds: 365 * 86400 } }
          },
          {
            urlPattern: ({ url, sameOrigin, request }) => request.destination === 'image' && ((sameOrigin && url.pathname.startsWith('/uploads/')) || (url.hostname.endsWith('.supabase.co') && url.pathname.startsWith('/storage/v1/object/public/'))),
            handler: 'CacheFirst',
            options: { cacheName: 'images', expiration: { maxEntries: 150, maxAgeSeconds: 30 * 86400 }, cacheableResponse: { statuses: [0, 200] } }
          },
          {
            urlPattern: ({ url, sameOrigin }) => sameOrigin && url.pathname === '/api/content',
            handler: 'NetworkFirst',
            options: { cacheName: 'content', networkTimeoutSeconds: 5, expiration: { maxEntries: 1 } }
          }
        ]
      }
    })
  ],
  resolve: { alias: { '@shared': path.resolve(__dirname, '../backend/src/shared') } },
  publicDir: 'public',
  server: {
    port: 5173,
    fs: { allow: ['..'] },
    proxy: { '/api': backend, '/uploads': backend, '/fonts': backend }
  },
  build: { outDir: 'dist', emptyOutDir: true }
});

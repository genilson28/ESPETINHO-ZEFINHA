import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'logo.png', 'pwa-192x192.png', 'pwa-512x512.png'],
      
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        
        // ✅ Estratégias de cache para funcionar offline
        runtimeCaching: [
          // Cache do Supabase - Tenta rede primeiro, usa cache se offline
          {
            urlPattern: /^https:\/\/utykuriccvvhitlrdqcw\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 5 // 5 minutos
              },
              cacheableResponse: {
                statuses: [0, 200]
              },
              networkTimeoutSeconds: 10
            }
          },
          
          // Cache de imagens - Cache primeiro, atualiza em background
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 30 * 24 * 60 * 60 // 30 dias
              }
            }
          },
          
          // Cache de fontes
          {
            urlPattern: /\.(?:woff|woff2|ttf|otf)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'fonts-cache',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 365 * 24 * 60 * 60 // 1 ano
              }
            }
          }
        ],
        
        // ✅ Limpa caches antigos automaticamente
        cleanupOutdatedCaches: true,
        
        // ✅ Pré-cache das páginas principais
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api/]
      },
      
      manifest: {
        name: 'Point da Zefinha',
        short_name: 'Zefinha',
        description: 'Sistema de Gestão - Espetinhos',
        theme_color: '#C41E3A',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        orientation: 'portrait',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      
      devOptions: {
        enabled: true
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    port: 3000,
    host: true
  }
})
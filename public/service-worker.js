// ========================================
// SERVICE WORKER SIMPLES - VOLTANDO PARA V4
// ========================================

const CACHE_NAME = 'zefinha-cache-v6' // Incrementei para forçar limpeza do v5

const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo.png',
  '/styles.css',
  '/app.js'
]

// ========================================
// INSTALAÇÃO - SIMPLES
// ========================================
self.addEventListener('install', event => {
  console.log('📦 Instalando Service Worker...', CACHE_NAME)
  
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache)
    })
  )
  
  // ❌ REMOVIDO: self.skipWaiting() 
})

// ========================================
// ATIVAÇÃO - SIMPLES
// ========================================
self.addEventListener('activate', event => {
  console.log('✅ Ativando Service Worker...', CACHE_NAME)
  
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            console.log('🗑️ Deletando cache antigo:', key)
            return caches.delete(key)
          }
        })
      )
    )
  )
  
  // ❌ REMOVIDO: self.clients.claim()
})

// ========================================
// FETCH - CACHE FIRST (mais rápido)
// SÓ CORRIGIDO O ERRO DE POST
// ========================================
self.addEventListener('fetch', event => {
  // ⚠️ CORREÇÃO: Ignora requisições POST (upload de imagem)
  if (event.request.method !== 'GET') {
    return // Deixa passar direto
  }
  
  event.respondWith(
    caches.match(event.request).then(response => {
      if (response) {
        return response
      }
      
      return fetch(event.request).then(response => {
        if (response && response.status === 200) {
          const responseToCache = response.clone()
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache)
          })
        }
        return response
      })
    })
  )
})

console.log('🚀 Service Worker carregado (modo simples):', CACHE_NAME)

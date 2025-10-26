// ========================================
// SERVICE WORKER SIMPLES
// SEM atualização automática forçada
// ========================================

const CACHE_NAME = 'zefinha-cache-v4'

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
  // Não força ativação imediata
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
  // ❌ REMOVIDO: Notificações de atualização
  // Não assume controle forçado
})

// ========================================
// FETCH - CACHE FIRST (mais rápido)
// ========================================
self.addEventListener('fetch', event => {
  event.respondWith(
    // Tenta buscar do CACHE primeiro (mais rápido, sem recarregar)
    caches.match(event.request).then(response => {
      // Se tem no cache, retorna
      if (response) {
        return response
      }
      
      // Se não tem no cache, busca da rede
      return fetch(event.request).then(response => {
        // Se deu certo, salva no cache para próxima vez
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

// ❌ REMOVIDO: Event listener de mensagens
// ❌ REMOVIDO: Lógica de SKIP_WAITING
// ❌ REMOVIDO: Notificações

console.log('🚀 Service Worker carregado (modo simples):', CACHE_NAME)

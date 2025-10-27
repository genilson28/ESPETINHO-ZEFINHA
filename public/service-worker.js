// ========================================
// SERVICE WORKER CORRIGIDO
// Cache First para assets, Network First para HTML/JS
// ========================================

const CACHE_NAME = 'zefinha-cache-v5' // Incremente a versão!

const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo.png',
  '/styles.css',
  '/app.js'
]

// ========================================
// INSTALAÇÃO
// ========================================
self.addEventListener('install', event => {
  console.log('📦 Instalando Service Worker...', CACHE_NAME)
  
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache)
    })
  )
  
  // Força o novo SW a ativar imediatamente
  self.skipWaiting()
})

// ========================================
// ATIVAÇÃO
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
    ).then(() => {
      // Assume controle de todas as páginas imediatamente
      return self.clients.claim()
    })
  )
})

// ========================================
// FETCH - ESTRATÉGIA INTELIGENTE
// ========================================
self.addEventListener('fetch', event => {
  const { request } = event
  const url = new URL(request.url)
  
  // Para HTML e JS: NETWORK FIRST (sempre tenta buscar versão nova)
  if (
    request.mode === 'navigate' || 
    request.destination === 'document' ||
    url.pathname.endsWith('.html') ||
    url.pathname.endsWith('.js')
  ) {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Atualiza o cache com a versão nova
          const responseToCache = response.clone()
          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, responseToCache)
          })
          return response
        })
        .catch(() => {
          // Se não tem internet, usa o cache
          return caches.match(request)
        })
    )
    return
  }
  
  // Para CSS, imagens, etc: CACHE FIRST (mais rápido)
  event.respondWith(
    caches.match(request).then(response => {
      if (response) {
        return response
      }
      
      return fetch(request).then(response => {
        if (response && response.status === 200) {
          const responseToCache = response.clone()
          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, responseToCache)
          })
        }
        return response
      })
    })
  )
})

console.log('🚀 Service Worker carregado:', CACHE_NAME)

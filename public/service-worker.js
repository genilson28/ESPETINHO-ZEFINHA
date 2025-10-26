// ========================================
// SERVICE WORKER ATUALIZADO
// Com sistema de atualização automática
// ========================================

// ⚠️ IMPORTANTE: Mude a versão a cada atualização do app!
const CACHE_NAME = 'zefinha-cache-v3' // ← ATUALIZADO PARA V3!

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
  console.log('📦 Service Worker instalando...', CACHE_NAME)
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('💾 Arquivos adicionados ao cache')
        return cache.addAll(urlsToCache)
      })
      .then(() => {
        // ✨ NOVO: Força ativação imediata
        return self.skipWaiting()
      })
  )
})

// ========================================
// ATIVAÇÃO
// ========================================
self.addEventListener('activate', event => {
  console.log('✅ Service Worker ativando...', CACHE_NAME)
  
  event.waitUntil(
    caches.keys()
      .then(keys => {
        // Deleta todos os caches antigos
        return Promise.all(
          keys.map(key => {
            if (key !== CACHE_NAME) {
              console.log('🗑️ Deletando cache antigo:', key)
              return caches.delete(key)
            }
          })
        )
      })
      .then(() => {
        // ✨ NOVO: Assume controle imediatamente
        return self.clients.claim()
      })
      .then(() => {
        // ✨ NOVO: Notifica todos os clientes sobre atualização
        return self.clients.matchAll().then(clients => {
          clients.forEach(client => {
            client.postMessage({
              type: 'UPDATE_AVAILABLE',
              version: CACHE_NAME
            })
          })
        })
      })
  )
})

// ========================================
// FETCH - ESTRATÉGIA: NETWORK FIRST
// ========================================
self.addEventListener('fetch', event => {
  event.respondWith(
    // ✨ MUDANÇA: Tenta buscar da rede PRIMEIRO
    fetch(event.request)
      .then(response => {
        // Se conseguiu da rede, atualiza o cache
        if (response && response.status === 200) {
          const responseToCache = response.clone()
          
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache)
          })
        }
        
        return response
      })
      .catch(() => {
        // Se falhou, tenta buscar do cache
        return caches.match(event.request)
          .then(cachedResponse => {
            if (cachedResponse) {
              return cachedResponse
            }
            
            // Se não tem no cache, retorna erro
            return new Response('Offline', {
              status: 503,
              statusText: 'Sem conexão'
            })
          })
      })
  )
})

// ========================================
// MENSAGENS (para controle externo)
// ========================================
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('⚡ Ativação imediata solicitada')
    self.skipWaiting()
  }
  
  if (event.data && event.data.type === 'CHECK_UPDATE') {
    console.log('🔍 Verificação de atualização solicitada')
    // O browser já faz isso automaticamente
  }
})

console.log('🚀 Service Worker carregado:', CACHE_NAME)

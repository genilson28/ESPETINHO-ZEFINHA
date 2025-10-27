import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './assets/main.css'
import { useUserStore } from '@/stores/user'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// Inicializa a store de usuário e o listener de autenticação
const userStore = useUserStore(pinia)
userStore.initAuth()

app.mount('#app')

// ========================================
// 🔄 SERVICE WORKER COM RECONEXÃO
// ========================================

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then(registration => {
        console.log('✅ Service Worker registrado')
        
        // Detectar atualizações do SW
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          console.log('🔄 Nova versão do SW encontrada')
          
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'activated') {
              console.log('🎉 Nova versão ativada! Recarregue para atualizar.')
            }
          })
        })
      })
      .catch(error => {
        console.error('❌ Erro ao registrar Service Worker:', error)
      })
  })
}

// ========================================
// 🔍 SISTEMA DE DIAGNÓSTICO E RECONEXÃO
// ========================================

let lastActivity = Date.now()
let isPageActive = !document.hidden

// Atualizar timestamp de atividade
function updateActivity() {
  lastActivity = Date.now()
}

// Listeners de atividade
document.addEventListener('click', updateActivity)
document.addEventListener('touchstart', updateActivity)
document.addEventListener('scroll', updateActivity)
document.addEventListener('keypress', updateActivity)

// ========================================
// 🔄 RECONEXÃO AUTOMÁTICA
// ========================================
document.addEventListener('visibilitychange', async () => {
  const wasHidden = !isPageActive
  isPageActive = !document.hidden
  
  if (wasHidden && isPageActive) {
    console.log('📱 Página voltou a ficar ATIVA')
    
    // Verifica quanto tempo ficou inativa
    const timeInactive = Date.now() - lastActivity
    console.log(`⏱️ Tempo inativo: ${Math.floor(timeInactive / 1000)}s`)
    
    // Se ficou inativa por mais de 5 segundos, reconecta
    if (timeInactive > 5000) {
      console.log('🔄 Reconectando sistemas...')
      
      try {
        // Tenta reconectar através da própria store
        console.log('🔄 Reinicializando autenticação...')
        await userStore.initAuth()
        
        // Verifica se ainda está autenticado
        if (userStore.isAuthenticated) {
          console.log('✅ Sessão válida:', userStore.profile?.email)
          console.log('✅ Reconexão bem-sucedida!')
        } else {
          console.log('⚠️ Sem sessão ativa após reconexão')
          router.push('/login')
        }
        
      } catch (err) {
        console.error('❌ Erro durante reconexão:', err)
        // Se der erro, tenta recarregar a página
        console.log('🔄 Tentando recarregar página...')
        setTimeout(() => {
          window.location.reload()
        }, 1000)
      }
    }
    
    updateActivity()
  } else if (!isPageActive) {
    console.log('📴 Página ficou INATIVA')
  }
})

// ========================================
// 🚨 DETECTAR ERROS SILENCIOSOS
// ========================================
window.addEventListener('error', (event) => {
  console.error('❌ ERRO GLOBAL:', event.error)
})

window.addEventListener('unhandledrejection', (event) => {
  console.error('❌ PROMISE NÃO TRATADA:', event.reason)
})

// ========================================
// ⏰ MONITOR DE CONGELAMENTO (DEBUG)
// ========================================
if (import.meta.env.DEV) {
  setInterval(() => {
    const timeSinceActivity = Date.now() - lastActivity
    
    if (timeSinceActivity > 10000 && isPageActive) {
      console.warn(`⚠️ Página ativa mas sem interação há ${Math.floor(timeSinceActivity / 1000)}s`)
    }
  }, 10000)
}

console.log('🚀 Sistema de diagnóstico e reconexão ativado!')
console.log('📊 Ambiente:', import.meta.env.MODE)

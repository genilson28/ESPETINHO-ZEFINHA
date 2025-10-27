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
// 🔄 SERVICE WORKER (WORKBOX)
// Já está sendo registrado automaticamente pelo Vite
// ========================================
console.log('✅ Workbox Service Worker será registrado automaticamente')

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
// 🔄 RECONEXÃO AUTOMÁTICA (SIMPLIFICADA)
// ========================================
document.addEventListener('visibilitychange', () => {
  const wasHidden = !isPageActive
  isPageActive = !document.hidden
  
  if (wasHidden && isPageActive) {
    console.log('📱 Página voltou a ficar ATIVA')
    
    const timeInactive = Date.now() - lastActivity
    console.log(`⏱️ Tempo inativo: ${Math.floor(timeInactive / 1000)}s`)
    
    // Se ficou muito tempo inativo (mais de 2 minutos), recarrega a página
    if (timeInactive > 120000) {
      console.log('🔄 Página ficou inativa por muito tempo, recarregando...')
      window.location.reload()
    } else if (timeInactive > 5000) {
      // Se ficou pouco tempo (5s-2min), só verifica a sessão em background
      console.log('🔍 Verificando sessão em background...')
      userStore.initAuth().catch(err => {
        console.error('❌ Erro ao verificar sessão:', err)
      })
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
// Desativado em produção para melhor performance
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

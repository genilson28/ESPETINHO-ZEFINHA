import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './assets/main.css'
import { useUserStore } from '@/stores/user'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)

// ✅ CRÍTICO: Inicializar auth ANTES de usar o router
const userStore = useUserStore(pinia)

// ✅ Iniciar auth de forma assíncrona (não bloqueia o mount)
userStore.initAuth().catch(error => {
  console.error('❌ Erro crítico ao inicializar auth:', error)
})

// ✅ Usar router DEPOIS de iniciar o auth
app.use(router)

app.mount('#app')

// ========================================
// 🔄 SERVICE WORKER (WORKBOX)
// Já está sendo registrado automaticamente pelo Vite
// ========================================
console.log('✅ Workbox Service Worker registrado automaticamente')

// ========================================
// 🚨 DETECTAR ERROS
// ========================================
window.addEventListener('error', (event) => {
  console.error('❌ ERRO:', event.error)
})

window.addEventListener('unhandledrejection', (event) => {
  console.error('❌ PROMISE REJEITADA:', event.reason)
})

console.log('🚀 App inicializado')
console.log('📊 Ambiente:', import.meta.env.MODE)

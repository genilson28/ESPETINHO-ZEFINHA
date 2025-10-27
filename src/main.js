import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './assets/main.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// ✅ REMOVIDO: userStore.initAuth()
// O router vai chamar initAuth() no momento certo!

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

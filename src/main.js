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
// 🔄 SERVICE WORKER SIMPLES
// SEM verificações automáticas
// Atualiza SOMENTE quando fechar e abrir o app
// ========================================

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then(registration => {
        console.log('✅ Service Worker registrado')
        
        // ❌ REMOVIDO: Todas as verificações automáticas
        // ❌ REMOVIDO: Intervalo de 30 segundos
        // ❌ REMOVIDO: Verificação ao trocar de aba
        // ❌ REMOVIDO: Atualização automática
        
        // ✅ O app só atualiza quando o cliente fechar e abrir novamente
      })
      .catch(error => {
        console.error('❌ Erro ao registrar Service Worker:', error)
      })
  })
}

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
// 🔄 SISTEMA DE ATUALIZAÇÃO AUTOMÁTICA
// ========================================

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then(registration => {
        console.log('✅ Service Worker registrado:', registration)

        // ========================================
        // ❌ REMOVIDO: Verificação a cada 30 segundos
        // Estava causando recarregamentos desnecessários
        // ========================================

        // ========================================
        // ✅ Verifica SOMENTE quando a aba volta ao foco
        // (Cliente sai do app e volta)
        // ========================================
        document.addEventListener('visibilitychange', () => {
          if (!document.hidden) {
            console.log('👁️ Aba ativa - verificando atualizações...')
            registration.update()
          }
        })

        // ========================================
        // Detecta quando há nova versão disponível
        // ========================================
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          console.log('🆕 Nova versão encontrada!')

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('✨ Nova versão instalada!')
              
              // ========================================
              // ATUALIZAÇÃO AUTOMÁTICA (sem perguntar)
              // ========================================
              console.log('🔄 Atualizando aplicação...')
              newWorker.postMessage({ type: 'SKIP_WAITING' })
              
              // Recarrega quando o novo SW assumir controle
              navigator.serviceWorker.addEventListener('controllerchange', () => {
                console.log('✅ Aplicação atualizada! Recarregando...')
                window.location.reload()
              })

              // ========================================
              // ALTERNATIVA: Perguntar ao usuário (opcional)
              // Descomente se preferir perguntar
              // ========================================
              /*
              if (confirm('Nova versão disponível! Deseja atualizar agora?')) {
                newWorker.postMessage({ type: 'SKIP_WAITING' })
                navigator.serviceWorker.addEventListener('controllerchange', () => {
                  window.location.reload()
                })
              }
              */
            }
          })
        })

        // ========================================
        // Escuta mensagens do Service Worker
        // ========================================
        navigator.serviceWorker.addEventListener('message', event => {
          if (event.data && event.data.type === 'UPDATE_AVAILABLE') {
            console.log('📢 Notificação de atualização:', event.data.version)
          }
        })

        // ✅ Verifica atualizações SOMENTE ao carregar (1 vez)
        registration.update()
      })
      .catch(error => {
        console.error('❌ Erro ao registrar Service Worker:', error)
      })
  })
}

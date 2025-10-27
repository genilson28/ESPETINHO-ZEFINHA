<template>
  <div id="app">
    <!-- Componente de Status Online/Offline -->
    <OnlineStatus />

    <!-- TELA DE CARREGAMENTO -->
    <div v-if="isLoading" class="loading-screen">
      <div class="loading-spinner"></div>
      <p>Carregando...</p>
      <!-- ✅ Botão de emergência se travar -->
      <button 
        v-if="showEmergencyButton" 
        @click="forceReload" 
        class="emergency-button"
      >
        Recarregar página
      </button>
    </div>

    <!-- APLICATIVO (só aparece depois de carregar) -->
    <template v-else>
      <!-- LAYOUT BLANK (Login, Cliente) -->
      <div v-if="$route.meta.layout === 'blank'" class="blank-layout">
        <RouterView />
      </div>

      <!-- ✅ LAYOUT GARÇOM - SEM SIDEBAR, SEM MENU -->
      <div v-else-if="isGarcom" class="garcom-layout">
        <!-- Apenas o conteúdo, sem header, sem menu -->
        <main class="garcom-content">
          <RouterView />
        </main>
      </div>

      <!-- LAYOUT MOBILE (Caixa) - SEM SIDEBAR, COM BOTTOM NAV -->
      <div v-else-if="useMobileLayout" class="mobile-layout">
        <!-- Header simples no topo -->
        <TheHeader v-if="userStore.isAuthenticated" />
        
        <!-- Conteúdo principal -->
        <main class="mobile-content">
          <RouterView />
        </main>
        
        <!-- Menu inferior fixo -->
        <BottomNav />
      </div>

      <!-- LAYOUT GERENTE - SEM SIDEBAR, COM HEADER -->
      <div v-else-if="isGerente" class="gerente-layout">
        <!-- Header no topo -->
        <TheHeader v-if="userStore.isAuthenticated" />
        
        <!-- Conteúdo principal -->
        <main class="gerente-content">
          <RouterView />
        </main>
      </div>

      <!-- LAYOUT DESKTOP (SOMENTE ADMIN) - COM SIDEBAR -->
      <div v-else class="desktop-layout">
        <!-- Sidebar -->
        <Navigation 
          v-if="userStore.isAuthenticated" 
          :user-role="userStore.profile?.role" 
        />
        
        <!-- Container principal -->
        <div class="main-container">
          <!-- Header fixo no topo -->
          <TheHeader v-if="userStore.isAuthenticated && !isFullWidthPage" />
          
          <!-- Conteúdo principal -->
          <main class="main-content" :class="{ 'no-padding': isFullWidthPage, 'no-header': isFullWidthPage }">
            <RouterView />
          </main>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { useRoute } from 'vue-router'
import TheHeader from './components/TheHeader.vue'
import Navigation from './components/Navigation.vue'
import BottomNav from './components/BottomNav.vue'
import OnlineStatus from './components/OnlineStatus.vue'

const userStore = useUserStore()
const route = useRoute()
const showEmergencyButton = ref(false)

// ✅ CRÍTICO: Inicializar auth quando App monta
onMounted(async () => {
  console.log('🎯 App.vue montado, iniciando auth...')
  
  // Inicializar auth se ainda não foi inicializado
  if (!userStore.authInitialized && !userStore.authLoading) {
    try {
      await userStore.initAuth()
    } catch (error) {
      console.error('❌ Erro ao inicializar auth no App.vue:', error)
    }
  }
  
  // Mostrar botão de emergência após 10 segundos de loading
  setTimeout(() => {
    if (userStore.authLoading) {
      showEmergencyButton.value = true
    }
  }, 10000)
})

// ✅ Computed para verificar se está carregando
const isLoading = computed(() => userStore.authLoading)

// ✅ NOVO: Detectar se é garçom (layout especial sem nada)
const isGarcom = computed(() => {
  if (!userStore.isAuthenticated) return false
  return userStore.profile?.role === 'garcom'
})

// Determina se deve usar layout mobile (SOMENTE CAIXA agora)
const useMobileLayout = computed(() => {
  if (!userStore.isAuthenticated) return false
  const role = userStore.profile?.role
  return role === 'caixa' // ✅ REMOVIDO garçom
})

// Determina se é gerente (layout sem sidebar)
const isGerente = computed(() => {
  if (!userStore.isAuthenticated) return false
  return userStore.profile?.role === 'gerente'
})

// Determina se a página atual precisa ser full-width (sem padding)
const isFullWidthPage = computed(() => {
  const fullWidthRoutes = ['qr-codes', 'qr-generator', 'home', 'dashboard', 'dashboard-garcom']
  return fullWidthRoutes.includes(route.name)
})

// ✅ Função de emergência para recarregar
function forceReload() {
  localStorage.clear()
  sessionStorage.clear()
  window.location.reload()
}
</script>

<style scoped>
#app {
  min-height: 100vh;
  width: 100%;
  background: #f8fafc;
}

/* ==================== LOADING SCREEN ==================== */
.loading-screen {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  gap: 1.5rem;
  width: 100%;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #e5e7eb;
  border-top-color: #C41E3A;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-screen p {
  font-size: 1.2rem;
  color: #6b7280;
}

/* ✅ Botão de emergência */
.emergency-button {
  margin-top: 2rem;
  padding: 0.75rem 1.5rem;
  background: #C41E3A;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.emergency-button:hover {
  background: #a01828;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(196, 30, 58, 0.3);
}

/* ==================== BLANK LAYOUT (Login, Cliente) ==================== */
.blank-layout {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  width: 100%;
}

/* ==================== ✅ LAYOUT GARÇOM (SEM NADA) ==================== */
.garcom-layout {
  min-height: 100vh;
  width: 100%;
  background: #f5f7fa;
}

.garcom-content {
  width: 100%;
  min-height: 100vh;
  /* Sem padding, sem margin, sem header, sem menu */
  /* O DashboardGarcom.vue e PDVView controlarão seu próprio layout */
}

/* ==================== MOBILE LAYOUT (Caixa) ==================== */
.mobile-layout {
  min-height: 100vh;
  width: 100%;
  display: flex;
  flex-direction: column;
  padding-bottom: 70px; /* Espaço para o bottom nav */
}

.mobile-content {
  flex: 1;
  overflow-y: auto;
  width: 100%;
  padding-top: 80px; /* Espaço para o header */
}

/* ==================== LAYOUT GERENTE (SEM SIDEBAR) ==================== */
.gerente-layout {
  min-height: 100vh;
  width: 100%;
  display: flex;
  flex-direction: column;
}

.gerente-content {
  flex: 1;
  padding: 1.5rem;
  margin-top: 100px; /* Espaço para o header fixo */
  overflow-y: auto;
  width: 100%;
  max-width: 1600px; /* Largura máxima para não ficar muito esticado */
  margin-left: auto;
  margin-right: auto;
}

/* ==================== DESKTOP LAYOUT (SOMENTE ADMIN) ==================== */
.desktop-layout {
  display: flex;
  min-height: 100vh;
  width: 100%;
}

.main-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  width: 100%;
  margin-left: 280px; /* Espaço para a sidebar fixed */
}

.main-content {
  flex: 1;
  padding: 1.5rem;
  margin-top: 100px; /* Espaço para o header fixo */
  overflow-y: auto;
  width: 100%;
}

/* REMOVE PADDING PARA PÁGINAS FULL-WIDTH */
.main-content.no-padding {
  padding: 0;
  overflow-x: hidden;
}

/* REMOVE MARGIN-TOP QUANDO NÃO TEM HEADER */
.main-content.no-header {
  margin-top: 0;
}

/* ==================== RESPONSIVE ==================== */
@media (max-width: 768px) {
  /* Desktop layout ajustes mobile */
  .desktop-layout .main-container {
    margin-left: 0;
  }

  .desktop-layout .main-content {
    padding: 0.75rem;
    margin-top: 80px;
  }

  .desktop-layout .main-content.no-padding {
    padding: 0;
  }

  .desktop-layout .main-content.no-header {
    margin-top: 0;
  }

  /* Gerente layout ajustes mobile */
  .gerente-content {
    padding: 0.75rem;
    margin-top: 80px;
  }

  /* Mobile layout ajustes */
  .mobile-layout {
    padding-bottom: 70px;
  }

  .mobile-content {
    padding-top: 70px;
  }

  /* Garçom layout - mantém limpo */
  .garcom-layout {
    /* Sem alterações no mobile */
  }
}

/* Para telas muito pequenas */
@media (max-width: 480px) {
  .mobile-content,
  .gerente-content {
    padding: 0.5rem;
  }

  .desktop-layout .main-content:not(.no-padding) {
    padding: 0.5rem;
  }

  /* Garçom layout - continua limpo */
  .garcom-content {
    padding: 0;
  }
}
</style>

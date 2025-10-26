<template>
  <div id="app">
    <!-- Componente de Status Online/Offline -->
    <OnlineStatus />

    <!-- TELA DE CARREGAMENTO -->
    <div v-if="userStore.authLoading" class="loading-screen">
      <div class="loading-spinner"></div>
      <p>Carregando...</p>
    </div>

    <!-- APLICATIVO (só aparece depois de carregar) -->
    <template v-else>
      <!-- LAYOUT BLANK (Login) -->
      <div v-if="$route.meta.layout === 'blank'" class="blank-layout">
        <RouterView />
      </div>

      <!-- LAYOUT MOBILE (Garçom/Caixa) - SEM SIDEBAR -->
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

      <!-- LAYOUT GERENTE - SEM SIDEBAR -->
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
import { computed } from 'vue'
import { useUserStore } from '@/stores/user'
import { useRoute } from 'vue-router'
import TheHeader from './components/TheHeader.vue'
import Navigation from './components/Navigation.vue'
import BottomNav from './components/BottomNav.vue'
import OnlineStatus from './components/OnlineStatus.vue'

const userStore = useUserStore()
const route = useRoute()

// Determina se deve usar layout mobile (para garçom e caixa)
const useMobileLayout = computed(() => {
  if (!userStore.isAuthenticated) return false
  const role = userStore.profile?.role
  return role === 'garcom' || role === 'caixa'
})

// Determina se é gerente (layout sem sidebar)
const isGerente = computed(() => {
  if (!userStore.isAuthenticated) return false
  return userStore.profile?.role === 'gerente'
})

// Determina se a página atual precisa ser full-width (sem padding)
const isFullWidthPage = computed(() => {
  const fullWidthRoutes = ['qr-codes', 'qr-generator', 'home', 'dashboard']
  return fullWidthRoutes.includes(route.name)
})
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

/* ==================== BLANK LAYOUT (Login) ==================== */
.blank-layout {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  width: 100%;
}

/* ==================== MOBILE LAYOUT (Garçom/Caixa) ==================== */
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
}
</style>

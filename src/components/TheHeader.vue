<template>
  <header class="header" :class="headerClass">
    <div class="header-content">
      <div class="header-left">
        <div class="logo-circle">
          <svg class="flame-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2C12 2 5 8 5 14c0 3.866 3.134 7 7 7s7-3.134 7-7c0-6-7-12-7-12z"/>
            <path d="M12 17c-1.657 0-3-1.343-3-3 0-2 2-4 3-4s3 2 3 4c0 1.657-1.343 3-3 3z"/>
          </svg>
        </div>
        <div class="header-title">
          <h1>POINT DA ZEFINHA</h1>
          <p>Sistema de Gestão</p>
        </div>
      </div>
      
      <div class="header-right">
        <button class="time-btn" @click="showTime = !showTime">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 6v6l4 2"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Modal de horário -->
    <transition name="fade">
      <div v-if="showTime" class="time-modal" @click="showTime = false">
        <div class="time-content">
          <p class="current-time">{{ currentTime }}</p>
          <p class="current-date">{{ currentDate }}</p>
        </div>
      </div>
    </transition>
  </header>
</template>

<script>
import { computed } from 'vue'
import { useUserStore } from '@/stores/user'

export default {
  name: 'TheHeader',
  setup() {
    const userStore = useUserStore()
    
    // Determina a classe do header baseado no role
    const headerClass = computed(() => {
      const role = userStore.profile?.role
      if (role === 'admin') {
        return 'header-admin' // Com margem para sidebar
      } else if (role === 'gerente') {
        return 'header-gerente' // Largura total, sem sidebar
      } else {
        return 'header-mobile' // Para garçom/caixa
      }
    })

    return { headerClass }
  },
  data() {
    return {
      showTime: false,
      currentTime: '',
      currentDate: '',
      timeInterval: null
    }
  },
  mounted() {
    this.updateTime()
    this.timeInterval = setInterval(this.updateTime, 1000)
  },
  beforeUnmount() {
    if (this.timeInterval) {
      clearInterval(this.timeInterval)
    }
  },
  methods: {
    updateTime() {
      const now = new Date()
      this.currentTime = now.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
      this.currentDate = now.toLocaleDateString('pt-BR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    }
  }
}
</script>

<style scoped>
.header {
  background: linear-gradient(135deg, #C41E3A 0%, #FF6B35 100%);
  padding: 1.5rem;
  color: white;
  box-shadow: 0 4px 12px rgba(196, 30, 58, 0.3);
  position: fixed;
  top: 0;
  right: 0;
  z-index: 100;
  min-height: 100px; /* ✅ Altura mínima aumentada */
}

/* ✅ Header para ADMIN (com sidebar) */
.header-admin {
  left: 280px; /* Compensa largura da sidebar */
}

/* ✅ Header para GERENTE (sem sidebar) */
.header-gerente {
  left: 0; /* Largura total */
}

/* ✅ Header para MOBILE (garçom/caixa) */
.header-mobile {
  left: 0;
  padding: 1rem;
  min-height: 80px;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 1600px;
  margin: 0 auto;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.logo-circle {
  width: 60px;
  height: 60px;
  background: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  flex-shrink: 0;
}

.flame-icon {
  width: 32px;
  height: 32px;
  color: #C41E3A;
}

.header-title h1 {
  margin: 0;
  font-size: 1.75rem;
  font-weight: bold;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
  letter-spacing: 0.5px;
  line-height: 1.2;
}

.header-title p {
  margin: 0.25rem 0 0 0;
  font-size: 0.9rem;
  opacity: 0.95;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.time-btn {
  background: rgba(255, 255, 255, 0.2);
  border: 2px solid rgba(255, 255, 255, 0.3);
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.time-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.1);
}

.time-btn svg {
  width: 24px;
  height: 24px;
  color: white;
}

.time-modal {
  position: fixed;
  top: 110px; /* ✅ Ajustado para nova altura do header */
  right: 1.5rem;
  background: white;
  padding: 1.5rem;
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  z-index: 101;
  min-width: 220px;
}

.time-content {
  text-align: center;
}

.current-time {
  font-size: 2rem;
  font-weight: bold;
  color: #C41E3A;
  margin: 0 0 0.5rem 0;
  font-family: 'Courier New', monospace;
}

.current-date {
  font-size: 0.9rem;
  color: #1f2937;
  margin: 0;
  text-transform: capitalize;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* ==================== RESPONSIVE ==================== */
@media (max-width: 1024px) {
  .header-title h1 {
    font-size: 1.5rem;
  }

  .logo-circle {
    width: 55px;
    height: 55px;
  }
}

@media (max-width: 768px) {
  .header,
  .header-admin,
  .header-gerente,
  .header-mobile {
    left: 0 !important; /* Força largura total no mobile */
    padding: 1rem;
    min-height: 80px;
  }

  .header-title h1 {
    font-size: 1.25rem;
  }

  .header-title p {
    font-size: 0.75rem;
  }

  .logo-circle {
    width: 50px;
    height: 50px;
  }

  .flame-icon {
    width: 28px;
    height: 28px;
  }

  .time-btn {
    width: 42px;
    height: 42px;
  }
  
  .time-modal {
    top: 90px;
    right: 1rem;
  }
}

@media (max-width: 480px) {
  .header-title h1 {
    font-size: 1rem;
  }

  .header-title p {
    display: none; /* Esconde subtitle em telas muito pequenas */
  }

  .logo-circle {
    width: 45px;
    height: 45px;
  }
}
</style>
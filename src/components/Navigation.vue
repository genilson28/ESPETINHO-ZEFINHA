<script setup>
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'

import { 
  LayoutDashboard, 
  Utensils, 
  ShoppingCart, 
  Package, 
  Users, 
  DollarSign,
  BarChart3,
  LogOut,
  Menu,
  X
} from 'lucide-vue-next'
import { ref } from 'vue'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const isMenuOpen = ref(false)

const menuItems = computed(() => {
  const items = []
  const userRole = userStore.profile?.role

  if (userStore.can('ver_dashboard')) {
    items.push({
      name: 'Dashboard',
      path: '/',
      icon: LayoutDashboard,
      permission: 'ver_dashboard'
    })
  }

  if (userStore.can('ver_mesas')) {
    items.push({
      name: 'Mesas',
      path: '/tables',
      icon: Utensils,
      permission: 'ver_mesas'
    })
  }

  // ✅ AJUSTADO: Admin e Gerente vão para /orders, Garçom e Caixa vão para /pdv
  if (userStore.can('ver_pedidos')) {
    const isAdminOrManager = userRole === 'admin' || userRole === 'gerente'
    
    items.push({
      name: 'Pedidos',
      path: isAdminOrManager ? '/orders' : '/pdv',
      icon: ShoppingCart,
      permission: 'ver_pedidos'
    })
  }

  if (userStore.can('ver_produtos')) {
    items.push({
      name: 'Produtos',
      path: '/products',
      icon: Package,
      permission: 'ver_produtos'
    })
  }

  if (userStore.can('ver_usuarios')) {
    items.push({
      name: 'Usuários',
      path: '/users',
      icon: Users,
      permission: 'ver_usuarios'
    })
  }

  if (userStore.can('ver_financeiro')) {
    items.push({
      name: 'Financeiro',
      path: '/finance',
      icon: DollarSign,
      permission: 'ver_financeiro'
    })
  }

  if (userStore.can('ver_relatorios')) {
    items.push({
      name: 'Relatórios',
      path: '/reports',
      icon: BarChart3,
      permission: 'ver_relatorios'
    })
  }

  return items
})

const isActive = (path) => {
  // ✅ AJUSTADO: Para admin/gerente, /orders fica ativo. Para garçom/caixa, /pdv fica ativo
  const userRole = userStore.profile?.role
  const isAdminOrManager = userRole === 'admin' || userRole === 'gerente'
  
  // Se a rota atual é /orders ou /pdv, verificar qual deve ficar ativa
  if (path === '/orders' && isAdminOrManager && route.path === '/orders') {
    return true
  }
  if (path === '/pdv' && !isAdminOrManager && (route.path === '/pdv' || route.path.startsWith('/pdv/'))) {
    return true
  }
  
  return route.path === path
}

const navigate = (path) => {
  router.push(path)
  isMenuOpen.value = false
}

const handleLogout = async () => {
  if (confirm('Deseja realmente sair?')) {
    try {
      console.log('🚪 Iniciando logout...')
      
      const success = await userStore.logout()
      
      if (success || success === undefined) {
        console.log('✅ Redirecionando para login...')
        
        // Redirecionar para login
        router.replace('/login')
        
        // Forçar reload após um pequeno delay
        setTimeout(() => {
          window.location.href = '/login'
        }, 100)
      } else {
        console.error('❌ Falha no logout')
        alert('Erro ao fazer logout. Tente novamente.')
      }
    } catch (error) {
      console.error('❌ Erro crítico no logout:', error)
      
      // Forçar logout mesmo com erro
      window.location.href = '/login'
    }
  }
}

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value
}
</script>

<template>
  <div>
    <!-- Mobile Menu Button -->
    <button @click="toggleMenu" class="mobile-menu-btn">
      <Menu v-if="!isMenuOpen" :size="24" />
      <X v-else :size="24" />
    </button>

    <!-- Menu Lateral -->
    <aside class="sidebar" :class="{ 'mobile-open': isMenuOpen }">
      <div class="sidebar-header">
        <div class="logo">
          <div class="logo-icon">
            <Utensils :size="24" />
          </div>
          <div class="logo-text">
            <h2>Sistema</h2>
            <p>Gestão</p>
          </div>
        </div>
      </div>

      <div class="user-info">
        <div class="user-avatar">
          {{ userStore.profile?.nome?.charAt(0).toUpperCase() || 'U' }}
        </div>
        <div class="user-details">
          <p class="user-name">{{ userStore.profile?.nome || 'Usuário' }}</p>
          <p class="user-role">{{ userStore.profile?.role || 'user' }}</p>
        </div>
      </div>

      <nav class="sidebar-nav">
        <button
          v-for="item in menuItems"
          :key="item.path"
          @click="navigate(item.path)"
          class="nav-item"
          :class="{ active: isActive(item.path) }"
        >
          <component :is="item.icon" :size="20" />
          <span>{{ item.name }}</span>
        </button>
      </nav>

      <div class="sidebar-footer">
        <button @click="handleLogout" class="logout-btn">
          <LogOut :size="20" />
          <span>Sair</span>
        </button>
      </div>
    </aside>

    <!-- Overlay para mobile -->
    <div 
      v-if="isMenuOpen" 
      class="menu-overlay"
      @click="toggleMenu"
    ></div>
  </div>
</template>

<style scoped>
.mobile-menu-btn {
  position: fixed;
  top: 1rem;
  left: 1rem;
  z-index: 1001;
  background: linear-gradient(135deg, #C41E3A, #FF6B35);
  color: white;
  border: none;
  border-radius: 12px;
  width: 48px;
  height: 48px;
  display: none;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(196, 30, 58, 0.3);
  transition: all 0.3s ease;
}

.mobile-menu-btn:hover {
  transform: scale(1.05);
}

.sidebar {
  width: 280px;
  height: 100vh;
  background: white;
  border-right: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  position: fixed;
  left: 0;
  top: 0;
  z-index: 1000;
  transition: transform 0.3s ease;
}

.sidebar-header {
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.logo {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.logo-icon {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #C41E3A, #FF6B35);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.logo-text h2 {
  font-size: 1.25rem;
  font-weight: bold;
  color: #1f2937;
  margin: 0;
  line-height: 1.2;
}

.logo-text p {
  font-size: 0.75rem;
  color: #6b7280;
  margin: 0;
}

.user-info {
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #C41E3A20, #FF6B3520);
  color: #C41E3A;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1.25rem;
}

.user-details {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-weight: 600;
  color: #1f2937;
  margin: 0;
  font-size: 0.95rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-role {
  font-size: 0.75rem;
  color: #6b7280;
  margin: 0;
  text-transform: capitalize;
}

.sidebar-nav {
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
  border-radius: 8px;
  background: transparent;
  border: none;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.95rem;
  font-weight: 500;
  text-align: left;
  width: 100%;
}

.nav-item:hover {
  background: #f8fafc;
  color: #C41E3A;
}

.nav-item.active {
  background: linear-gradient(135deg, #C41E3A10, #FF6B3510);
  color: #C41E3A;
  font-weight: 600;
}

.sidebar-footer {
  padding: 1rem;
  border-top: 1px solid #e5e7eb;
}

.logout-btn {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
  border-radius: 8px;
  background: #fef2f2;
  border: none;
  color: #dc2626;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.95rem;
  font-weight: 500;
  width: 100%;
}

.logout-btn:hover {
  background: #fee2e2;
  transform: translateY(-2px);
}

.menu-overlay {
  display: none;
}

@media (max-width: 768px) {
  .mobile-menu-btn {
    display: flex;
  }

  .sidebar {
    transform: translateX(-100%);
  }

  .sidebar.mobile-open {
    transform: translateX(0);
  }

  .menu-overlay {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 999;
  }
}
</style>
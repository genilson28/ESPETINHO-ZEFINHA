<template>
  <nav class="bottom-nav">
    <router-link
      v-for="item in navItems"
      :key="item.name"
      :to="item.path"
      class="nav-item"
      :class="{ active: isActive(item.path) }"
    >
      <component :is="item.icon" :size="24" />
      <span class="nav-label">{{ item.label }}</span>
    </router-link>
  </nav>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { 
  UtensilsCrossed, 
  ShoppingCart, 
  List, 
  DollarSign,
  User 
} from 'lucide-vue-next'

const route = useRoute()
const userStore = useUserStore()

const navItems = computed(() => {
  const role = userStore.profile?.role

  if (role === 'garcom') {
    return [
      { name: 'tables', path: '/tables', icon: UtensilsCrossed, label: 'Mesas' },
      { name: 'pdv', path: '/pdv', icon: ShoppingCart, label: 'PDV' },
      { name: 'orders', path: '/orders', icon: List, label: 'Pedidos' },
      { name: 'profile', path: '/profile', icon: User, label: 'Perfil' }
    ]
  }

  if (role === 'caixa') {
    return [
      { name: 'tables', path: '/tables', icon: UtensilsCrossed, label: 'Mesas' },
      { name: 'pdv', path: '/pdv', icon: ShoppingCart, label: 'PDV' },
      { name: 'orders', path: '/orders', icon: List, label: 'Pedidos' },
      { name: 'finance', path: '/finance', icon: DollarSign, label: 'Caixa' }
    ]
  }

  // Default para outros roles
  return [
    { name: 'tables', path: '/tables', icon: UtensilsCrossed, label: 'Mesas' },
    { name: 'pdv', path: '/pdv', icon: ShoppingCart, label: 'PDV' },
    { name: 'orders', path: '/orders', icon: List, label: 'Pedidos' },
    { name: 'profile', path: '/profile', icon: User, label: 'Perfil' }
  ]
})

const isActive = (path) => {
  return route.path === path || route.path.startsWith(path + '/')
}
</script>

<style scoped>
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-around;
  align-items: center;
  height: 70px;
  padding: 0.5rem;
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.08);
  z-index: 1000;
}

.nav-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  padding: 0.5rem;
  color: #9ca3af;
  text-decoration: none;
  transition: all 0.3s ease;
  border-radius: 12px;
}

.nav-item:hover {
  background: #f8fafc;
  color: #C41E3A;
}

.nav-item.active {
  color: #C41E3A;
  background: rgba(196, 30, 58, 0.08);
}

.nav-label {
  font-size: 0.75rem;
  font-weight: 600;
}

/* Animação de toque */
.nav-item:active {
  transform: scale(0.95);
}

@media (min-width: 769px) {
  .bottom-nav {
    display: none;
  }
}
</style>
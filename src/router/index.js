import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

// ============================================
// IMPORTAÇÕES - VIEWS EXISTENTES
// ============================================
import HomeView from '@/views/HomeView.vue'
import DashboardGerente from '@/views/DashboardGerente.vue'
import PDVView from '@/views/PDVView.vue'
import StockView from '@/views/StockView.vue'
import MenuView from '@/views/MenuView.vue'
import LoginView from '@/views/LoginView.vue'
import UsersView from '@/views/UsersView.vue'
import ProductsView from '@/views/ProductsView.vue'
import UnauthorizedView from '@/views/UnauthorizedView.vue'
import FinanceView from '@/views/FinanceView.vue'
import ReportsView from '@/views/ReportsView.vue'
import OrdersView from '@/views/OrdersView.vue'

// ============================================
// IMPORTAÇÕES - CLIENTE (PÚBLICO)
// ============================================
import QRCodeScanner from '@/views/client/QRCodeScanner.vue'
import ClientMenuView from '@/views/client/ClientMenuView.vue'
import ClientOrderConfirm from '@/views/client/ClientOrderConfirm.vue'
import ClientOrderTracking from '@/views/client/ClientOrderTracking.vue'

// ============================================
// IMPORTAÇÕES - STAFF (AUTENTICADO)
// ============================================
import TablesView from '@/views/staff/TablesView.vue'
import CloseOrderView from '@/views/staff/CloseOrderView.vue'
import QRCodeGenerator from '@/views/staff/QRCodeGenerator.vue'
import StaffOrdersView from '@/views/staff/StaffOrdersView.vue'

// ============================================
// IMPORTAÇÕES - DASHBOARDS
// ============================================
import DashboardGarcom from '@/views/DashboardGarcom.vue'
import DashboardCozinha from '@/views/DashboardCozinha.vue' // ✅ NOVO

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // ============================================
    // ROTAS PÚBLICAS
    // ============================================
    
    {
      path: '/unauthorized',
      name: 'unauthorized',
      component: UnauthorizedView,
      meta: { requiresAuth: false }
    },
    
    { 
      path: '/login', 
      name: 'login', 
      component: LoginView,
      meta: { layout: 'blank', requiresAuth: false }
    },

    // ============================================
    // ROTAS DO CLIENTE (PÚBLICO - SEM AUTH)
    // ============================================
    
    {
      path: '/qr-scanner',
      name: 'qr-scanner',
      component: QRCodeScanner,
      meta: { 
        requiresAuth: false,
        layout: 'blank'
      }
    },

    {
      path: '/client-menu/:tableId',
      name: 'client-menu',
      component: ClientMenuView,
      meta: { 
        requiresAuth: false,
        layout: 'blank'
      }
    },

    {
      path: '/client-order/:tableId',
      name: 'client-order-confirm',
      component: ClientOrderConfirm,
      meta: { 
        requiresAuth: false,
        layout: 'blank'
      }
    },

    {
      path: '/order-tracking/:tableId',
      name: 'order-tracking',
      component: ClientOrderTracking,
      meta: { 
        requiresAuth: false,
        layout: 'blank'
      }
    },

    // ============================================
    // DASHBOARDS
    // ============================================
    
    // Admin Dashboard (/)
    { 
      path: '/', 
      name: 'home', 
      component: HomeView, 
      meta: { 
        requiresAuth: true,
        allowedRoles: ['admin']
      } 
    },

    // Dashboard Gerente
    { 
      path: '/dashboard-gerente', 
      name: 'dashboard-gerente', 
      component: DashboardGerente, 
      meta: { 
        requiresAuth: true,
        allowedRoles: ['gerente']
      } 
    },

    // Dashboard Garçom
    { 
      path: '/dashboard-garcom', 
      name: 'dashboard-garcom', 
      component: DashboardGarcom, 
      meta: { 
        requiresAuth: true,
        allowedRoles: ['garcom'],
        hideMenu: true
      } 
    },

    // ✅ Dashboard Cozinha
    { 
      path: '/dashboard-cozinha', 
      name: 'dashboard-cozinha', 
      component: DashboardCozinha, 
      meta: { 
        requiresAuth: true,
        allowedRoles: ['cozinha'],
        hideMenu: true
      } 
    },

    // ============================================
    // ROTAS DE MESAS E PEDIDOS
    // ============================================

    { 
      path: '/tables', 
      name: 'tables', 
      component: TablesView, 
      meta: { 
        requiresAuth: true,
        allowedRoles: ['admin', 'gerente', 'caixa', 'garcom', 'cozinha'] // ✅ ADICIONADO cozinha
      } 
    },

    { 
      path: '/pdv', 
      name: 'pdv', 
      component: PDVView, 
      meta: { 
        requiresAuth: true,
        allowedRoles: ['admin', 'gerente', 'garcom', 'caixa'],
        hideMenu: true
      }
    },

    { 
      path: '/close-order/:idMesa', 
      name: 'closeOrder', 
      component: CloseOrderView, 
      meta: { 
        requiresAuth: true,
        allowedRoles: ['caixa', 'admin', 'gerente']
      }
    },

    { 
      path: '/orders', 
      name: 'orders', 
      component: OrdersView, 
      meta: { 
        requiresAuth: true,
        allowedRoles: ['admin', 'gerente', 'caixa', 'cozinha'] // ✅ ADICIONADO cozinha
      } 
    },

    { 
      path: '/staff/orders', 
      name: 'staff-orders', 
      component: StaffOrdersView, 
      meta: { 
        requiresAuth: true,
        allowedRoles: ['admin', 'gerente', 'caixa', 'cozinha'] // ✅ ADICIONADO cozinha
      } 
    },

    { 
      path: '/qr-codes', 
      name: 'qr-generator', 
      component: QRCodeGenerator, 
      meta: { 
        requiresAuth: true,
        allowedRoles: ['admin', 'gerente']
      } 
    },

    // ============================================
    // ROTAS APENAS ADMIN
    // ============================================

    { 
      path: '/stock', 
      name: 'stock', 
      component: StockView, 
      meta: { 
        requiresAuth: true,
        allowedRoles: ['admin']
      } 
    },

    { 
      path: '/menu', 
      name: 'menu', 
      component: MenuView, 
      meta: { 
        requiresAuth: true,
        allowedRoles: ['admin']
      } 
    },

    { 
      path: '/products', 
      name: 'products', 
      component: ProductsView, 
      meta: { 
        requiresAuth: true,
        allowedRoles: ['admin']
      } 
    },

    { 
      path: '/users', 
      name: 'users', 
      component: UsersView, 
      meta: { 
        requiresAuth: true,
        allowedRoles: ['admin']
      } 
    },

    { 
      path: '/reports', 
      name: 'reports', 
      component: ReportsView, 
      meta: { 
        requiresAuth: true,
        allowedRoles: ['admin']
      } 
    },

    // ============================================
    // FINANCEIRO (Admin e Caixa)
    // ============================================
    { 
      path: '/finance', 
      name: 'finance', 
      component: FinanceView, 
      meta: { 
        requiresAuth: true,
        allowedRoles: ['admin', 'caixa']
      } 
    },

    // ============================================
    // ROTA 404 - CATCH ALL
    // ============================================
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      redirect: to => {
        const userStore = useUserStore()
        if (userStore.isAuthenticated) {
          return getHomeRoute(userStore.profile?.role)
        }
        return '/login'
      }
    }
  ]
})

// ============================================
// ROUTER GUARD
// ============================================
router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore()
  
  let attempts = 0
  const maxAttempts = 150
  
  while (userStore.authLoading && attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 100))
    attempts++
    
    if (attempts % 50 === 0) {
      console.log(`⏳ Aguardando auth... (${attempts / 10}s)`)
    }
  }

  if (attempts >= maxAttempts) {
    console.error('⏰ Timeout ao aguardar auth (15s), continuando...')
  }

  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  const allowedRoles = to.meta.allowedRoles

  if (!requiresAuth) {
    if (to.path === '/login' && userStore.isAuthenticated) {
      return next(getHomeRoute(userStore.profile?.role))
    }
    return next()
  }

  if (requiresAuth && !userStore.isAuthenticated) {
    console.log('❌ Não autenticado, redirecionando para login')
    return next({
      path: '/login',
      query: { redirect: to.fullPath }
    })
  }

  if (allowedRoles && userStore.isAuthenticated) {
    const userRole = userStore.profile?.role
    
    if (userRole !== 'admin' && !allowedRoles.includes(userRole)) {
      console.warn(`❌ Acesso negado: "${userRole}" tentou acessar rota que requer: [${allowedRoles.join(', ')}]`)
      return next(getHomeRoute(userRole))
    }
  }

  if (userStore.logAction && typeof userStore.logAction === 'function') {
    userStore.logAction('navigation', `Acessou: ${to.path}`).catch(err => {
      console.warn('⚠️ Erro ao registrar log de navegação:', err)
    })
  }

  next()
})

// ============================================
// ✅ HELPER: Retorna rota home baseada no role
// ============================================
function getHomeRoute(role) {
  switch(role) {
    case 'admin':
      return '/'
    case 'gerente':
      return '/dashboard-gerente'
    case 'garcom':
      return '/dashboard-garcom'
    case 'cozinha': // ✅ CONFIGURADO
      return '/dashboard-cozinha'
    case 'caixa':
      return '/tables'
    default:
      return '/login'
  }
}

export default router

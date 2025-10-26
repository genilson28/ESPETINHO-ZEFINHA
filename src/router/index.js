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

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // ============================================
    // ROTAS PÚBLICAS
    // ============================================
    
    // Página não autorizada
    {
      path: '/unauthorized',
      name: 'unauthorized',
      component: UnauthorizedView,
      meta: { requiresAuth: false }
    },
    
    // Login
    { 
      path: '/login', 
      name: 'login', 
      component: LoginView,
      meta: { layout: 'blank', requiresAuth: false }
    },

    // ============================================
    // ROTAS DO CLIENTE (PÚBLICO - SEM AUTH)
    // ============================================
    
    // Scanner de QR Code
    {
      path: '/qr-scanner',
      name: 'qr-scanner',
      component: QRCodeScanner,
      meta: { 
        requiresAuth: false,
        layout: 'blank'
      }
    },

    // Cardápio do Cliente
    {
      path: '/client-menu/:tableId',
      name: 'client-menu',
      component: ClientMenuView,
      meta: { 
        requiresAuth: false,
        layout: 'blank'
      }
    },

    // Confirmação do Pedido
    {
      path: '/client-order/:tableId',
      name: 'client-order-confirm',
      component: ClientOrderConfirm,
      meta: { 
        requiresAuth: false,
        layout: 'blank'
      }
    },

    // Acompanhar Pedido
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
    // DASHBOARD ADMIN (/)
    // ============================================
    { 
      path: '/', 
      name: 'home', 
      component: HomeView, 
      meta: { 
        requiresAuth: true,
        allowedRoles: ['admin']
      } 
    },

    // ============================================
    // DASHBOARD GERENTE (/dashboard-gerente)
    // ============================================
    { 
      path: '/dashboard-gerente', 
      name: 'dashboard-gerente', 
      component: DashboardGerente, 
      meta: { 
        requiresAuth: true,
        allowedRoles: ['gerente']
      } 
    },

    // ============================================
    // ROTAS DE MESAS E PEDIDOS
    // ============================================

    // Visualizar Mesas
    { 
      path: '/tables', 
      name: 'tables', 
      component: TablesView, 
      meta: { 
        requiresAuth: true,
        allowedRoles: ['admin', 'gerente', 'garcom', 'caixa']
      } 
    },

    // PDV - Ponto de Venda
    { 
      path: '/pdv', 
      name: 'pdv', 
      component: PDVView, 
      meta: { 
        requiresAuth: true,
        allowedRoles: ['admin', 'gerente', 'garcom', 'caixa']
      }
    },

    // Fechar Pedido/Comanda
    { 
      path: '/close-order/:idMesa', 
      name: 'closeOrder', 
      component: CloseOrderView, 
      meta: { 
        requiresAuth: true,
        allowedRoles: ['caixa', 'admin', 'gerente']
      }
    },

    // Lista de Pedidos (Staff)
    { 
      path: '/orders', 
      name: 'orders', 
      component: OrdersView, 
      meta: { 
        requiresAuth: true,
        allowedRoles: ['admin', 'gerente', 'garcom', 'caixa']
      } 
    },

    // ✅ NOVO: Pedidos Ativos (Staff)
    { 
      path: '/staff/orders', 
      name: 'staff-orders', 
      component: StaffOrdersView, 
      meta: { 
        requiresAuth: true,
        allowedRoles: ['admin', 'gerente', 'garcom', 'caixa']
      } 
    },

    // ✅ NOVO: Gerador de QR Codes
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

    // Estoque
    { 
      path: '/stock', 
      name: 'stock', 
      component: StockView, 
      meta: { 
        requiresAuth: true,
        allowedRoles: ['admin']
      } 
    },

    // Menu/Cardápio (Gerenciamento)
    { 
      path: '/menu', 
      name: 'menu', 
      component: MenuView, 
      meta: { 
        requiresAuth: true,
        allowedRoles: ['admin']
      } 
    },

    // Produtos
    { 
      path: '/products', 
      name: 'products', 
      component: ProductsView, 
      meta: { 
        requiresAuth: true,
        allowedRoles: ['admin']
      } 
    },

    // Usuários
    { 
      path: '/users', 
      name: 'users', 
      component: UsersView, 
      meta: { 
        requiresAuth: true,
        allowedRoles: ['admin']
      } 
    },

    // Relatórios
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
    // ROTA 404 - CATCH ALL (Opcional)
    // ============================================
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      redirect: to => {
        // Redireciona para home baseado no status de autenticação
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
  
  // Aguardar inicialização do auth
  if (!userStore.authInitialized) {
    console.log('⏳ Aguardando inicialização do auth...')
    await userStore.initAuth()
  }

  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  const allowedRoles = to.meta.allowedRoles

  // ============================================
  // ROTAS PÚBLICAS
  // ============================================
  if (!requiresAuth) {
    // Se está autenticado e tenta acessar login, redireciona para home apropriado
    if (to.path === '/login' && userStore.isAuthenticated) {
      return next(getHomeRoute(userStore.profile?.role))
    }
    return next()
  }

  // ============================================
  // VERIFICAR AUTENTICAÇÃO
  // ============================================
  if (requiresAuth && !userStore.isAuthenticated) {
    console.log('❌ Não autenticado, redirecionando para login')
    return next({
      path: '/login',
      query: { redirect: to.fullPath }
    })
  }

  // ============================================
  // VERIFICAR PERMISSÃO DE ROLE
  // ============================================
  if (allowedRoles && userStore.isAuthenticated) {
    const userRole = userStore.profile?.role
    
    if (!allowedRoles.includes(userRole)) {
      console.warn(`❌ Acesso negado: "${userRole}" tentou acessar rota que requer: [${allowedRoles.join(', ')}]`)
      
      // Redireciona para o home apropriado do usuário
      return next(getHomeRoute(userRole))
    }
  }

  // ============================================
  // REGISTRAR LOG (Opcional)
  // ============================================
  if (userStore.logAction && typeof userStore.logAction === 'function') {
    await userStore.logAction('navigation', `Acessou: ${to.path}`)
  }

  next()
})

// ============================================
// HELPER: Retorna rota home baseada no role
// ============================================
function getHomeRoute(role) {
  switch(role) {
    case 'admin':
      return '/'
    case 'gerente':
      return '/dashboard-gerente'
    case 'garcom':
    case 'caixa':
      return '/tables'
    default:
      return '/login'
  }
}

export default router
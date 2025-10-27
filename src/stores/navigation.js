// stores/navigation.js
import { defineStore } from 'pinia'

export const useNavigationStore = defineStore('navigation', {
  state: () => ({
    history: [],
    currentContext: {
      from: null,
      tableId: null,
      tableNumber: null,
      returnTo: null
    }
  }),

  getters: {
    previousRoute: (state) => {
      if (state.history.length > 0) {
        return state.history[state.history.length - 1]
      }
      return null
    },

    cameFromDashboard: (state) => {
      return state.currentContext.from === 'dashboard' || 
             state.currentContext.from === 'dashboard-garcom'
    },

    cameFromTables: (state) => {
      return state.currentContext.from === 'tables'
    }
  },

  actions: {
    setContext(context) {
      this.currentContext = {
        ...this.currentContext,
        ...context
      }
      console.log('📍 Contexto de navegação atualizado:', this.currentContext)
    },

    addToHistory(route) {
      const lastRoute = this.history[this.history.length - 1]
      if (lastRoute && lastRoute.path === route.path) {
        return
      }

      if (this.history.length >= 10) {
        this.history.shift()
      }

      this.history.push({
        name: route.name,
        path: route.path,
        params: { ...route.params },
        query: { ...route.query }
      })

      console.log('📚 Histórico atualizado:', this.history)
    },

    goToTables(router, from = null) {
      this.setContext({ 
        from: from,
        returnTo: from || 'tables' 
      })
      router.push({ name: 'tables' })
    },

    goToPDV(router, table, from = 'tables') {
      this.setContext({
        from: from,
        tableId: table.id,
        tableNumber: table.numero,
        returnTo: from === 'dashboard' ? 'dashboard' : 
                  from === 'dashboard-garcom' ? 'dashboard-garcom' : 'tables'
      })

      router.push({
        name: 'pdv',
        query: {
          mesaId: table.id,
          mesaNumero: table.numero,
          from: from
        }
      })
    },

    goBack(router, userRole = null) {
      const { from, returnTo } = this.currentContext

      console.log('🔙 Voltando...', { from, returnTo, userRole })

      // Se tem um returnTo definido, usa ele
      if (returnTo) {
        if (returnTo === 'dashboard') {
          this.goToDashboard(router, userRole)
        } else if (returnTo === 'dashboard-garcom') {
          router.push({ name: 'dashboard-garcom' })
        } else if (returnTo === 'tables') {
          router.push({ name: 'tables' })
        } else {
          router.push({ name: returnTo })
        }
        this.clearContext()
        return
      }

      // Se veio de algum lugar específico, volta pra lá
      if (from === 'dashboard') {
        this.goToDashboard(router, userRole)
      } else if (from === 'dashboard-garcom') {
        router.push({ name: 'dashboard-garcom' })
      } else if (from === 'tables') {
        router.push({ name: 'tables' })
      } else {
        // Fallback: usa o histórico do navegador
        if (window.history.length > 1) {
          router.back()
        } else {
          // Último fallback: vai para home do usuário
          this.goToHome(router, userRole)
        }
      }

      this.clearContext()
    },

    goToDashboard(router, userRole) {
      if (userRole === 'gerente') {
        router.push({ name: 'dashboard-gerente' })
      } else if (userRole === 'admin') {
        router.push({ name: 'home' })
      } else if (userRole === 'garcom') {
        router.push({ name: 'dashboard-garcom' })
      } else {
        router.push({ name: 'tables' })
      }
    },

    goToHome(router, userRole) {
      switch(userRole) {
        case 'admin':
          router.push({ name: 'home' })
          break
        case 'gerente':
          router.push({ name: 'dashboard-gerente' })
          break
        case 'garcom':
          router.push({ name: 'dashboard-garcom' })
          break
        case 'caixa':
          router.push({ name: 'tables' })
          break
        default:
          router.push({ name: 'login' })
      }
    },

    clearContext() {
      this.currentContext = {
        from: null,
        tableId: null,
        tableNumber: null,
        returnTo: null
      }
      console.log('🧹 Contexto limpo')
    },

    clearHistory() {
      this.history = []
      this.clearContext()
      console.log('🧹 Histórico limpo')
    }
  }
})

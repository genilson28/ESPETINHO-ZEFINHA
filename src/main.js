import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './assets/main.css'
// <--- A LINHA QUE FALTAVA
import { useUserStore } from '@/stores/user'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// Inicializa a store de usuário e o listener de autenticação
// antes de montar a aplicação. Isso é essencial para o login funcionar.
const userStore = useUserStore(pinia)
userStore.initAuth()

app.mount('#app')
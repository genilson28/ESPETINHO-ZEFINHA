<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { LogIn, Eye, EyeOff, AlertCircle } from 'lucide-vue-next'

const router = useRouter()
const userStore = useUserStore()

const email = ref('')
const senha = ref('')
const showPassword = ref(false)
const loading = ref(false)
const error = ref('')

const handleLogin = async () => {
  if (!email.value || !senha.value) {
    error.value = 'Preencha todos os campos'
    return
  }

  loading.value = true
  error.value = ''

  try {
    await userStore.login(email.value, senha.value)
    
    // Aguardar um pouco para garantir que o perfil foi carregado
    await new Promise(resolve => setTimeout(resolve, 800))
    
    // Redirecionar baseado no role
    const userRole = userStore.profile?.role
    
    if (userRole === 'admin' || userRole === 'gerente') {
      router.push('/')
    } else {
      router.push('/tables')
    }
  } catch (err) {
    console.error('Erro no login:', err)
    error.value = userStore.error || err.message || 'Erro ao fazer login'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <div class="logo-container">
          <div class="logo-icon">
            <LogIn :size="32" />
          </div>
        </div>
        <h1 class="login-title">Sistema de Gestão</h1>
        <p class="login-subtitle">Faça login para continuar</p>
      </div>

      <form @submit.prevent="handleLogin" class="login-form">
        <div v-if="error" class="error-alert">
          <AlertCircle :size="20" />
          <span>{{ error }}</span>
        </div>

        <div class="form-group">
          <label for="email" class="form-label">Email</label>
          <input
            id="email"
            v-model="email"
            type="email"
            placeholder="seu@email.com"
            class="form-input"
            required
          />
        </div>

        <div class="form-group">
          <label for="senha" class="form-label">Senha</label>
          <div class="password-input-wrapper">
            <input
              id="senha"
              v-model="senha"
              :type="showPassword ? 'text' : 'password'"
              placeholder="••••••••"
              class="form-input"
              required
            />
            <button
              type="button"
              @click="showPassword = !showPassword"
              class="password-toggle"
            >
              <EyeOff v-if="showPassword" :size="20" />
              <Eye v-else :size="20" />
            </button>
          </div>
        </div>

        <button type="submit" class="login-button" :disabled="loading">
          <LogIn :size="20" v-if="!loading" />
          <span class="spinner" v-else></span>
          {{ loading ? 'Entrando...' : 'Entrar' }}
        </button>

        <div class="login-footer">
          <p class="demo-info">
            <strong>Acesso:</strong> genilson28pinheiro@gmail.com
          </p>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #C41E3A 0%, #FF6B35 100%);
  padding: 1rem;
}

.login-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  padding: 2.5rem;
  width: 100%;
  max-width: 420px;
}

.login-header {
  text-align: center;
  margin-bottom: 2rem;
}

.logo-container {
  display: flex;
  justify-content: center;
  margin-bottom: 1.5rem;
}

.logo-icon {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #C41E3A, #FF6B35);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 8px 24px rgba(196, 30, 58, 0.3);
}

.login-title {
  font-size: 1.75rem;
  font-weight: bold;
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.login-subtitle {
  color: #6b7280;
  font-size: 0.95rem;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.error-alert {
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  padding: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #991b1b;
  font-size: 0.9rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-label {
  font-weight: 600;
  color: #374151;
  font-size: 0.9rem;
}

.form-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.form-input:focus {
  outline: none;
  border-color: #C41E3A;
  box-shadow: 0 0 0 3px rgba(196, 30, 58, 0.1);
}

.password-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.password-toggle {
  position: absolute;
  right: 0.75rem;
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  transition: color 0.3s ease;
}

.password-toggle:hover {
  color: #C41E3A;
}

.login-button {
  width: 100%;
  padding: 0.875rem;
  background: linear-gradient(135deg, #C41E3A, #FF6B35);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(196, 30, 58, 0.3);
}

.login-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(196, 30, 58, 0.4);
}

.login-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.login-footer {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
}

.demo-info {
  text-align: center;
  font-size: 0.85rem;
  color: #6b7280;
}

.demo-info strong {
  color: #C41E3A;
}

@media (max-width: 480px) {
  .login-card {
    padding: 2rem 1.5rem;
  }

  .login-title {
    font-size: 1.5rem;
  }

  .logo-icon {
    width: 64px;
    height: 64px;
  }
}
</style>
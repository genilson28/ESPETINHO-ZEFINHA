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
          <img src="/logo.png" alt="Logo" class="logo-image" />
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
            autocomplete="email"
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
              autocomplete="current-password"
            />
            <button
              type="button"
              @click="showPassword = !showPassword"
              class="password-toggle"
              aria-label="Mostrar/Ocultar senha"
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
      </form>
    </div>
  </div>
</template>

<style scoped>
.login-container {
  min-height: 100vh;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f3f4f6;
  padding: 1rem;
  overflow: hidden;
}

.login-card {
  background: white;
  border-radius: 20px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  padding: 2.5rem 2rem;
  width: 100%;
  max-width: 420px;
  position: relative;
  animation: slideUp 0.5s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.login-header {
  text-align: center;
  margin-bottom: 2rem;
}

.logo-container {
  display: flex;
  justify-content: center;
  margin-bottom: 1.25rem;
}

.logo-image {
  width: 100px;
  height: auto;
  max-height: 100px;
  object-fit: contain;
  filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.1));
  animation: fadeIn 0.8s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.login-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.5rem;
  letter-spacing: -0.5px;
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
  border-radius: 10px;
  padding: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.625rem;
  color: #991b1b;
  font-size: 0.875rem;
  animation: shake 0.5s;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-10px); }
  75% { transform: translateX(10px); }
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
  border-radius: 10px;
  font-size: 0.95rem;
  transition: all 0.3s ease;
  background: #fafafa;
}

.form-input:hover {
  background: white;
  border-color: #d1d5db;
}

.form-input:focus {
  outline: none;
  border-color: #C41E3A;
  box-shadow: 0 0 0 3px rgba(196, 30, 58, 0.1);
  background: white;
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
  padding: 0.375rem;
  display: flex;
  align-items: center;
  transition: all 0.3s ease;
  border-radius: 6px;
}

.password-toggle:hover {
  color: #C41E3A;
  background: rgba(196, 30, 58, 0.05);
}

.password-toggle:active {
  transform: scale(0.95);
}

.login-button {
  width: 100%;
  padding: 0.875rem;
  background: linear-gradient(135deg, #C41E3A, #FF6B35);
  color: white;
  border: none;
  border-radius: 10px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.625rem;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(196, 30, 58, 0.3);
  margin-top: 0.5rem;
}

.login-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(196, 30, 58, 0.4);
}

.login-button:active:not(:disabled) {
  transform: translateY(0);
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

/* Responsividade Mobile */
@media (max-width: 480px) {
  .login-container {
    padding: 1rem;
  }

  .login-card {
    padding: 2rem 1.5rem;
    border-radius: 16px;
  }

  .logo-image {
    width: 85px;
    max-height: 85px;
  }

  .login-title {
    font-size: 1.5rem;
  }

  .login-subtitle {
    font-size: 0.875rem;
  }

  .form-label {
    font-size: 0.875rem;
  }

  .form-input {
    padding: 0.75rem 0.875rem;
    font-size: 0.9375rem;
  }

  .login-button {
    padding: 0.875rem;
    font-size: 0.9375rem;
  }
}

@media (max-width: 380px) {
  .login-container {
    padding: 0.75rem;
  }

  .login-card {
    padding: 1.75rem 1.25rem;
  }

  .logo-image {
    width: 75px;
    max-height: 75px;
  }

  .login-title {
    font-size: 1.375rem;
  }

  .login-subtitle {
    font-size: 0.8125rem;
  }

  .form-input {
    padding: 0.625rem 0.75rem;
    font-size: 0.875rem;
  }

  .login-button {
    padding: 0.75rem;
    font-size: 0.875rem;
  }
}

/* Ajuste para telas muito baixas */
@media (max-height: 600px) {
  .login-container {
    padding: 0.5rem;
    align-items: flex-start;
    padding-top: 1rem;
  }

  .login-card {
    padding: 1.5rem;
  }

  .logo-image {
    width: 70px;
    max-height: 70px;
  }

  .login-header {
    margin-bottom: 1.25rem;
  }

  .login-title {
    font-size: 1.375rem;
  }

  .login-subtitle {
    font-size: 0.85rem;
  }

  .login-form {
    gap: 1rem;
  }

  .form-group {
    gap: 0.375rem;
  }

  .form-label {
    font-size: 0.85rem;
  }

  .form-input {
    padding: 0.625rem 0.875rem;
    font-size: 0.875rem;
  }

  .login-button {
    padding: 0.75rem;
    margin-top: 0.25rem;
  }

  .error-alert {
    padding: 0.75rem;
    font-size: 0.8125rem;
  }
}
</style>

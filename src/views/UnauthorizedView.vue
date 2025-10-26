<script setup>
import { useRouter } from 'vue-router'
import { ShieldAlert, ArrowLeft } from 'lucide-vue-next'

const router = useRouter()

const goBack = () => {
  router.back()
}

const goHome = () => {
  router.push('/tables')
}
</script>

<template>
  <div class="unauthorized-container">
    <div class="unauthorized-card">
      <div class="icon-container">
        <ShieldAlert :size="80" />
      </div>
      
      <h1 class="title">Acesso Negado</h1>
      <p class="description">
        Você não tem permissão para acessar esta página.
      </p>
      <p class="description">
        Entre em contato com o administrador do sistema se você acredita que isso é um erro.
      </p>

      <div class="actions">
        <button @click="goBack" class="btn-secondary">
          <ArrowLeft :size="20" />
          Voltar
        </button>
        <button @click="goHome" class="btn-primary">
          Ir para Início
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.unauthorized-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f8fafc 0%, #e5e7eb 100%);
  padding: 2rem;
}

.unauthorized-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  padding: 3rem;
  max-width: 500px;
  width: 100%;
  text-align: center;
}

.icon-container {
  display: flex;
  justify-content: center;
  margin-bottom: 2rem;
  color: #C41E3A;
}

.title {
  font-size: 2rem;
  font-weight: bold;
  color: #1f2937;
  margin-bottom: 1rem;
}

.description {
  color: #6b7280;
  font-size: 1rem;
  line-height: 1.6;
  margin-bottom: 0.75rem;
}

.actions {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
  justify-content: center;
}

.btn-primary,
.btn-secondary {
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
  border: none;
  font-size: 1rem;
}

.btn-primary {
  background: linear-gradient(135deg, #C41E3A, #FF6B35);
  color: white;
  box-shadow: 0 4px 12px rgba(196, 30, 58, 0.3);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(196, 30, 58, 0.4);
}

.btn-secondary {
  background: #e5e7eb;
  color: #6b7280;
}

.btn-secondary:hover {
  background: #d1d5db;
}

@media (max-width: 480px) {
  .unauthorized-card {
    padding: 2rem 1.5rem;
  }

  .title {
    font-size: 1.5rem;
  }

  .actions {
    flex-direction: column;
  }

  .btn-primary,
  .btn-secondary {
    width: 100%;
    justify-content: center;
  }
}
</style>